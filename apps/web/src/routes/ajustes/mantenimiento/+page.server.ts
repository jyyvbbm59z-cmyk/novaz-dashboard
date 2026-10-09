import * as s from '@novaz/core/schema';
import { asc, eq } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals }) => ({
	planes: await locals.db.select().from(s.planesMantenimiento).orderBy(asc(s.planesMantenimiento.nombre))
});

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const ambito = f.texto('ambito') ?? 'todos';
		const [clase, valor] = ambito.split(':');
		const v = {
			nombre: f.obligatorio('nombre', 'nombre'),
			cadaKm: f.entero('cadaKm'),
			cadaMeses: f.entero('cadaMeses'),
			tipoVehiculoId: clase === 'tipo' ? Number(valor) : null,
			vehiculoId: clase === 'vehiculo' ? Number(valor) : null,
			avisoKm: f.entero('avisoKm') ?? 500,
			avisoDias: f.entero('avisoDias') ?? 30,
			notas: f.texto('notas'),
			activo: f.bool('activo')
		};
		if (!v.cadaKm && !v.cadaMeses) throw new ErrorFormulario('Indica cada cuántos km o meses');
		if (id) await locals.db.update(s.planesMantenimiento).set(v).where(eq(s.planesMantenimiento.id, id));
		else await locals.db.insert(s.planesMantenimiento).values(v);
		return { mensaje: 'Plan guardado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.planesMantenimiento).where(eq(s.planesMantenimiento.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Plan borrado' };
	})
};
