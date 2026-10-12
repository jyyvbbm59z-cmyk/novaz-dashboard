// Lógica del worker programado: avisos por Telegram + copia de seguridad semanal en R2.
import {
	cargarAlertas,
	crearDb,
	descargarPrecios,
	datosInforme,
	mensajeInforme,
	normalizarPermisos,
	PERMISOS,
	recortarInforme,
	hoy as hoyEn,
	leerAjustes,
	materializarRecurrentes,
	umbralAlcanzado,
	volcado,
	type Ajustes,
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
	// Las métricas de uso se guardan 180 días
	await env.DB.prepare("DELETE FROM uso WHERE momento < datetime('now', '-180 days')").run().catch(() => {});
	// Precio del combustible del día (para el coste de uso de cada vehículo)
	let precios = ajustes.precioCombustible;
	try {
		precios = await descargarPrecios(ajustes.municipioCombustible, hoy);
		await db.insert(s.ajustes).values({ clave: 'precioCombustible', valor: precios }).onConflictDoUpdate({ target: s.ajustes.clave, set: { valor: precios } });
	} catch (e) {
		console.warn('Precio del combustible no disponible:', (e as Error).message);
	}
	if (!env.TELEGRAM_TOKEN) return;
	const para = await destinatarios(db, ajustes);
	if (!para.length) return;
	const lunes = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 1;
	// Cada uno elige en su perfil: parte diario, solo avisos o nada (y el resumen de los lunes)
	const alertas = await cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true });
	const nuevas = await umbralesNuevos(db, alertas);
	const conParte = para.filter((d) => d.avisos === 'parte');
	const conAvisos = para.filter((d) => d.avisos === 'umbrales' && d.permisos.includes('vehiculos'));
	if (conParte.length) await enviarInforme(db, env, conParte, hoy, { ...ajustes, precioCombustible: precios }, lunes, alertas, nuevas);
	if (conAvisos.length) await avisar(db, env, conAvisos, hoy, ajustes.nombreTaller, lunes, alertas.filter((a) => a.nivel !== 'ok'), nuevas);
	// Los umbrales cuentan como avisados una sola vez, los reciba quien los reciba
	if (nuevas.length) await db.insert(s.avisosEnviados).values(nuevas.map((n) => ({ clave: n.clave }))).onConflictDoNothing();
}

export interface Destinatario {
	chatId: string;
	permisos: string[];
	/** Sus vehículos y los del taller (null = todos: no hay privados de otros). */
	vehiculos: { ids: number[]; alias: string[] } | null;
	/** Qué le manda el bot cada mañana. */
	avisos: 'parte' | 'umbrales' | 'ninguno';
	/** Los lunes, además, el resumen (obras en marcha). */
	resumen: boolean;
}

/** A quién va el parte: cada usuario con su Telegram (con sus permisos). Sin usuarios aún, el chat de Ajustes con todo. */
export async function destinatarios(db: DB, ajustes: Ajustes): Promise<Destinatario[]> {
	const usuarios = await db.select().from(s.usuarios);
	const porDefecto = ajustes.parteDiario ? ('parte' as const) : ('umbrales' as const);
	if (!usuarios.length) return ajustes.telegramChatId ? [{ chatId: ajustes.telegramChatId, permisos: [...PERMISOS], vehiculos: null, avisos: porDefecto, resumen: ajustes.resumenSemanal }] : [];
	const vehiculos = await db.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, usuarioId: s.vehiculos.usuarioId }).from(s.vehiculos);
	return usuarios
		.filter((u) => u.activo && u.telegramChatId && u.preferencias?.avisos !== 'ninguno')
		.map((u) => {
			// Fuera los privados de otros: solo lo suyo y lo del taller
			const hayAjenos = vehiculos.some((v) => v.usuarioId != null && v.usuarioId !== u.id);
			const suyos = vehiculos.filter((v) => v.usuarioId == null || v.usuarioId === u.id);
			return {
				chatId: u.telegramChatId!,
				permisos: normalizarPermisos(u.permisos),
				vehiculos: hayAjenos ? { ids: suyos.map((v) => v.id), alias: suyos.map((v) => v.alias) } : null,
				avisos: u.preferencias?.avisos ?? porDefecto,
				resumen: u.preferencias?.resumenSemanal ?? ajustes.resumenSemanal
			};
		});
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

/** Alertas que cruzan hoy un umbral que aún no se había avisado (y las deja apuntadas). */
type Nueva = Awaited<ReturnType<typeof umbralesNuevos>>[number];

async function umbralesNuevos(db: DB, alertas: Alerta[]) {
	const candidatas = alertas
		.map((a) => ({ a, umbral: umbralDe(a) }))
		.filter((x): x is { a: Alerta; umbral: string } => x.umbral != null)
		.map((x) => ({ ...x, clave: `${x.a.clave}|${x.a.ciclo}|${x.umbral}` }));
	const ya = candidatas.length
		? new Set((await db.select().from(s.avisosEnviados).where(inArray(s.avisosEnviados.clave, candidatas.map((c) => c.clave)))).map((f) => f.clave))
		: new Set<string>();
	return candidatas.filter((c) => !ya.has(c.clave));
}

/** El informe de cada mañana: vencimientos, mantenimiento, taller, finanzas y coste de la flota. */
async function enviarInforme(db: DB, env: Env, para: Destinatario[], hoy: string, ajustes: Ajustes, lunes: boolean, alertas: Alerta[], nuevas: Nueva[]) {
	const datos = await datosInforme(db, { hoy, ajustes, precios: ajustes.precioCombustible, nuevas: new Set(nuevas.map((n) => n.a.clave)), app: env.APP_URL, conObras: lunes, alertas });
	// Cada uno recibe solo lo de sus áreas y sus vehículos; si a uno no le llega, a los demás sí
	for (const d of para) {
		const suyo = recortarInforme(datos, d.permisos, d.vehiculos);
		await telegram(env, d.chatId, mensajeInforme(d.resumen ? suyo : { ...suyo, obras: undefined })).catch((e) => console.error('Parte a', d.chatId, (e as Error).message));
	}
}

async function avisar(db: DB, env: Env, para: Destinatario[], hoy: string, taller: string, lunes: boolean, alertas: Alerta[], nuevas: Nueva[]) {
	const enviar = (d: Destinatario, texto: string) => telegram(env, d.chatId, texto).catch((e) => console.error('Aviso a', d.chatId, (e as Error).message));
	const suyas = <T extends { vehiculoId: number }>(d: Destinatario, xs: T[]) => (d.vehiculos ? xs.filter((x) => d.vehiculos!.ids.includes(x.vehiculoId)) : xs);

	if (nuevas.length) {
		for (const d of para) {
			const lasSuyas = suyas(d, nuevas.map((n) => n.a));
			if (lasSuyas.length) await enviar(d, mensajeAvisos(lasSuyas, taller, env.APP_URL));
		}
	}
	const conResumen = lunes ? para.filter((d) => d.resumen) : [];
	if (conResumen.length) {
		const obras = await db.select().from(s.restauraciones).where(inArray(s.restauraciones.estado, ['en_curso', 'pausada']));
		for (const d of conResumen) await enviar(d, mensajeResumen(suyas(d, alertas), d.vehiculos ? obras.filter((o) => d.vehiculos!.ids.includes(o.vehiculoId)).map((o) => o.nombre) : obras.map((o) => o.nombre), taller, hoy, env.APP_URL));
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
