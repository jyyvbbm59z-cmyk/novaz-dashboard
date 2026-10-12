import * as s from '@novaz/core/schema';
import { error, redirect } from '@sveltejs/kit';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { crearRestauracion } from '$lib/server/acciones';
import { avanceRestauraciones } from '$lib/server/datos';
import { accion, leer } from '$lib/server/form';
import { soloVisibles, veVehiculo } from '$lib/server/usuarios';

export const load = async ({ locals }) => {
	const { db } = locals;
	const filas = await db
		.select({ r: s.restauraciones, vehiculo: s.vehiculos.alias, matricula: s.vehiculos.matricula, portada: s.adjuntos.clave })
		.from(s.restauraciones)
		.innerJoin(s.vehiculos, eq(s.restauraciones.vehiculoId, s.vehiculos.id))
		.leftJoin(s.adjuntos, eq(s.vehiculos.portadaId, s.adjuntos.id))
		.orderBy(desc(s.restauraciones.fechaInicio));
	const visibles = soloVisibles(locals.yo, filas, (f) => f.r.vehiculoId);
	filas.length = 0;
	filas.push(...visibles);
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
				gasto: locals.permisos.includes('dinero') ? Number(gastos.find((g) => g.id === r.id)?.total ?? 0) : null,
				presupuestoCent: locals.permisos.includes('dinero') ? r.presupuestoCent : null
			};
		})
	};
};

export const actions = {
	default: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const vehiculoId = leer(fd).id('vehiculoId');
		if (!veVehiculo(locals.yo, vehiculoId)) error(403, 'Ese vehículo no es tuyo');
		const id = await crearRestauracion(locals, vehiculoId, fd);
		redirect(303, `/restauraciones/${id}`);
	})
};
