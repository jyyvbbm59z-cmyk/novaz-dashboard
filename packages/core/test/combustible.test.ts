import { describe, expect, it } from 'vitest';
import { combustibleDe, costeUsoMensual, descargarPrecios, precioDe } from '../src/combustible';

describe('precio del combustible', () => {
	const estaciones = (...precios: (number | null)[]) => ({ estaciones: precios.map((precio) => ({ precio })) });

	it('media y mínimo, ignorando gasolineras sin precio', () => {
		expect(precioDe(estaciones(1.799, 1.965, null), 'municipio')).toEqual({ media: 1.882, minimo: 1.799, estaciones: 2, ambito: 'municipio' });
		expect(precioDe(estaciones(), 'municipio')).toBeNull();
	});

	it('si en el municipio falta un carburante, lo busca en la provincia', async () => {
		const pedidas: string[] = [];
		const falso = (async (_url: string, init: RequestInit) => {
			const f = JSON.parse(String(init.body));
			pedidas.push(`${f.idProducto}${f.idMunicipio ? '@mun' : '@prov'}`);
			const lista = f.idMunicipio ? (f.idProducto === 4 ? estaciones(1.8) : estaciones()) : estaciones(1.7, 1.5);
			return new Response(JSON.stringify(lista));
		}) as typeof fetch;
		const p = await descargarPrecios({ id: '7130', nombre: 'Moncada', provinciaId: '46' }, '2026-10-10', { fetch: falso });
		expect(pedidas.sort()).toEqual(['1@mun', '1@prov', '4@mun']);
		expect(p.diesel).toMatchObject({ media: 1.8, ambito: 'municipio' });
		expect(p.gasolina).toMatchObject({ media: 1.6, ambito: 'provincia' });
	});

	it('reconoce el combustible del vehículo', () => {
		expect(combustibleDe('Diésel')).toBe('diesel');
		expect(combustibleDe('DIESEL')).toBe('diesel');
		expect(combustibleDe('Gasolina')).toBe('gasolina');
		expect(combustibleDe('Eléctrico')).toBeNull();
	});
});

describe('coste de uso mensual', () => {
	const base = {
		hoy: '2026-10-10',
		kmMes: 600,
		consumo: 5,
		precioLitro: 1.8,
		vencimientos: [
			{ id: 1, tipo: 'Seguro', importeCent: 36000, fechaInicio: '2026-03-25', fechaVence: '2027-03-25' },
			{ id: 2, tipo: 'Impuesto de circulación', importeCent: 5896, fechaInicio: '2026-05-04', fechaVence: '2027-05-04' },
			{ id: 3, tipo: 'ITV', importeCent: null, fechaInicio: '2026-06-30', fechaVence: '2027-06-30' }
		],
		gastos: [
			{ fecha: '2026-05-04', importeCent: 5896, categoria: 'Impuestos y tasas', vencimientoId: 2 },
			{ fecha: '2026-01-12', importeCent: 72000, categoria: 'Recambios', vencimientoId: null },
			{ fecha: '2025-02-04', importeCent: 3617, categoria: 'Consumibles', vencimientoId: null },
			{ fecha: '2026-09-01', importeCent: 6000, categoria: 'Combustible', vencimientoId: null }
		]
	};

	it('suma combustible, fijos anualizados y mantenimiento repartido', () => {
		const c = costeUsoMensual(base);
		const parte = (k: string) => c.partes.find((p) => p.clave === k)!;
		expect(parte('combustible').mensual).toBe(5400); // 600 km × 5 L/100 × 1,80 €
		expect(parte('seguro').mensual).toBe(3000);
		expect(parte('impuesto').mensual).toBe(491);
		expect(parte('itv').mensual).toBeNull(); // sin importe ni pago: hay que ponerlo
		// 21 meses (algo más de 20) desde el primer gasto de mantenimiento; el combustible y el impuesto no cuentan
		expect(parte('mantenimiento').mensual).toBe(Math.round((72000 + 3617) / 21));
		expect(c.total).toBe(5400 + 3000 + 491 + Math.round(75617 / 21));
		expect(c.completo).toBe(false);
		expect(c.porKm).toBeCloseTo(c.total / 600);
	});

	it('sin importe en el papel usa el último pago de ese concepto', () => {
		const c = costeUsoMensual({ ...base, gastos: [...base.gastos, { fecha: '2026-06-30', importeCent: 4200, categoria: 'ITV', vencimientoId: 3 }] });
		expect(c.partes.find((p) => p.clave === 'itv')!.mensual).toBe(350);
	});

	it('sin km o sin consumo no inventa el combustible', () => {
		expect(costeUsoMensual({ ...base, kmMes: null }).partes[0].mensual).toBeNull();
		expect(costeUsoMensual({ ...base, consumo: null }).partes[0].detalle).toMatch(/consumo/);
	});
});
