import { describe, expect, it } from 'vitest';
import { extraerJson, normalizarTicket, notasTicket } from '../src/ticket';

const HOY = '2026-10-11';

describe('lectura de tickets', () => {
	it('saca el JSON aunque venga envuelto', () => {
		expect(extraerJson('Aquí tienes:\n```json\n{"total": 12.5}\n```')).toEqual({ total: 12.5 });
		expect(extraerJson({ total: 3 })).toEqual({ total: 3 });
		expect(extraerJson('sin datos')).toBeNull();
	});

	it('normaliza un repostaje con formatos españoles', () => {
		const t = normalizarTicket(
			'{"total":"72,00 €","fecha":"11/10/2026","comercio":"  Repsol   Moncada ","nif":"a-28.047.223","iva_porcentaje":21,"concepto":"Gasóleo A","es_combustible":true,"litros":"40,00","precio_litro":"1,800"}',
			HOY
		);
		expect(t).toEqual({ importeCent: 7200, fecha: '2026-10-11', proveedor: 'Repsol Moncada', nif: 'A28047223', ivaPct: 21, concepto: 'Gasóleo A', litros: 40, precioLitro: 1.8, combustible: true, lineas: [] });
	});

	it('descarta lo dudoso: fechas futuras, IVA raro, importes absurdos', () => {
		const t = normalizarTicket({ total: 1234.56, fecha: '2027-01-01', iva_porcentaje: 18, litros: 500 }, HOY);
		expect(t.importeCent).toBe(123456);
		expect(t.fecha).toBeNull();
		expect(t.ivaPct).toBeNull();
		expect(t.litros).toBeNull();
		expect(normalizarTicket({ total: -5 }, HOY).importeCent).toBeNull();
		expect(normalizarTicket({ total: '1.234,50' }, HOY).importeCent).toBe(123450);
		expect(normalizarTicket({ fecha: '05-03-26' }, HOY).fecha).toBe('2026-03-05');
	});

	it('si no es combustible, no hay litros', () => {
		const t = normalizarTicket({ total: 30, concepto: 'Lija y masilla', precio_litro: 2 }, HOY);
		expect(t.combustible).toBe(false);
		expect(t.precioLitro).toBeNull();
	});
});

describe('líneas del ticket', () => {
	const t = normalizarTicket(
		{
			total: 34.9,
			fecha: '11/10/26',
			comercio: 'Leroy Merlin',
			lineas: [
				{ descripcion: 'Burlete adhesivo 10 m', cantidad: 2, importe: '11,90' },
				{ descripcion: 'Espuma de poliuretano', importe: 7.5 },
				{ descripcion: '   ' },
				{ descripcion: 'Panel aislante', cantidad: 3, importe: 15.5 }
			]
		},
		HOY
	);

	it('limpia las líneas y descarta las vacías', () => {
		expect(t.lineas).toEqual([
			{ descripcion: 'Burlete adhesivo 10 m', cantidad: 2, importeCent: 1190 },
			{ descripcion: 'Espuma de poliuretano', cantidad: null, importeCent: 750 },
			{ descripcion: 'Panel aislante', cantidad: 3, importeCent: 1550 }
		]);
		expect(t.fecha).toBe('2026-10-11');
	});

	it('las convierte en notas legibles', () => {
		expect(notasTicket(t)).toBe(
			'Ticket de Leroy Merlin del 11/10/2026:\n- Burlete adhesivo 10 m (2 × 5,95 €): 11,90 €\n- Espuma de poliuretano: 7,50 €\n- Panel aislante (3 × 5,17 €): 15,50 €\nTotal: 34,90 €'
		);
	});
});
