import { describe, expect, it } from 'vitest';
import type { Alerta } from '@novaz/core';
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
