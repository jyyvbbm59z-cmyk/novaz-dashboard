import * as s from '@novaz/core/schema';
import { asc, eq } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals }) => ({
	planes: await locals.db.select().from(s.planesMantenimiento).orderBy(asc(s.planesMantenimiento.vehiculoId), asc(s.planesMantenimiento.orden), asc(s.planesMantenimiento.nombre))
});

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const ambito = f.texto('ambito') ?? 'todos';
		const [clase, valor] = ambito.split(':');
		const cada = f.entero('cada');
		const unidad = f.texto('unidad');
		const tareas = (f.texto('tareas') ?? '')
			.split('\n')
			.map((t) => t.replace(/^[-*•]\s*/, '').trim())
			.filter(Boolean);
		const v = {
			codigo: f.texto('codigo')?.toUpperCase().slice(0, 6) ?? null,
			nombre: f.obligatorio('nombre', 'nombre'),
			cadaKm: f.entero('cadaKm'),
			cadaMeses: cada && unidad === 'meses' ? cada : cada && unidad === 'anios' ? cada * 12 : null,
			cadaDias: cada && unidad === 'dias' ? cada : cada && unidad === 'semanas' ? cada * 7 : null,
			tareas,
			incluye: f.lista('incluye').map(Number).filter((n) => Number.isInteger(n) && n !== id),
			orden: f.entero('orden') ?? 0,
			tipoVehiculoId: clase === 'tipo' ? Number(valor) : null,
			vehiculoId: clase === 'vehiculo' ? Number(valor) : null,
			avisoKm: f.entero('avisoKm') ?? 500,
			avisoDias: f.entero('avisoDias') ?? 30,
			notas: f.texto('notas'),
			activo: f.bool('activo')
		};
		if (!v.cadaKm && !v.cadaMeses && !v.cadaDias) throw new ErrorFormulario('Indica cada cuánto tiempo o cuántos km');
		if (id) await locals.db.update(s.planesMantenimiento).set(v).where(eq(s.planesMantenimiento.id, id));
		else await locals.db.insert(s.planesMantenimiento).values(v);
		return { mensaje: 'Plan guardado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.planesMantenimiento).where(eq(s.planesMantenimiento.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Plan borrado' };
	})
};
