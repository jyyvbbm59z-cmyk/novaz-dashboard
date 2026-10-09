import { EFECTOS, EVENTOS_MOMENTO, SONIDOS, type Momento } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { enviarTelegram } from '$lib/server/telegram';

async function guardar(db: App.Locals['db'], valores: Record<string, unknown>) {
	for (const [clave, valor] of Object.entries(valores)) {
		await db.insert(s.ajustes).values({ clave, valor }).onConflictDoUpdate({ target: s.ajustes.clave, set: { valor } });
	}
}

export const load = async ({ platform }) => ({ telegramConfigurado: Boolean(platform?.env.TELEGRAM_TOKEN) });

export const actions = {
	general: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const acento = f.texto('acento') ?? '#f2a33a';
		if (!/^#[0-9a-f]{6}$/i.test(acento)) throw new ErrorFormulario('Color no válido');
		const tema = f.texto('tema');
		await guardar(locals.db, {
			nombreTaller: f.obligatorio('nombreTaller', 'nombre'),
			lema: f.texto('lema') ?? '',
			acento,
			tema: tema === 'claro' || tema === 'sistema' ? tema : 'oscuro'
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
			resumenSemanal: f.bool('resumenSemanal')
		});
		return { mensaje: 'Guardado' };
	}),

	probarTelegram: accion(async ({ locals, platform }) => {
		const token = platform?.env.TELEGRAM_TOKEN;
		const chat = locals.ajustes.telegramChatId;
		if (!token) throw new ErrorFormulario('Falta el secreto TELEGRAM_TOKEN (ver README)');
		if (!chat) throw new ErrorFormulario('Guarda primero el chat ID');
		try {
			await enviarTelegram(token, chat, `🔧 <b>${locals.ajustes.nombreTaller}</b>\nLos avisos llegan aquí. ¡A rodar!`);
		} catch (e) {
			throw new ErrorFormulario(`Telegram: ${(e as Error).message}`);
		}
		return { mensaje: 'Mensaje enviado. Mira Telegram' };
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
