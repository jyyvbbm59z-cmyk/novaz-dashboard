import { dev } from '$app/environment';
import { crearDb, hoy, leerAjustes, materializarRecurrentes } from '@novaz/core';
import { error, type Handle } from '@sveltejs/kit';
import { audSinVerificar, verificarAccess } from '$lib/server/auth';
import { secretoWebhook } from '$lib/server/telegram';
import { identificar, yoLocal } from '$lib/server/usuarios';
import { permisoDeRuta, NOMBRE_PERMISO } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';

const HEX = /^#[0-9a-f]{3,8}$/i;

// Las operaciones recurrentes (aportación mensual…) se apuntan una vez al día por instancia.
let recurrentesAl = '';

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	if (!env?.DB) error(500, 'Falta el binding DB de D1');

	if (event.url.pathname === '/api/telegram' && event.request.method === 'POST') {
		// El webhook del bot no pasa por Access: se identifica con el secreto que le dimos a Telegram al conectarlo
		const recibido = event.request.headers.get('x-telegram-bot-api-secret-token');
		if (!env.TELEGRAM_TOKEN || !recibido || recibido !== (await secretoWebhook(env.TELEGRAM_TOKEN))) return new Response('No autorizado', { status: 401 });
		event.locals.usuario = 'telegram';
	} else if (dev || env.PERMITIR_SIN_ACCESS === 'si') {
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

	// Quién es y qué puede ver (el webhook de Telegram se identifica luego por el chat)
	event.locals.yo = null;
	event.locals.permisos = [];
	if (event.locals.usuario !== 'telegram') {
		const email = event.locals.usuario === 'local' ? (dev ? env.USUARIO_DEV : null) : event.locals.usuario;
		const yo = email ? await identificar(event.locals.db, email, event.locals.ajustes) : yoLocal(event.locals.ajustes);
		if (!yo) return sinAcceso(event.locals.usuario, event.locals.ajustes.nombreTaller);
		event.locals.yo = yo;
		event.locals.permisos = yo.permisos;
		// Quien solo ve sus vehículos no entra en los de otros (ni en contactos, que son del taller)
		if (yo.vehiculos) {
			const v = event.url.pathname.match(/^\/flota\/(\d+)/);
			const r = event.url.pathname.match(/^\/restauraciones\/(\d+)/);
			const deObra = r ? (await event.locals.db.select({ v: s.restauraciones.vehiculoId }).from(s.restauraciones).where(eq(s.restauraciones.id, Number(r[1]))).get())?.v : null;
			if ((v && !yo.vehiculos.includes(Number(v[1]))) || (r && (deObra == null || !yo.vehiculos.includes(deObra))) || /^\/contactos(\/|$)/.test(event.url.pathname)) {
				if (event.request.method === 'GET') return new Response(null, { status: 303, headers: { location: '/flota' } });
				return new Response('Ese vehículo no es tuyo', { status: 403 });
			}
		}
		const hace = permisoDeRuta(event.url.pathname);
		if (hace && !yo.permisos.includes(hace)) {
			if (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html')) return new Response(null, { status: 303, headers: { location: '/' } });
			return new Response(`Sin permiso: hace falta «${NOMBRE_PERMISO[hace].nombre}»`, { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });
		}
	}
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

/** Página para alguien que entra por Access pero no está dado de alta en la app. */
function sinAcceso(email: string, taller: string) {
	const esc = (x: string) => x.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
	return new Response(
		`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(taller)}</title>
<body style="font-family:system-ui,sans-serif;background:#0d0e10;color:#ecebe8;display:grid;place-items:center;min-height:100dvh;margin:0;padding:24px">
<main style="max-width:28rem"><h1 style="font-size:1.4rem">Aún no tienes acceso</h1>
<p style="color:#a3a8b0;line-height:1.5">Has entrado como <b>${esc(email)}</b>, pero esta cuenta no está dada de alta en ${esc(taller)}. Pide al administrador que te añada en Ajustes → Usuarios.</p></main></body></html>`,
		{ status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
	);
}
