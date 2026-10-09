import { describe, expect, it } from 'vitest';
import { kmFactura, lineasDesdeEntradas, numeroFactura, totalesFactura } from '../src/facturacion';

describe('facturas', () => {
	it('km: el común, o el total del vehículo si no coinciden', () => {
		expect(kmFactura([29350, 29350], 30100)).toBe(29350);
		expect(kmFactura([29350, null], 30100)).toBe(29350);
		expect(kmFactura([23100, 29350], 30100)).toBe(30100);
		expect(kmFactura([null, null], 30100)).toBe(30100);
		expect(kmFactura([], null)).toBeNull();
	});
	it('totales con redondeo por línea', () => {
		expect(totalesFactura([{ concepto: 'a', cantidad: 1.5, precioCent: 3500 }, { concepto: 'b', cantidad: 1, precioCent: 2893 }], 21)).toEqual({ base: 8143, iva: 1710, total: 9853 });
		expect(totalesFactura([], 21)).toEqual({ base: 0, iva: 0, total: 0 });
	});
	it('numeración', () => {
		expect(numeroFactura('NVZ', 2026, 7)).toBe('NVZ-2026-0007');
	});
	it('propone mano de obra y materiales sin IVA', () => {
		const l = lineasDesdeEntradas(
			[{ id: 1, titulo: 'Cambio de embrague', texto: 'Kit Luk', horas: 3 }, { id: 2, titulo: 'Diagnosis', texto: null, horas: null }],
			[{ entradaId: 2, concepto: 'Lector OBD', importeCent: 1210, ivaPct: 21 }, { entradaId: 1, concepto: 'Kit embrague', proveedor: 'Recambios Paterna', importeCent: 12100, ivaPct: 21 }],
			3500
		);
		expect(l).toEqual([
			{ concepto: 'Cambio de embrague', detalle: 'Kit Luk', cantidad: 3, unidad: 'h', precioCent: 3500 },
			{ concepto: 'Material: Kit embrague', cantidad: 1, unidad: 'ud', precioCent: 10000 },
			{ concepto: 'Diagnosis', detalle: null, cantidad: 1, unidad: null, precioCent: 0 },
			{ concepto: 'Material: Lector OBD', cantidad: 1, unidad: 'ud', precioCent: 1000 }
		]);
	});
});
