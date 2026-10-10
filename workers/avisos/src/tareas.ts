// Lógica del worker programado: avisos por Telegram + copia de seguridad semanal en R2.
import {
	cargarAlertas,
	crearDb,
	descargarPrecios,
	hoy as hoyEn,
	leerAjustes,
	materializarRecurrentes,
	umbralAlcanzado,
	volcado,
	type Alerta,
	type DB
} from '@novaz/core';
import * as s from '@novaz/core/schema';
import { inArray } from 'drizzle-orm';
import { mensajeAvisos, mensajeResumen } from './mensajes';

export interface Env {
	DB: D1Database;
	ARCHIVOS: R2Bucket;
	TELEGRAM_TOKEN?: string;
	APP_URL?: string;
	/** Solo para pruebas locales (servidor simulado). */
	TELEGRAM_API?: string;
}

const COPIAS_A_CONSERVAR = 12;
export const CRON_AVISOS = '0 7 * * *';
export const CRON_COPIA = '0 3 * * SUN';


export async function avisosDelDia(env: Env, ahora = new Date()) {
	const db = crearDb(env.DB);
	const ajustes = await leerAjustes(db);
	const hoy = hoyEn(ajustes.zonaHoraria, ahora);
	// Operaciones mensuales (aportación, alquiler…) aunque nadie abra la app
	const creados = await materializarRecurrentes(db, hoy);
	if (creados) console.log(`Recurrentes apuntados: ${creados}`);
	// Precio del combustible del día (para el coste de uso de cada vehículo)
	try {
		const precios = await descargarPrecios(ajustes.municipioCombustible, hoy);
		await db.insert(s.ajustes).values({ clave: 'precioCombustible', valor: precios }).onConflictDoUpdate({ target: s.ajustes.clave, set: { valor: precios } });
	} catch (e) {
		console.warn('Precio del combustible no disponible:', (e as Error).message);
	}
	if (!env.TELEGRAM_TOKEN || !ajustes.telegramChatId) return;
	const lunes = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 1;
	await avisar(db, env, ajustes.telegramChatId, hoy, ajustes.urgenteDias, ajustes.nombreTaller, lunes && ajustes.resumenSemanal);
}

/** Umbral que "toca" avisar para una alerta (o null). */
export function umbralDe(a: Alerta): string | null {
	// Lo que tú mismo apuntas como pendiente no se "avisa" cada día: sale en el resumen semanal
	if (a.tipo === 'pendiente') return null;
	if (a.tipo === 'vencimiento' && a.dias != null) {
		const u = umbralAlcanzado(a.dias, a.avisosDias);
		return u == null ? null : String(u);
	}
	// Mantenimiento: avisos por nivel (pronto → urgente → vencido)
	return a.nivel === 'ok' ? null : a.nivel;
}

async function avisar(db: DB, env: Env, chatId: string, hoy: string, urgenteDias: number, taller: string, resumen: boolean) {
	const alertas = await cargarAlertas(db, { hoy, urgenteDias });
	const candidatas = alertas
		.map((a) => ({ a, umbral: umbralDe(a) }))
		.filter((x): x is { a: Alerta; umbral: string } => x.umbral != null)
		.map((x) => ({ ...x, clave: `${x.a.clave}|${x.a.ciclo}|${x.umbral}` }));

	const ya = candidatas.length
		? new Set(
				(await db.select().from(s.avisosEnviados).where(inArray(s.avisosEnviados.clave, candidatas.map((c) => c.clave)))).map((f) => f.clave)
			)
		: new Set<string>();
	const nuevas = candidatas.filter((c) => !ya.has(c.clave));

	if (nuevas.length) {
		await telegram(env, chatId, mensajeAvisos(nuevas.map((n) => n.a), taller, env.APP_URL));
		await db.insert(s.avisosEnviados).values(nuevas.map((n) => ({ clave: n.clave }))).onConflictDoNothing();
	}
	if (resumen) {
		const obras = await db.select().from(s.restauraciones).where(inArray(s.restauraciones.estado, ['en_curso', 'pausada']));
		await telegram(env, chatId, mensajeResumen(alertas, obras.map((o) => o.nombre), taller, hoy, env.APP_URL));
	}
}

async function telegram(env: Env, chatId: string, texto: string) {
	const api = env.TELEGRAM_API || 'https://api.telegram.org';
	const r = await fetch(`${api}/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML', disable_web_page_preview: true })
	});
	if (!r.ok) throw new Error(`Telegram ${r.status}: ${await r.text()}`);
}

export async function copiaDeSeguridad(env: Env) {
	const db = crearDb(env.DB);
	const hoy = hoyEn((await leerAjustes(db)).zonaHoraria);
	const bucket = env.ARCHIVOS;
	const datos = await volcado(db);
	await bucket.put(`copias/novaz-${hoy}.json`, JSON.stringify(datos), { httpMetadata: { contentType: 'application/json' } });
	const lista = await bucket.list({ prefix: 'copias/' });
	const viejas = lista.objects
		.map((o) => o.key)
		.sort()
		.reverse()
		.slice(COPIAS_A_CONSERVAR);
	if (viejas.length) await bucket.delete(viejas);
	console.log(`Copia guardada: copias/novaz-${hoy}.json`);
}
