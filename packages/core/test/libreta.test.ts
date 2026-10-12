import { describe, expect, it } from 'vitest';
import { categoriaSimple, resumenLibreta } from '../src/libreta';

describe('libreta de gastos', () => {
	it('categoría por el concepto', () => {
		expect(categoriaSimple('Gasolina Repsol')).toBe('combustible');
		expect(categoriaSimple('Seguro Mapfre')).toBe('seguro');
		expect(categoriaSimple('Cambio de aceite y filtro')).toBe('mantenimiento');
		expect(categoriaSimple('Cena')).toBe('otros');
	});
	it('mes, año, €/km y consumo', () => {
		const g = [
			{ fecha: '2026-10-02', categoria: 'combustible', importeCent: 6000, km: 150000, litros: 40 },
			{ fecha: '2026-10-10', categoria: 'combustible', importeCent: 5000, km: 150600, litros: 36 },
			{ fecha: '2026-03-01', categoria: 'seguro', importeCent: 30000, km: null, litros: null },
			{ fecha: '2025-12-01', categoria: 'itv', importeCent: 4000, km: null, litros: null }
		];
		const r = resumenLibreta(g, [{ fecha: '2026-01-05', km: 149000 }], '2026-10-12');
		expect(r.mes).toBe(11000);
		expect(r.anio).toBe(41000);
		expect(r.total).toBe(45000);
		expect(r.porCategoria[0]).toEqual({ categoria: 'seguro', total: 30000 });
		expect(r.porKm).toBe(Math.round(41000 / 1600));
		expect(r.consumo).toBe(6);
	});
});
