import { parsearCampos, type DB } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { ErrorFormulario, leer } from './form';

/** Lee el formulario de vehículo (alta y edición). */
export async function datosVehiculo(db: DB, fd: FormData) {
	const f = leer(fd);
	const tipoId = f.id('tipoId');
	const tipo = await db.select().from(s.tiposVehiculo).where(eq(s.tiposVehiculo.id, tipoId)).get();
	if (!tipo) throw new ErrorFormulario('Tipo de vehículo no válido');

	const crudos: Record<string, string> = {};
	for (const [k, v] of fd.entries()) if (k.startsWith('campo_') && typeof v === 'string') crudos[k.slice(6)] = v;
	const campos = parsearCampos(tipo.campos, crudos);
	if (!campos.ok) throw new ErrorFormulario(`Revisa: ${Object.keys(campos.errores).join(', ')}`);

	const propietario = f.texto('propietario') === 'tercero' ? 'tercero' : 'novaz';
	let contactoId = propietario === 'tercero' ? f.idOpcional('contactoId') : null;
	const nuevo = propietario === 'tercero' ? f.texto('contactoNuevo') : null;
	if (nuevo) {
		const [c] = await db.insert(s.contactos).values({ nombre: nuevo }).returning({ id: s.contactos.id });
		contactoId = c.id;
	}

	return {
		tipoId,
		alias: f.obligatorio('alias', 'nombre'),
		marca: f.texto('marca'),
		modelo: f.texto('modelo'),
		anio: f.entero('anio'),
		matricula: f.texto('matricula')?.toUpperCase().replace(/\s+/g, ' ') ?? null,
		bastidor: f.texto('bastidor')?.toUpperCase() ?? null,
		estadoId: f.idOpcional('estadoId'),
		propietario: propietario as 'novaz' | 'tercero',
		contactoId,
		fechaAlta: f.fecha('fechaAlta'),
		notas: f.texto('notas'),
		campos: campos.valores
	};
}
