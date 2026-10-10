// Parte diario por Telegram: lo pendiente de un vistazo (HTML de Telegram).
import type { Nivel } from './alertas';
import type { Alerta } from './consultas';
import { fechaLarga, textoDias } from './fechas';

const ICONO: Record<Nivel, string> = { vencido: '🔴', urgente: '🟠', pronto: '🔵', ok: '🟢' };
const PRIORIDAD: Record<string, string> = { alta: '🔴', media: '🟠', baja: '⚪' };
const MAX = 4;

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface DatosParte {
	taller: string;
	hoy: string;
	/** URL de la app para los enlaces. */
	app?: string;
	/** Todas las alertas (incluidas las que están al día). */
	alertas: Alerta[];
	/** Claves de las alertas que cruzan hoy un umbral nuevo (se marcan con 🆕). */
	nuevas: Set<string>;
	local: { titulo: string; zona: string | null; fechaLimite: string | null; prioridad: string }[];
	compras: number;
	fueraDeSitio: number;
	/** Solo los lunes: cómo van las obras. */
	obras?: { nombre: string; avance: number }[];
}

export function mensajeParte(d: DatosParte): string {
	const enlace = (ruta: string, texto: string) => (d.app ? `<a href="${d.app}${ruta}">${esc(texto)}</a>` : esc(texto));
	const veh = (a: Alerta) => enlace(`/flota/${a.vehiculoId}`, a.vehiculo);
	const cuando = (a: Alerta) => (a.tipo === 'vencimiento' && a.dias != null ? textoDias(a.dias) : a.detalle);
	const linea = (a: Alerta) => `${d.nuevas.has(a.clave) ? '🆕' : ICONO[a.nivel]} <b>${esc(a.titulo)}</b> · ${veh(a)} — ${esc(cuando(a))}`;
	const recortar = (ls: string[]) => (ls.length > MAX ? [...ls.slice(0, MAX), `   …y ${ls.length - MAX} más`] : ls);

	const dia = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${d.hoy}T12:00:00Z`));
	const partes = [`☀️ <b>${esc(d.taller)}</b> · ${dia}`];

	// El próximo papel que vence (aunque falte mucho)
	const proximo = d.alertas
		.filter((a) => a.tipo === 'vencimiento' && a.dias != null && a.dias >= 0)
		.sort((a, b) => a.dias! - b.dias!)[0];
	if (proximo)
		partes.push(`📅 <b>Próximo trámite:</b> ${esc(proximo.titulo)} de ${veh(proximo)}, ${esc(textoDias(proximo.dias!))} (${esc(proximo.detalle)})`);

	// El próximo trámite ya va arriba: no se repite en las listas
	const listables = d.alertas.filter((a) => a !== proximo || d.nuevas.has(a.clave));
	const atencion = listables.filter((a) => a.tipo !== 'pendiente' && (a.nivel === 'vencido' || a.nivel === 'urgente'));
	if (atencion.length) partes.push(`<b>Requiere atención</b>\n${recortar(atencion.map(linea)).join('\n')}`);

	const pronto = listables.filter((a) => a.tipo !== 'pendiente' && a.nivel === 'pronto');
	if (pronto.length) partes.push(`<b>Próximamente</b>\n${recortar(pronto.map(linea)).join('\n')}`);

	const averias = d.alertas.filter((a) => a.tipo === 'pendiente');
	if (averias.length) partes.push(`🔧 <b>Por reparar</b>\n${recortar(averias.map((a) => `• ${esc(a.titulo)} · ${veh(a)}`)).join('\n')}`);

	if (d.local.length) {
		const ls = d.local.map((t) => {
			const fecha = t.fechaLimite ? ` — ${t.fechaLimite < d.hoy ? 'vencida' : `antes del ${fechaLarga(t.fechaLimite)}`}` : '';
			return `${PRIORIDAD[t.prioridad] ?? '•'} ${esc(t.titulo)}${t.zona ? ` (${esc(t.zona)})` : ''}${fecha}`;
		});
		partes.push(`🏠 <b>${enlace('/local', 'El local')}</b>\n${recortar(ls).join('\n')}`);
	}

	const extra: string[] = [];
	if (d.compras) extra.push(`🛒 ${enlace('/compras', `${d.compras} ${d.compras === 1 ? 'cosa' : 'cosas'} por comprar`)}`);
	if (d.fueraDeSitio) extra.push(`🧰 ${enlace('/inventario', `${d.fueraDeSitio} ${d.fueraDeSitio === 1 ? 'herramienta sin localizar' : 'herramientas sin localizar'}`)}`);
	if (extra.length) partes.push(extra.join('\n'));

	if (d.obras?.length)
		partes.push(`🛠 <b>En el taller</b>\n${d.obras.map((o) => `• ${esc(o.nombre)} — ${Math.round(o.avance * 100)} %`).join('\n')}`);

	if (!atencion.length && !pronto.length && !averias.length && !d.local.length && !extra.length) partes.push('✅ Todo al día. ¡Buen día de taller!');
	if (d.app) partes.push(`<a href="${d.app}">Abrir el panel</a>`);
	return partes.join('\n\n');
}
