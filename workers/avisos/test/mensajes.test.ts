import { describe, expect, it } from 'vitest';
import { mensajeParte, type Alerta } from '@novaz/core';
import { mensajeAvisos, mensajeResumen } from '../src/mensajes';
import { umbralDe } from '../src/tareas';

const base: Alerta = {
	clave: 'venc:1',
	tipo: 'vencimiento',
	vehiculoId: 1,
	vehiculo: 'SV650 <negra>',
	matricula: '1234 KBC',
	titulo: 'ITV',
	detalle: 'vence el 21 oct 2026',
	nivel: 'pronto',
	dias: 12,
	kmRestantes: null,
	avisosDias: [30, 7, 1],
	ciclo: '2026-10-21'
};

describe('avisos', () => {
	it('umbral de vencimiento y de mantenimiento', () => {
		expect(umbralDe(base)).toBe('30');
		expect(umbralDe({ ...base, dias: 5, nivel: 'urgente' })).toBe('7');
		expect(umbralDe({ ...base, dias: 45, nivel: 'ok' })).toBeNull();
		expect(umbralDe({ ...base, dias: -1, nivel: 'vencido' })).toBe('vencido');
		expect(umbralDe({ ...base, tipo: 'mantenimiento', dias: null, nivel: 'urgente' })).toBe('urgente');
		expect(umbralDe({ ...base, tipo: 'mantenimiento', nivel: 'ok' })).toBeNull();
		expect(umbralDe({ ...base, tipo: 'pendiente', dias: null, nivel: 'urgente' })).toBeNull();
	});
	it('mensaje agrupado, escapado y con enlaces', () => {
		const m = mensajeAvisos([base, { ...base, clave: 'x', titulo: 'Seguro', nivel: 'vencido', dias: -2 }], 'Novaz', 'https://panel.novaz.es');
		expect(m).toContain('<b>Vencido</b>');
		expect(m.indexOf('Vencido')).toBeLessThan(m.indexOf('Próximamente'));
		expect(m).toContain('SV650 &lt;negra&gt;');
		expect(m).toContain('href="https://panel.novaz.es/flota/1"');
		expect(m).toContain('en 12 días');
	});
	it('resumen sin alertas', () => {
		const m = mensajeResumen([], ['Restauración Vespa'], 'Novaz', '2026-10-12');
		expect(m).toContain('al día');
		expect(m).toContain('• Restauración Vespa');
		expect(m).toContain('12/10/2026');
	});
});

describe('parte diario', () => {
	const datos = {
		taller: 'Novaz',
		hoy: '2026-10-10',
		app: 'https://panel',
		alertas: [
			base,
			{ ...base, clave: 'venc:2', vehiculo: 'Ibiza', vehiculoId: 5, titulo: 'Seguro', dias: 166, nivel: 'ok' as const, detalle: 'vence el 25 mar 2027' },
			{ ...base, clave: 'plan:3', tipo: 'mantenimiento' as const, vehiculo: 'Ibiza', vehiculoId: 5, titulo: 'C2 · Aceite y filtro', dias: -3, nivel: 'vencido' as const, detalle: 'tocaba hace 3 días' },
			{ ...base, clave: 'pend:4', tipo: 'pendiente' as const, titulo: 'Fuga en el motor de arranque', nivel: 'urgente' as const, dias: null, detalle: 'Urgente' }
		],
		nuevas: new Set(['plan:3']),
		local: [{ titulo: 'Reparar humedad', zona: 'Pared del fondo', fechaLimite: '2026-10-05', prioridad: 'alta' }],
		compras: 3,
		fueraDeSitio: 0
	};

	it('trae el próximo trámite, lo urgente con 🆕, averías, el local y la compra', () => {
		const m = mensajeParte(datos);
		expect(m).toContain('sábado, 10 de octubre');
		expect(m).toMatch(/Próximo trámite:<\/b> ITV de <a href="https:\/\/panel\/flota\/1">SV650 &lt;negra&gt;<\/a>, en 12 días/);
		expect(m).toMatch(/Requiere atención<\/b>\n🆕 <b>C2 · Aceite y filtro<\/b>/);
		expect(m).toContain('Fuga en el motor de arranque');
		expect(m).toContain('Reparar humedad (Pared del fondo) — vencida');
		expect(m).toContain('3 cosas por comprar');
		expect(m).not.toContain('Todo al día');
		// Lo que está al día no sale en las listas (solo como próximo trámite si es el más cercano)
		expect(m).not.toContain('Seguro');
	});

	it('si no hay nada, lo dice', () => {
		const m = mensajeParte({ ...datos, alertas: [{ ...base, nivel: 'ok', dias: 200 }], nuevas: new Set(), local: [], compras: 0 });
		expect(m).toContain('Todo al día');
		expect(m).toContain('Próximo trámite');
	});
});
