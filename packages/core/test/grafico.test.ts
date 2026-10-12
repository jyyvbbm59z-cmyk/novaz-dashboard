import { describe, expect, it } from 'vitest';
import { escalaEje, seriesGasto } from '../src/grafico';

const cats = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, nombre: `Cat ${i + 1}` }));
// Cat 1 gasta más que Cat 2, y así; Cat 9 y 10, muy poco
const anio = cats.map((c) => ({ cat: c.id, total: (11 - c.id) * 1000 }));

describe('gasto por mes apilado', () => {
	it('siete con color fijo por lo que gastan en el año; el resto, «Otros»', () => {
		const porMes = cats.map((c) => ({ mes: '03', cat: c.id, total: 100 }));
		const g = seriesGasto(porMes, anio, cats);
		expect(g.series.map((s) => s.hueco)).toEqual([1, 2, 3, 4, 5, 6, 7, 0]);
		expect(g.series.at(-1)!.nombre).toBe('Otros');
		expect(g.meses[2].total).toBe(1000);
		expect(g.meses[2].partes.otros).toBe(300);
	});
	it('al filtrar por una categoría conserva su color y el gráfico solo la tiene a ella', () => {
		const g = seriesGasto([{ mes: '05', cat: 3, total: 500 }], anio, cats);
		expect(g.series).toEqual([{ clave: 'c3', nombre: 'Cat 3', hueco: 3 }]);
		const otra = seriesGasto([{ mes: '05', cat: 9, total: 50 }], anio, cats);
		expect(otra.series).toEqual([{ clave: 'otros', nombre: 'Cat 9', hueco: 0 }]);
	});
	it('eje con números redondos', () => {
		expect(escalaEje(83000)).toEqual([0, 25000, 50000, 75000, 100000]);
		expect(escalaEje(1200)).toEqual([0, 500, 1000, 1500]);
		expect(escalaEje(0)).toEqual([0, 25, 50, 75, 100]);
	});
});
