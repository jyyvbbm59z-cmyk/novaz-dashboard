import { cargarAgenda } from '$lib/server/agenda';

export const load = async ({ locals }) => cargarAgenda(locals);
