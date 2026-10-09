import { volcado } from '@novaz/core';

export const GET = async ({ locals }) => {
	const datos = await volcado(locals.db);
	return new Response(JSON.stringify(datos, null, 1), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="novaz-copia-${locals.hoy}.json"`
		}
	});
};
