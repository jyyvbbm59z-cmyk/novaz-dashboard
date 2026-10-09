import { describe, expect, it } from 'vitest';
import { revisionContable, type DatosRevision } from '../src/revision';

const base: DatosRevision = {
	tesoreria: 50000,
	socio: 0,
	ivaPagar: 0,
	sinCategoria: 0,
	posiblesInmovilizado: [],
	hayAportacionMensual: true,
	gastoMedioMensual: 0,
	diasCuadre: 3,
	sugerencia: null,
	hayMovimientos: true
};

describe('revisión contable', () => {
	it('sin problemas no hay consejos', () => {
		expect(revisionContable(base)).toEqual([]);
	});
	it('prioriza lo urgente y enlaza la solución con el importe', () => {
		const c = revisionContable({ ...base, tesoreria: -12345, socio: 12000, diasCuadre: null, hayAportacionMensual: false, gastoMedioMensual: 23456 });
		expect(c[0]).toMatchObject({ clave: 'negativo', nivel: 'urgente' });
		expect(c[0].accion?.href).toContain('importe=123,45');
		expect(c.map((x) => x.clave)).toEqual(['negativo', 'socio', 'cuadre', 'aportacionMensual']);
		expect(c.find((x) => x.clave === 'aportacionMensual')?.accion?.href).toContain('importe=240,00');
	});
	it('previsión e IVA', () => {
		const c = revisionContable({ ...base, sugerencia: { mensual: 15000, mes: '2027-02' }, ivaPagar: 4200 });
		expect(c[0].titulo).toBe('Te faltará dinero en febrero');
		expect(c[1].clave).toBe('iva');
	});
});
