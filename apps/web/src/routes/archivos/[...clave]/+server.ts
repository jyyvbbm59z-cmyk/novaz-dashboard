import { error } from '@sveltejs/kit';

// Sirve archivos de R2. Las claves son únicas e inmutables → caché larga.
export const GET = async ({ params, url, platform, request }) => {
	const bucket = platform!.env.ARCHIVOS;
	const clave = params.clave;
	let obj = url.searchParams.has('mini') ? await bucket.get(`${clave}.mini`) : null;
	obj ??= await bucket.get(clave, { range: request.headers });
	if (!obj) error(404, 'Archivo no encontrado');

	const h = new Headers();
	obj.writeHttpMetadata(h);
	h.set('etag', obj.httpEtag);
	h.set('cache-control', 'private, max-age=31536000, immutable');
	const nombre = obj.customMetadata?.nombre;
	if (nombre && url.searchParams.has('descargar')) h.set('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`);
	return new Response('body' in obj ? (obj as R2ObjectBody).body : null, { headers: h });
};
