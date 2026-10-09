import * as s from '@novaz/core/schema';
import { ENTIDADES_ADJUNTO, type EntidadAdjunto } from '@novaz/core/schema';
import { error, json } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';

const MAX_BYTES = 25 * 1024 * 1024;
const PERMITIDOS = /^(image\/(webp|jpeg|png|gif|avif|heic|heif)|application\/pdf|audio\/(mpeg|mp4|ogg|wav|webm|x-m4a|aac))$/;
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

// Subida de un archivo (con miniatura opcional) a R2 + registro en `adjuntos`.
export const POST = async ({ request, locals, platform }) => {
	const fd = await request.formData();
	const archivo = fd.get('archivo');
	const mini = fd.get('mini');
	const entidad = String(fd.get('entidad') ?? '') as EntidadAdjunto;
	const entidadId = Number(fd.get('entidadId'));
	const vehiculoId = fd.get('vehiculoId') ? Number(fd.get('vehiculoId')) : null;
	const pie = (fd.get('pie') as string | null)?.trim() || null;

	if (!(archivo instanceof File)) error(400, 'Falta el archivo');
	if (!ENTIDADES_ADJUNTO.includes(entidad) || !Number.isInteger(entidadId)) error(400, 'Destino no válido');
	if (archivo.size > MAX_BYTES) error(413, 'Archivo demasiado grande (máx. 25 MB)');
	if (!PERMITIDOS.test(archivo.type)) error(415, `Tipo no permitido: ${archivo.type || 'desconocido'}`);

	const ext = EXT[archivo.type] ?? archivo.name.split('.').pop()?.toLowerCase() ?? 'bin';
	const clave = `${entidad}/${entidadId}/${crypto.randomUUID()}.${ext}`;
	const bucket = platform!.env.ARCHIVOS;
	await bucket.put(clave, await archivo.arrayBuffer(), {
		httpMetadata: { contentType: archivo.type },
		customMetadata: { nombre: archivo.name }
	});
	if (mini instanceof File && mini.size) {
		await bucket.put(`${clave}.mini`, await mini.arrayBuffer(), { httpMetadata: { contentType: mini.type } });
	}

	const [fila] = await locals.db
		.insert(s.adjuntos)
		.values({ clave, nombre: archivo.name, mime: archivo.type, bytes: archivo.size, entidad, entidadId, vehiculoId, pie })
		.returning();

	// Primera foto de un vehículo → portada automática
	if (vehiculoId && archivo.type.startsWith('image/')) {
		await locals.db
			.update(s.vehiculos)
			.set({ portadaId: fila.id })
			.where(and(eq(s.vehiculos.id, vehiculoId), isNull(s.vehiculos.portadaId)));
	}

	return json({ id: fila.id, clave, url: `/archivos/${clave}` });
};
