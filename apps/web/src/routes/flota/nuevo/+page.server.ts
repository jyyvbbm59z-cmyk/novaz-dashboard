import * as s from '@novaz/core/schema';
import { redirect } from '@sveltejs/kit';
import { accion, leer } from '$lib/server/form';
import { registrarKm } from '$lib/server/datos';
import { datosVehiculo } from '$lib/server/vehiculos';

export const actions = {
	default: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const datos = await datosVehiculo(locals.db, fd);
		const [v] = await locals.db.insert(s.vehiculos).values(datos).returning({ id: s.vehiculos.id });
		await registrarKm(locals.db, v.id, datos.fechaAlta ?? locals.hoy, leer(fd).entero('km'));
		redirect(303, `/flota/${v.id}`);
	})
};
