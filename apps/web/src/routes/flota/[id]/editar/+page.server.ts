import * as s from '@novaz/core/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { borrarAdjuntos } from '$lib/server/adjuntos';
import { accion } from '$lib/server/form';
import { datosVehiculo } from '$lib/server/vehiculos';

export const load = async ({ params, locals }) => {
	const v = await locals.db.select().from(s.vehiculos).where(eq(s.vehiculos.id, Number(params.id))).get();
	if (!v) error(404, 'Vehículo no encontrado');
	return { vehiculo: v };
};

export const actions = {
	guardar: accion(async ({ request, params, locals }) => {
		const datos = await datosVehiculo(locals.db, await request.formData());
		await locals.db
			.update(s.vehiculos)
			.set({ ...datos, actualizado: sql`(datetime('now'))` })
			.where(eq(s.vehiculos.id, Number(params.id)));
		redirect(303, `/flota/${params.id}?pestana=datos`);
	}),
	borrar: accion(async ({ params, locals, platform }) => {
		const id = Number(params.id);
		const adjs = await locals.db.select({ id: s.adjuntos.id }).from(s.adjuntos).where(eq(s.adjuntos.vehiculoId, id));
		await borrarAdjuntos(locals.db, platform!.env.ARCHIVOS, adjs.map((a) => a.id));
		// Los movimientos se conservan (contabilidad) pero se desvinculan
		await locals.db.update(s.movimientos).set({ vehiculoId: null }).where(eq(s.movimientos.vehiculoId, id));
		await locals.db.delete(s.vehiculos).where(eq(s.vehiculos.id, id));
		redirect(303, '/flota');
	})
};
