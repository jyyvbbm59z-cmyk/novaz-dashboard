import { describe, expect, it } from 'vitest';
import { enTandas } from '../src/consultas';

describe('consultas por tandas (D1: máx. 100 parámetros)', () => {
	it('parte en tandas de 90 y junta los resultados en orden', async () => {
		const tandas: number[] = [];
		const ids = Array.from({ length: 205 }, (_, i) => i);
		const r = await enTandas(ids, async (p) => (tandas.push(p.length), p.map((x) => x * 2)));
		expect(tandas).toEqual([90, 90, 25]);
		expect(r.length).toBe(205);
		expect(r[204]).toBe(408);
		expect(await enTandas([], async () => [1])).toEqual([]);
	});
});
