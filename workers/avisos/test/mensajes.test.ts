import { describe, expect, it } from 'vitest';
import { mensajeInforme, type Alerta } from '@novaz/core';
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

describe('informe diario', () => {
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
		compras: 2,
		listaCompra: [
			{ texto: 'Filtro de aceite', para: 'Ibiza · C2' },
			{ texto: 'Pintura antihumedad × 4 L', para: 'local: Reparar humedad' }
		],
		fueraDeSitio: 0,
		finanzas: { tesoreria: 52037, gastoMes: 171200, gastoAnio: 374000, ingresosAnio: 0, diasCuadre: 0 },
		flota: [{ alias: 'Ibiza', mensual: 9200, porKm: 17, completo: true }],
		kmSinActualizar: [{ alias: 'Bandit', ultima: '2026-08-01' }]
	};

	it('informe sobrio: sin emojis, con tablas y todas las secciones', () => {
		const m = mensajeInforme(datos);
		expect(m).not.toMatch(/\p{Extended_Pictographic}/u);
		expect(m).toContain('NOVAZ · INFORME DIARIO');
		expect(m).toContain('Sábado, 10 de octubre de 2026');
		expect(m).toMatch(/3 asuntos requieren atención hoy/); // aceite vencido + avería urgente + tarea del local fuera de plazo
		expect(m).toContain('Próximo trámite: ITV de SV650 &lt;negra&gt;, 22/10/26 (12 días)');
		expect(m).toContain('<pre>22/10  ITV       SV650 &lt;n.  12 d</pre>'); // el seguro (166 días) queda fuera de los 90
		expect(m).toContain('Ibiza · C2 · Aceite y filtro: tocaba hace 3 días [VENCIDO] <i>(nuevo)</i>');
		expect(m).toContain('Averías abiertas (1): Fuga en el motor de arranque (SV650 &lt;negra&gt;, urgente).');
		expect(m).toContain('El local: 1 tarea abierta, 1 fuera de plazo. Reparar humedad (vencida).');
		expect(m).toContain('<b>Lista de la compra</b> (2)\n• Filtro de aceite — <i>Ibiza · C2</i>');
		expect(m).toContain('Tesorería');
		expect(m).toMatch(/Ibiza +92\s€\/mes  0,17 €\/km/);
		expect(m).toContain('Km sin actualizar: Bandit (última lectura 01/08/26)');
	});

	it('sin nada urgente, lo dice en una línea', () => {
		const m = mensajeInforme({ ...datos, alertas: [{ ...base, nivel: 'ok', dias: 200 }], nuevas: new Set(), local: [], compras: 0, listaCompra: [], kmSinActualizar: [] });
		expect(m).toContain('Sin asuntos urgentes.');
		expect(m).not.toContain('Lista de la compra');
	});
});
