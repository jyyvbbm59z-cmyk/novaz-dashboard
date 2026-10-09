import { textoDias, type Alerta, type Nivel } from '@novaz/core';

const ICONO: Record<Nivel, string> = { vencido: '🔴', urgente: '🟠', pronto: '🔵', ok: '🟢' };
const TITULO: Record<Nivel, string> = { vencido: 'Vencido', urgente: 'Urgente', pronto: 'Próximamente', ok: 'Al día' };

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function linea(a: Alerta, app?: string) {
	const cuando =
		a.tipo === 'vencimiento' && a.dias != null ? textoDias(a.dias) : a.detalle;
	const veh = app ? `<a href="${app}/flota/${a.vehiculoId}">${esc(a.vehiculo)}</a>` : esc(a.vehiculo);
	return `${ICONO[a.nivel]} <b>${esc(a.titulo)}</b> · ${veh}${a.matricula ? ` (${esc(a.matricula)})` : ''}\n     ${esc(cuando)}`;
}

function agrupar(alertas: Alerta[], app?: string) {
	const bloques: string[] = [];
	for (const nivel of ['vencido', 'urgente', 'pronto'] as Nivel[]) {
		const grupo = alertas.filter((a) => a.nivel === nivel);
		if (grupo.length) bloques.push(`<b>${TITULO[nivel]}</b>\n${grupo.map((a) => linea(a, app)).join('\n')}`);
	}
	return bloques.join('\n\n');
}

export function mensajeAvisos(alertas: Alerta[], taller: string, app?: string) {
	return `🔧 <b>${esc(taller)}</b> · avisos\n\n${agrupar(alertas, app)}`;
}

export function mensajeResumen(alertas: Alerta[], obras: string[], taller: string, hoy: string, app?: string) {
	const partes = [`📋 <b>${esc(taller)}</b> · resumen semanal (${hoy.split('-').reverse().join('/')})`];
	partes.push(alertas.length ? agrupar(alertas, app) : '✅ Papeles y mantenimientos al día.');
	if (obras.length) partes.push(`🛠 <b>En el taller</b>\n${obras.map((o) => `• ${esc(o)}`).join('\n')}`);
	if (app) partes.push(`<a href="${app}">Abrir el panel</a>`);
	return partes.join('\n\n');
}
