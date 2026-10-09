import { describe, expect, it } from 'vitest';
import {
	asientoDeMovimiento,
	asientosAmortizacion,
	asientosLiquidacionIva,
	balanceSituacion,
	cuadra,
	desglosarIva,
	nombreCuenta,
	numerar,
	perdidasYGanancias,
	resumenIva,
	sumasYSaldos,
	type Asiento,
	type MovimientoContable
} from '../src/contabilidad';

const mov = (o: Partial<MovimientoContable>): MovimientoContable => ({
	id: 1,
	fecha: '2026-02-10',
	tipo: 'gasto',
	importeCent: 12100,
	ivaPct: 21,
	pago: 'banco',
	concepto: 'Pastillas de freno',
	cuentaContable: null,
	...o
});

describe('IVA', () => {
	it('desglosa con el redondeo en la cuota', () => {
		expect(desglosarIva(12100, 21)).toEqual({ base: 10000, cuota: 2100 });
		expect(desglosarIva(5490, 21)).toEqual({ base: 4537, cuota: 953 });
		expect(desglosarIva(21200, 0)).toEqual({ base: 21200, cuota: 0 });
		const { base, cuota } = desglosarIva(999, 10);
		expect(base + cuota).toBe(999);
	});
});

describe('asientos de movimientos', () => {
	it('gasto con IVA pagado por banco', () => {
		const a = asientoDeMovimiento(mov({}), '602');
		expect(a.apuntes).toEqual([
			{ cuenta: '602', debe: 10000, haber: 0 },
			{ cuenta: '472', debe: 2100, haber: 0 },
			{ cuenta: '572', debe: 0, haber: 12100 }
		]);
		expect(cuadra(a.apuntes)).toBe(true);
		expect(a.iva).toEqual({ tipo: 'soportado', base: 10000, cuota: 2100, pct: 21 });
	});
	it('ingreso cobrado en caja; cuenta propia manda sobre la de la categoría', () => {
		const a = asientoDeMovimiento(mov({ tipo: 'ingreso', pago: 'caja', cuentaContable: '7050001' }), '705');
		expect(a.apuntes).toEqual([
			{ cuenta: '570', debe: 12100, haber: 0 },
			{ cuenta: '7050001', debe: 0, haber: 10000 },
			{ cuenta: '477', debe: 0, haber: 2100 }
		]);
	});
	it('pagado de tu bolsillo → la empresa te lo debe (551); sin categoría → 629', () => {
		const a = asientoDeMovimiento(mov({ pago: 'socio', ivaPct: 0, importeCent: 3850 }), null);
		expect(a.apuntes).toEqual([
			{ cuenta: '629', debe: 3850, haber: 0 },
			{ cuenta: '551', debe: 0, haber: 3850 }
		]);
	});
});

describe('amortización', () => {
	const elevador = { id: 7, nombre: 'Elevador', cuenta: '213', fechaAlta: '2025-07-01', valorCent: 120000, valorResidualCent: 0, vidaUtilMeses: 60, fechaBaja: null };
	it('prorratea el primer año y cuadra al céntimo al final de la vida útil', () => {
		const as = asientosAmortizacion(elevador, '2031-01-01');
		expect(as.map((a) => a.fecha)).toEqual(['2025-12-31', '2026-12-31', '2027-12-31', '2028-12-31', '2029-12-31', '2030-06-30']);
		expect(as[0].apuntes[0]).toMatchObject({ cuenta: '681' });
		expect(as[0].apuntes[1]).toMatchObject({ cuenta: '281' });
		expect(as.reduce((t, a) => t + a.apuntes[0].debe, 0)).toBe(120000);
		expect(as.every((a) => cuadra(a.apuntes))).toBe(true);
	});
	it('el ejercicio en curso amortiza hasta hoy', () => {
		const as = asientosAmortizacion(elevador, '2026-03-31');
		expect(as.map((a) => a.fecha)).toEqual(['2025-12-31', '2026-03-31']);
		expect(as[1].apuntes[0].debe).toBeGreaterThan(5000);
		expect(as[1].apuntes[0].debe).toBeLessThan(7000);
	});
	it('intangible usa 680/280; la baja detiene la amortización', () => {
		const as = asientosAmortizacion({ ...elevador, cuenta: '206', fechaBaja: '2025-12-31' }, '2030-01-01');
		expect(as).toHaveLength(1);
		expect(as[0].apuntes.map((p) => p.cuenta)).toEqual(['680', '280']);
	});
});

