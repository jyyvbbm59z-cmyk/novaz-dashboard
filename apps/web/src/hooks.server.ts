import { dev } from '$app/environment';
import { crearDb, hoy, leerAjustes } from '@novaz/core';
import { error, type Handle } from '@sveltejs/kit';
import { verificarAccess } from '$lib/server/auth';

const HEX = /^#[0-9a-f]{3,8}$/i;

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	if (!env?.DB) error(500, 'Falta el binding DB de D1');

	if (dev || env.PERMITIR_SIN_ACCESS === 'si') {
		event.locals.usuario = 'local';
	} else if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
		const email = await verificarAccess(event.request, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
		if (!email) return new Response('No autorizado', { status: 401 });
		event.locals.usuario = email;
	} else {
		// Nunca servir datos sin protección: Access debe estar configurado.
		return new Response('Configura Cloudflare Access (ACCESS_TEAM_DOMAIN y ACCESS_AUD). Ver README.', { status: 503 });
	}

	event.locals.db = crearDb(env.DB);
	event.locals.ajustes = await leerAjustes(event.locals.db);
	event.locals.hoy = hoy(event.locals.ajustes.zonaHoraria);

	const { tema, acento } = event.locals.ajustes;
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%novaz.tema%', ['oscuro', 'claro', 'sistema'].includes(tema) ? tema : 'oscuro')
				.replace('%novaz.estilo%', HEX.test(acento) ? `--acento:${acento}` : '')
	});
};
