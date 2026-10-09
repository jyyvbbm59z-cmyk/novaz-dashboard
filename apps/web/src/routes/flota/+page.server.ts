import { resumenVehiculos } from '$lib/server/datos';

export const load = async ({ locals, parent }) => {
	const { alertas } = await parent();
	return { vehiculos: await resumenVehiculos(locals.db, alertas) };
};
