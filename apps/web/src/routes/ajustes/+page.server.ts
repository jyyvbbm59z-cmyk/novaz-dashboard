import { datosInforme, EFECTOS, EVENTOS_MOMENTO, mensajeInforme, SONIDOS, type Momento } from '@novaz/core';
import { precioCombustibleHoy } from '$lib/server/combustible';
import * as s from '@novaz/core/schema';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { enviarTelegram, llamarTelegram, secretoWebhook } from '$lib/server/telegram';

async function guardar(db: App.Locals['db'], valores: Record<string, unknown>) {
	for (const [clave, valor] of Object.entries(valores)) {
		await db.insert(s.ajustes).values({ clave, valor }).onConflictDoUpdate({ target: s.ajustes.clave, set: { valor } });
	}
}

/** Estado del webhook (bot en las dos direcciones): si está conectado a esta app y el último error que vio Telegram. */
async function estadoBot(env: App.Platform['env'] | undefined, origen: string) {
	if (!env?.TELEGRAM_TOKEN) return null;
	try {
		const info = await Promise.race([
			llamarTelegram<{ url?: string; last_error_message?: string; last_error_date?: number; pending_update_count?: number }>(env, 'getWebhookInfo'),
			new Promise<never>((_, no) => setTimeout(() => no(new Error('Telegram no responde')), 3000))
		]);
		// Telegram guarda el último error aunque ya entregue bien: solo cuenta si hay mensajes atascados o es de hace nada
		const reciente = Boolean(info.last_error_date) && ((info.pending_update_count ?? 0) > 0 || Date.now() / 1000 - info.last_error_date! < 300);
		return { conectado: info.url === `${origen}/api/telegram`, otraUrl: info.url && info.url !== `${origen}/api/telegram` ? info.url : null, error: reciente ? (info.last_error_message ?? null) : null, pendientes: info.pending_update_count ?? 0 };
	} catch (e) {
		return { conectado: false, otraUrl: null, error: (e as Error).message, pendientes: 0 };
	}
}

export const load = async ({ platform, url }) => ({ telegramConfigurado: Boolean(platform?.env.TELEGRAM_TOKEN), bot: await estadoBot(platform?.env, url.origin) });

