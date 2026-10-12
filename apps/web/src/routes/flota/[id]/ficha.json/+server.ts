import { error } from '@sveltejs/kit';
import { exportarFicha } from '$lib/server/ficha';

/** La ficha técnica en formato «novaz-ficha» (para guardarla, compartirla o volver a importarla). */
export const GET = async ({ params, locals }) => {
	const ficha = await exportarFicha(locals.db, Number(params.id));
	if (!ficha.vehiculo) error(404, 'Vehículo no encontrado');
	const nombre = (ficha.vehiculo ?? 'ficha').normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase();
	return new Response(JSON.stringify(ficha, null, 2), {
		headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="ficha-${nombre}.json"` }
	});
};