describe('liquidación de IVA', () => {
	it('liquida trimestres cerrados y compensa las cuotas a devolver', () => {
		const base: Asiento[] = [
			asientoDeMovimiento(mov({ id: 1, fecha: '2026-02-01', importeCent: 12100 }), '602'), // soportado 2100 (1T)
			asientoDeMovimiento(mov({ id: 2, fecha: '2026-05-01', tipo: 'ingreso', importeCent: 36300 }), '705'), // repercutido 6300 (2T)
			asientoDeMovimiento(mov({ id: 3, fecha: '2026-10-05', importeCent: 2420 }), '602') // 4T, en curso
		];
		const liq = asientosLiquidacionIva(base, '2026-10-09');
		expect(liq.map((a) => a.concepto)).toEqual(['Liquidación IVA 1T 2026', 'Liquidación IVA 2T 2026']);
		expect(liq[0].apuntes).toEqual([
			{ cuenta: '472', debe: 0, haber: 2100 },
			{ cuenta: '4700', debe: 2100, haber: 0 }
		]);
		expect(liq[1].apuntes).toEqual([
			{ cuenta: '477', debe: 6300, haber: 0 },
			{ cuenta: '4700', debe: 0, haber: 2100 },
			{ cuenta: '4750', debe: 0, haber: 4200 }
		]);
		expect(liq.every((a) => cuadra(a.apuntes))).toBe(true);
	});
	it('resumen trimestral', () => {
		const r = resumenIva([asientoDeMovimiento(mov({ fecha: '2026-05-01', tipo: 'ingreso', importeCent: 36300 }), '705')], 2026, '2026-10-09');
		expect(r[1]).toMatchObject({ t: 2, repercutido: { base: 30000, cuota: 6300 }, resultado: 6300, cerrado: true });
		expect(r[3].cerrado).toBe(false);
	});
});

describe('informes', () => {
	const apertura: Asiento = {
		clave: 'x1',
		fecha: '2025-01-01',
		concepto: 'Aportación de capital',
		origen: 'manual',
		refId: 1,
		apuntes: [
			{ cuenta: '572', debe: 300000, haber: 0 },
			{ cuenta: '100', debe: 0, haber: 300000 }
		]
	};
	const elevador = { id: 7, nombre: 'Elevador', cuenta: '213', fechaAlta: '2025-07-01', valorCent: 120000, valorResidualCent: 0, vidaUtilMeses: 60, fechaBaja: null };
	const todos = (hoy: string): Asiento[] => {
		const base = [
			apertura,
			asientoDeMovimiento(mov({ id: 1, fecha: '2025-07-01', importeCent: 145200, cuentaContable: '213' }), null),
			asientoDeMovimiento(mov({ id: 2, fecha: '2025-09-01', tipo: 'ingreso', importeCent: 60500 }), '705'),
			asientoDeMovimiento(mov({ id: 3, fecha: '2026-03-01', importeCent: 24200, pago: 'socio' }), '602'),
			asientoDeMovimiento(mov({ id: 4, fecha: '2026-04-01', tipo: 'ingreso', importeCent: 20000, ivaPct: 0 }), '759'),
			...asientosAmortizacion(elevador, hoy)
		];
		return [...base, ...asientosLiquidacionIva(base, hoy)];
	};

	it('numera por ejercicio', () => {
		const n = numerar(todos('2026-10-09'));
		expect(n.filter((a) => a.fecha.startsWith('2025')).map((a) => a.numero)).toEqual([1, 2, 3, 4, 5]);
		expect(n.find((a) => a.fecha.startsWith('2026'))?.numero).toBe(1);
	});

	it('pérdidas y ganancias del ejercicio', () => {
		const ej2026 = todos('2026-10-09').filter((a) => a.fecha.startsWith('2026'));
		const pyg = perdidasYGanancias(sumasYSaldos(ej2026));
		expect(pyg.lineas.aprov.importe).toBe(-20000);
		expect(pyg.lineas.otrosIngExp.importe).toBe(20000);
		expect(pyg.lineas.amort.importe).toBeLessThan(0);
		expect(pyg.resultado).toBe(pyg.lineas.amort.importe);
	});

	it('el balance cuadra siempre, también a mitad de ejercicio', () => {
		for (const hoy of ['2025-12-31', '2026-06-15', '2026-10-09', '2031-01-01']) {
			const b = balanceSituacion(todos(hoy).filter((a) => a.fecha <= hoy), `${hoy.slice(0, 4)}-01-01`);
			expect(b.cuadra, hoy).toBe(true);
			expect(b.activo.total).toBeGreaterThan(0);
		}
		const b = balanceSituacion(todos('2026-10-09'), '2026-01-01');
		const socio = b.pnPasivo.corriente.find((l) => l.clave === 'sociosP');
		expect(socio?.importe).toBe(24200);
	});

	it('nombre de subcuentas por prefijo', () => {
		const plan = new Map([['572', 'Bancos'], ['47', 'Administraciones']]);
		expect(nombreCuenta('572', plan)).toBe('Bancos');
		expect(nombreCuenta('5720001', plan)).toBe('Bancos (5720001)');
		expect(nombreCuenta('4750', plan)).toBe('Administraciones (4750)');
		expect(nombreCuenta('999', plan)).toBe('Cuenta 999');
	});
});
