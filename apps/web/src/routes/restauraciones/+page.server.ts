import * as s from '@novaz/core/schema';
import { redirect } from '@sveltejs/kit';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { crearRestauracion } from '$lib/server/acciones';
import { avanceRestauraciones } from '$lib/server/datos';
import { accion, leer } from '$lib/server/form';

export const load = async ({ locals }) => {
	const { db } = locals;
	const filas = await db
		.select({ r: s.restauraciones, vehiculo: s.vehiculos.alias, matricula: s.vehiculos.matricula, portada: s.adjuntos.clave })
		.from(s.restauraciones)
		.innerJoin(s.vehiculos, eq(s.restauraciones.vehiculoId, s.vehiculos.id))
		.leftJoin(s.adjuntos, eq(s.vehiculos.portadaId, s.adjuntos.id))
		.orderBy(desc(s.restauraciones.fechaInicio));
	const ids = filas.map((f) => f.r.id);
	const avances = await avanceRestauraciones(db, ids);

	const [horas, gastos] = ids.length
		? await db.batch([
				db
					.select({ id: s.entradas.restauracionId, total: sql<number>`coalesce(sum(${s.entradas.horas}), 0)` })
					.from(s.entradas)
					.where(inArray(s.entradas.restauracionId, ids))
					.groupBy(s.entradas.restauracionId),
				db
					.select({ id: s.movimientos.restauracionId, total: sql<number>`coalesce(sum(${s.movimientos.importeCent}), 0)` })
					.from(s.movimientos)
					.where(inArray(s.movimientos.restauracionId, ids))
					.groupBy(s.movimientos.restauracionId)
			])
		: [[], []];

	return {
		restauraciones: filas.map(({ r, ...resto }) => {
			const a = avances.get(r.id);
			return {
				...r,
				...resto,
				avance: a && a.total ? a.hechas / a.total : 0,
				horas: Number(horas.find((h) => h.id === r.id)?.total ?? 0),
				gasto: Number(gastos.find((g) => g.id === r.id)?.total ?? 0)
			};
		})
	};
};

export const actions = {
	default: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const id = await crearRestauracion(locals, leer(fd).id('vehiculoId'), fd);
		redirect(303, `/restauraciones/${id}`);
	})
};
