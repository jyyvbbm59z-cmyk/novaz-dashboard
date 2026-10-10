import { cargarAlertas, EFECTOS, estadoTaller, EVENTOS_MOMENTO, mensajeParte, SONIDOS, type Momento } from '@novaz/core';
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
		if (!token) throw new ErrorFormulario('Falta el secreto TELEGRAM_TOKEN (ver README)');
		if (!chat) throw new ErrorFormulario('Guarda primero el chat ID');
		const { ajustes, hoy, db } = locals;
		let texto = `🔧 <b>${ajustes.nombreTaller}</b>\nLos avisos llegan aquí. ¡A rodar!`;
		if (ajustes.parteDiario) {
			// El parte de hoy tal cual llegará cada mañana (sin marcar nada como avisado)
			const alertas = await cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true });
			const t = await estadoTaller(db, hoy, alertas);
			const lunes = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 1;
			texto = mensajeParte({ taller: ajustes.nombreTaller, hoy, app: url.origin, alertas, nuevas: new Set(), local: t.local, compras: t.compras, fueraDeSitio: t.fueraDeSitio, obras: lunes && ajustes.resumenSemanal ? t.obras : undefined });
		}
		try {
			await enviarTelegram(token, chat, texto);
		} catch (e) {
			throw new ErrorFormulario(`Telegram: ${(e as Error).message}`);
		}
		return { mensaje: 'Mensaje enviado. Mira Telegram' };
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
