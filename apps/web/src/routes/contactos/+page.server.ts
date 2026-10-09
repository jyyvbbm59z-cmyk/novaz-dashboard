import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { accion, leer } from '$lib/server/form';

export const load = async ({ locals }) => {
	const vehiculos = await locals.db
		.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, contactoId: s.vehiculos.contactoId })
		.from(s.vehiculos)
		.where(eq(s.vehiculos.propietario, 'tercero'));
	return { vehiculosTerceros: vehiculos };
};

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const v = {
			nombre: f.obligatorio('nombre', 'nombre'),
			telefono: f.texto('telefono'),
			email: f.texto('email'),
			nif: f.texto('nif')?.toUpperCase() ?? null,
			direccion: f.texto('direccion'),
			notas: f.texto('notas')
		};
		if (id) await locals.db.update(s.contactos).set(v).where(eq(s.contactos.id, id));
		else await locals.db.insert(s.contactos).values(v);
		return { mensaje: id ? 'Contacto actualizado' : 'Contacto creado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.contactos).where(eq(s.contactos.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Contacto borrado' };
	})
};