export const actions = {
	general: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const acento = f.texto('acento') ?? '#ebab00';
		if (!/^#[0-9a-f]{6}$/i.test(acento)) throw new ErrorFormulario('Color no válido');
		const tema = f.texto('tema');
		await guardar(locals.db, {
			nombreTaller: f.obligatorio('nombreTaller', 'nombre'),
			lema: f.texto('lema') ?? '',
			acento,
			tema: tema === 'claro' || tema === 'sistema' ? tema : 'oscuro',
			logoApp: f.texto('logoApp') === 'texto' ? 'texto' : 'novaz'
		});
		return { mensaje: 'Guardado' };
	}),

	avisos: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const zona = f.texto('zonaHoraria') ?? 'Europe/Madrid';
		try {
			new Intl.DateTimeFormat('es', { timeZone: zona });
		} catch {
			throw new ErrorFormulario('Zona horaria no válida');
		}
		await guardar(locals.db, {
			urgenteDias: Math.max(0, f.entero('urgenteDias') ?? 7),
			zonaHoraria: zona,
			telegramChatId: f.texto('telegramChatId'),
			parteDiario: f.texto('modoAvisos') !== 'umbrales',
			resumenSemanal: f.bool('resumenSemanal')
		});
		return { mensaje: 'Guardado' };
	}),

	probarTelegram: accion(async ({ locals, platform, url }) => {
		const token = platform?.env.TELEGRAM_TOKEN;
		const chat = locals.ajustes.telegramChatId;
		if (!token) throw new ErrorFormulario('Falta el token del bot en Cloudflare: añade TELEGRAM_TOKEN como Secreto en novaz-dashboard');
		if (!chat) throw new ErrorFormulario('Guarda primero el chat ID');
		const { ajustes, hoy, db } = locals;
		let texto = `<b>${ajustes.nombreTaller}</b>\nLos avisos de Telegram están conectados.`;
		if (ajustes.parteDiario) {
			// El informe de hoy tal cual llegará cada mañana (sin marcar nada como avisado)
			const lunes = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 1;
			const precios = await precioCombustibleHoy(locals);
			texto = mensajeInforme(await datosInforme(db, { hoy, ajustes, precios, nuevas: new Set(), app: url.origin, conObras: lunes && ajustes.resumenSemanal }));
		}
		try {
			await enviarTelegram(token, chat, texto);
		} catch (e) {
			throw new ErrorFormulario(`Telegram: ${(e as Error).message}`);
		}
		return { mensaje: 'Mensaje enviado. Mira Telegram' };
	}),

	/** Conecta el bot en las dos direcciones: Telegram manda tus mensajes a /api/telegram con un secreto. */
	conectarBot: accion(async ({ platform, url, locals }) => {
		const env = platform?.env;
		if (!env?.TELEGRAM_TOKEN) throw new ErrorFormulario('Falta el token del bot en Cloudflare: añade TELEGRAM_TOKEN como Secreto en novaz-dashboard');
		if (!locals.ajustes.telegramChatId) throw new ErrorFormulario('Guarda primero el chat ID: el bot solo te hará caso a ti');
		try {
			await llamarTelegram(env, 'setWebhook', {
				url: `${url.origin}/api/telegram`,
				secret_token: await secretoWebhook(env.TELEGRAM_TOKEN),
				allowed_updates: ['message', 'callback_query'],
				drop_pending_updates: true
			});
			await llamarTelegram(env, 'setMyCommands', {
				commands: [
					{ command: 'hoy', description: 'El informe de hoy' },
					{ command: 'agenda', description: 'Lo que viene en 30 días' },
					{ command: 'compras', description: 'La lista de la compra' },
					{ command: 'ayuda', description: 'Qué puedo apuntar' }
				]
			});
		} catch (e) {
			throw new ErrorFormulario(`Telegram: ${(e as Error).message}`);
		}
		return { mensaje: 'Bot conectado. Escríbele algo en Telegram' };
	}),

	contabilidad: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const pago = f.texto('pagoPorDefecto');
		await guardar(locals.db, {
			pagoPorDefecto: pago === 'caja' || pago === 'socio' ? pago : 'banco',
			tipoImpuestoSociedades: Math.min(Math.max(f.decimal('tipoImpuestoSociedades') ?? 25, 0), 100)
		});
		return { mensaje: 'Guardado' };
	}),

	facturacion: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const tarifa = f.euros('tarifaHora');
		await guardar(locals.db, {
			fiscal: {
				razonSocial: f.texto('razonSocial') ?? '',
				nif: f.texto('nif')?.toUpperCase() ?? '',
				direccion: f.texto('direccion') ?? '',
				email: f.texto('email') ?? '',
				telefono: f.texto('telefono') ?? '',
				iban: f.texto('iban')?.toUpperCase() ?? ''
			},
			serieFactura: (f.texto('serie') ?? 'NVZ').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'NVZ',
			tarifaHoraCent: tarifa != null && tarifa >= 0 ? tarifa : 3500,
			pieFactura: f.texto('pie') ?? ''
		});
		return { mensaje: 'Datos de facturación guardados' };
	}),

	logo: accion(async ({ request, locals }) => {
		const valor = leer(await request.formData()).obligatorio('valor');
		if (valor !== 'novaz' && valor !== 'ninguno' && !/^ajuste\/0\/[\w-]+\.(png|jpe?g)$/i.test(valor)) throw new ErrorFormulario('Usa una imagen PNG o JPG');
		await guardar(locals.db, { logoFactura: valor });
		return { mensaje: valor === 'ninguno' ? 'Facturas sin logo' : 'Logo actualizado' };
	}),

	momentos: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const f = leer(fd);
		const momentos = {} as Record<string, Momento>;
		for (const ev of EVENTOS_MOMENTO) {
			const efecto = f.texto(`${ev}_efecto`) as Momento['efecto'];
			const sonido = f.texto(`${ev}_sonido`) as Momento['sonido'];
			momentos[ev] = {
				efecto: EFECTOS.includes(efecto) ? efecto : 'ninguno',
				sonido: SONIDOS.includes(sonido) ? sonido : 'ninguno',
				...(f.texto(`${ev}_url`) ? { sonidoUrl: f.texto(`${ev}_url`)! } : {})
			};
		}
		await guardar(locals.db, { momentosActivos: f.bool('momentosActivos'), momentos });
		return { mensaje: 'Momentos guardados' };
	})
};
