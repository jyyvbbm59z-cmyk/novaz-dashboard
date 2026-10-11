// Métricas de uso propias: se acumulan en el navegador y se envían por lotes a /api/uso (tu base de datos).
import { normalizarRuta } from '@novaz/core';
import { browser } from '$app/environment';

interface Evento {
	evento: string;
	nombre?: string | null;
	duracionMs?: number | null;
	datos?: Record<string, unknown> | null;
	ruta?: string;
}

const sesion = browser ? (crypto.randomUUID?.() ?? String(Math.random()).slice(2)) : '';
const movil = browser && matchMedia('(pointer: coarse)').matches;
let cola: (Evento & { momento: string; sesion: string; movil: boolean; ruta: string })[] = [];
let temporizador: ReturnType<typeof setTimeout> | null = null;

const rutaActual = () => normalizarRuta(location.pathname, location.search);
const ahora = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

export function registrar(e: Evento) {
	if (!browser) return;
	cola.push({ ...e, ruta: e.ruta ?? rutaActual(), momento: ahora(), sesion, movil });
	if (cola.length >= 20) enviarCola();
	else if (!temporizador) temporizador = setTimeout(enviarCola, 8000);
}

export function enviarCola() {
	if (temporizador) clearTimeout(temporizador);
	temporizador = null;
	if (!cola.length) return;
	const lote = JSON.stringify(cola);
	cola = [];
	// sendBeacon sobrevive al cierre de la pestaña
	if (!navigator.sendBeacon?.('/api/uso', new Blob([lote], { type: 'application/json' })))
		fetch('/api/uso', { method: 'POST', body: lote, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
}

if (browser) {
	addEventListener('pagehide', enviarCola);
	document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && enviarCola());
	addEventListener('error', (e) => registrar({ evento: 'error_js', datos: { mensaje: String(e.message).slice(0, 200) } }));
	addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => registrar({ evento: 'error_js', datos: { mensaje: String((e.reason as Error)?.message ?? e.reason).slice(0, 200) } }));
}

// ─── Hojas (formularios): abierta → completada o abandonada ──────────────────

interface HojaActiva {
	titulo: string;
	desde: number;
	enviada: boolean;
}
const hojas: HojaActiva[] = [];

export function hojaAbierta(titulo: string) {
	hojas.push({ titulo, desde: performance.now(), enviada: false });
	registrar({ evento: 'hoja_abierta', nombre: titulo });
}

export function hojaCerrada(titulo: string) {
	const i = hojas.findLastIndex((h) => h.titulo === titulo);
	const h = i >= 0 ? hojas.splice(i, 1)[0] : null;
	if (!h) return;
	registrar({ evento: h.enviada ? 'hoja_completada' : 'hoja_abandonada', nombre: h.titulo, duracionMs: Math.round(performance.now() - h.desde) });
}

/** Hoja en la que se está trabajando (la última abierta). */
export const hojaActual = () => hojas.at(-1) ?? null;

// ─── Tickets leídos con IA: ¿se guardan tal cual o hay que corregir? ─────────

let ultimoTicket: { importe: string | null; fecha: string | null; proveedor: string | null } | null = null;
export function ticketLeido(t: { importe: string | null; fecha: string | null; proveedor: string | null }) {
	ultimoTicket = t;
}

/** Al guardar un formulario: envío correcto (y, si venía de un ticket, qué se corrigió). */
export function envioCorrecto(accion: string, formData: FormData) {
	const h = hojaActual();
	if (h) h.enviada = true;
	registrar({ evento: 'envio_ok', nombre: accion, datos: h ? { hoja: h.titulo } : null });
	if (ultimoTicket) {
		const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
		const corregidos = (['importe', 'fecha', 'proveedor'] as const).filter((k) => ultimoTicket![k] != null && formData.has(k) && norm(formData.get(k)) !== norm(ultimoTicket![k]));
		registrar({ evento: 'ticket_revisado', nombre: accion, datos: { corregidos } });
		ultimoTicket = null;
	}
}

export function envioFallido(accion: string, mensaje: string) {
	const h = hojaActual();
	registrar({ evento: 'envio_error', nombre: accion, datos: { mensaje: mensaje.slice(0, 160), ...(h ? { hoja: h.titulo } : {}) } });
}
