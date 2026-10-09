import { describe, expect, it } from 'vitest';
import { asientoDeMovimiento, cuadra, type MovimientoContable } from '../src/contabilidad';
import { explicarOperacion, operacion, OPERACIONES } from '../src/operaciones';
import { claseFlujo, efectoCaja, fechasRecurrente, flujoDeCaja, prevision } from '../src/tesoreria';

const mov = (o: Partial<MovimientoContable>): MovimientoContable => ({
	id: 1, fecha: '2026-02-10', tipo: 'gasto', importeCent: 12100, ivaPct: 21, pago: 'banco', concepto: 'x', cuentaContable: null, ...o
});

describe('aportaciones y retiradas', () => {
	it('aportación: entra en banco contra 118, sin IVA', () => {
		const a = asientoDeMovimiento(mov({ tipo: 'aportacion', importeCent: 20000 }), null);
		expect(a.apuntes).toEqual([
			{ cuenta: '572', debe: 20000, haber: 0 },
			{ cuenta: '118', debe: 0, haber: 20000 }
		]);
		expect(a.iva).toBeUndefined();
	});
	it('retirada: reembolso al socio (551) y traspaso a caja (570)', () => {
		expect(asientoDeMovimiento(mov({ tipo: 'retirada', cuentaContable: '551', importeCent: 5000 }), null).apuntes).toEqual([
			{ cuenta: '551', debe: 5000, haber: 0 },
			{ cuenta: '572', debe: 0, haber: 5000 }
		]);
		const t = asientoDeMovimiento(mov({ tipo: 'retirada', cuentaContable: '570', importeCent: 5000 }), null);
		expect(cuadra(t.apuntes)).toBe(true);
		expect(claseFlujo(t)).toBe('traspasos');
	});
});

describe('recurrentes', () => {
	const regla = { dia: 31, desde: '2026-01-15', hasta: null, ultimaGenerada: null, activo: true };
	it('genera una fecha al mes ajustando el fin de mes', () => {
		expect(fechasRecurrente(regla, '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
	});
	it('respeta desde, hasta, inactivas y lo ya generado', () => {
		expect(fechasRecurrente({ ...regla, dia: 5 }, '2026-03-10')).toEqual(['2026-02-05', '2026-03-05']);
		expect(fechasRecurrente({ ...regla, hasta: '2026-02-28' }, '2026-06-01')).toEqual(['2026-01-31', '2026-02-28']);
		expect(fechasRecurrente({ ...regla, ultimaGenerada: '2026-02-28' }, '2026-03-31')).toEqual(['2026-03-31']);
		expect(fechasRecurrente({ ...regla, activo: false }, '2026-03-31')).toEqual([]);
	});
});

describe('flujo de caja', () => {
	it('arrastra el saldo y clasifica entradas y salidas', () => {
		const asientos = [
			asientoDeMovimiento(mov({ id: 1, fecha: '2025-12-01', tipo: 'aportacion', importeCent: 100000 }), null),
			asientoDeMovimiento(mov({ id: 2, fecha: '2026-01-05', tipo: 'gasto', importeCent: 12100 }), '628'),
			asientoDeMovimiento(mov({ id: 3, fecha: '2026-01-20', tipo: 'ingreso', importeCent: 60500 }), '705'),
			asientoDeMovimiento(mov({ id: 4, fecha: '2026-02-01', tipo: 'gasto', pago: 'socio', importeCent: 9999 }), '602'),
			asientoDeMovimiento(mov({ id: 5, fecha: '2026-02-03', tipo: 'retirada', cuentaContable: '570', importeCent: 5000 }), null)
		];
		const f = flujoDeCaja(asientos, 2026);
		expect(f.saldoInicial).toBe(100000);
		expect(f.meses[0]).toMatchObject({ entradas: 60500, salidas: 12100, neto: 48400, saldoFinal: 148400 });
		expect(f.meses[0].porClase).toEqual({ pagos: -12100, cobros: 60500 });
		// Lo que pagas de tu bolsillo no mueve la caja; el traspaso banco→caja tampoco cambia el total
		expect(f.meses[1]).toMatchObject({ entradas: 0, salidas: 0, saldoFinal: 148400 });
	});
	it('previsión con aportación mensual y gasto habitual', () => {
		const p = prevision(
			10000,
			'2026-10-09',
			[{ concepto: 'Aportación', tipo: 'aportacion', importeCent: 20000, pago: 'banco', dia: 1, desde: '2026-01-01', hasta: null, ultimaGenerada: '2026-10-01', activo: true }],
			-30000,
			3
		);
		expect(p.map((m) => m.mes)).toEqual(['2026-10', '2026-11', '2026-12']);
		expect(p[0].recurrente).toBe(0); // la de octubre ya se apuntó
		expect(p[1]).toMatchObject({ recurrente: 20000, habitual: -30000 });
		expect(p[2].saldo).toBe(p[1].saldo - 10000);
		expect(efectoCaja('gasto', 500, 'socio')).toBe(0);
	});
});

describe('asistente', () => {
	it('todas las operaciones tienen cuenta numérica y explicación', () => {
		for (const o of OPERACIONES) {
			expect(o.cuenta, o.id).toMatch(/^\d{3,}$/);
			expect(o.ayuda.length, o.id).toBeGreaterThan(20);
		}
		expect(new Set(OPERACIONES.map((o) => o.id)).size).toBe(OPERACIONES.length);
	});
	it('explica en llano', () => {
		const luz = operacion('luz')!;
		expect(explicarOperacion(luz, 12100, 21, 'banco', 'Suministros').join(' ')).toMatch(/Salen 121,00\s€ del banco.*100,00\s€ son gasto.*21,00\s€ de IVA/);
		expect(explicarOperacion(operacion('aportacion')!, 20000, 0, 'banco', 'Aportaciones').join(' ')).toMatch(/No es un ingreso/);
	});
});
