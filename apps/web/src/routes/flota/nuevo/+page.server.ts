import * as s from '@novaz/core/schema';
import { redirect } from '@sveltejs/kit';
import { accion, leer } from '$lib/server/form';
import { registrarKm } from '$lib/server/datos';
import { datosVehiculo } from '$lib/server/vehiculos';

export const load = async ({ locals }) => {
	const hayUsuarios = !!locals.yo?.id;
	// Los de quien no administra el taller nacen privados; los del administrador, del taller
	return { privado: hayUsuarios ? !locals.permisos.includes('ajustes') : null };
};

export const actions = {
	default: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const datos = await datosVehiculo(locals.db, fd);
		// Privado (suyo) o del taller (de nadie)
		const usuarioId = fd.get('privado') === 'si' && locals.yo?.id ? locals.yo.id : null;
		const [v] = await locals.db.insert(s.vehiculos).values({ ...datos, usuarioId }).returning({ id: s.vehiculos.id });
		await registrarKm(locals.db, v.id, datos.fechaAlta ?? locals.hoy, leer(fd).entero('km'));
		redirect(303, `/flota/${v.id}`);
	})
};
