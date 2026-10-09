import { dev } from '$app/environment';
import { crearDb, hoy, leerAjustes, materializarRecurrentes } from '@novaz/core';
import { error, type Handle } from '@sveltejs/kit';
import { audSinVerificar, verificarAccess } from '$lib/server/auth';

const HEX = /^#[0-9a-f]{3,8}$/i;

// Las operaciones recurrentes (aportación mensual…) se apuntan una vez al día por instancia.
let recurrentesAl = '';

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
		// Ayuda de instalación: si Access ya está delante, el token trae el AUD (no es secreto) y lo mostramos.
		const aud = audSinVerificar(event.request.headers.get('cf-access-jwt-assertion'));
		const ayuda = aud
			? `\n\nAccess ya está activo. El AUD de esta aplicación es:\n\n${aud}\n\nPonlo en ACCESS_AUD (apps/web/wrangler.jsonc).`
			: '\n\nNo llega ningún token de Access: revisa que la aplicación de Access cubra esta URL.';
		return new Response(`Configura Cloudflare Access (ACCESS_TEAM_DOMAIN y ACCESS_AUD). Ver README.${ayuda}`, {
			status: 503,
			headers: { 'content-type': 'text/plain; charset=utf-8' }
		});
	}

	event.locals.db = crearDb(env.DB);
	event.locals.ajustes = await leerAjustes(event.locals.db);
	event.locals.hoy = hoy(event.locals.ajustes.zonaHoraria);
	if (recurrentesAl !== event.locals.hoy) {
		recurrentesAl = event.locals.hoy;
		await materializarRecurrentes(event.locals.db, event.locals.hoy).catch((e) => {
			recurrentesAl = '';
			console.error('Recurrentes:', e);
		});
	}

	const { tema, acento } = event.locals.ajustes;
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%novaz.tema%', ['oscuro', 'claro', 'sistema'].includes(tema) ? tema : 'oscuro')
				.replace('%novaz.estilo%', HEX.test(acento) ? `--acento:${acento}` : '')
	});
};
