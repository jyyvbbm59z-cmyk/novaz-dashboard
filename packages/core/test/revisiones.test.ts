import { describe, expect, it } from 'vitest';
import { estadoMantenimiento, planAplica, tienePlanesPropios } from '../src/alertas';
import { expandirIncluidos, plantillaSugerida, PLANTILLAS_REVISION, textoPeriodicidad } from '../src/revisiones';

describe('revisiones por niveles', () => {
	it('la I3 incluye la I2 y esta la I1', () => {
		const planes = [
			{ id: 1, incluye: [] },
			{ id: 2, incluye: [1] },
			{ id: 3, incluye: [2] },
			{ id: 4, incluye: [] }
		];
		expect(expandirIncluidos([3], planes).sort()).toEqual([1, 2, 3]);
		expect(expandirIncluidos([4, 2], planes).sort()).toEqual([1, 2, 4]);
		expect(expandirIncluidos([], planes)).toEqual([]);
	});
	it('periodicidad en días (cada dos semanas)', () => {
		const e = estadoMantenimiento({ cadaKm: 1000, cadaMeses: null, cadaDias: 14, avisoKm: 150, avisoDias: 3 }, { fecha: '2026-10-01', km: 29_000 }, { hoy: '2026-10-09', kmActual: 29_350, ritmo: 20 });
		expect(e.proximaFecha).toBe('2026-10-15');
		expect(e.nivel).toBe('ok');
		const tarde = estadoMantenimiento({ cadaKm: null, cadaMeses: null, cadaDias: 14, avisoKm: 0, avisoDias: 3 }, { fecha: '2026-09-20', km: null }, { hoy: '2026-10-09', kmActual: null, ritmo: null });
		expect(tarde.nivel).toBe('vencido');
	});
	it('los planes propios del vehículo sustituyen a los del tipo', () => {
		const v = { id: 1, tipoId: 2 };
		const planes = [
			{ vehiculoId: null, tipoVehiculoId: 2, activo: true },
			{ vehiculoId: 1, tipoVehiculoId: null, activo: true }
		];
		const propios = tienePlanesPropios(planes, 1);
		expect(propios).toBe(true);
		expect(planAplica(planes[0], v, propios)).toBe(false);
		expect(planAplica(planes[1], v, propios)).toBe(true);
		// Otra moto del mismo tipo sigue con los genéricos
		expect(planAplica(planes[0], { id: 3, tipoId: 2 }, tienePlanesPropios(planes, 3))).toBe(true);
	});
	it('plantillas coherentes y sugerencia por modelo', () => {
		for (const p of PLANTILLAS_REVISION) {
			const codigos = p.niveles.map((n) => n.codigo);
			expect(new Set(codigos).size, p.id).toBe(codigos.length);
			for (const n of p.niveles) {
				for (const inc of n.incluye) expect(codigos, `${p.id} ${n.codigo}`).toContain(inc);
				expect(n.cadaDias || n.cadaMeses || n.cadaKm, n.codigo).toBeTruthy();
				expect(n.tareas.length).toBeGreaterThan(0);
			}
		}
		expect(plantillaSugerida({ marca: 'Suzuki', modelo: 'GSF 600', alias: 'Bandit' })?.id).toBe('suzuki-gsf600');
		expect(plantillaSugerida({ marca: 'Vespa', modelo: 'PX 200E', alias: 'Vespa' })).toBeNull();
	});
	it('texto de periodicidad', () => {
		expect(textoPeriodicidad({ cadaDias: 14, cadaMeses: null, cadaKm: 1000 })).toBe('cada 2 semanas o 1000 km');
		expect(textoPeriodicidad({ cadaMeses: 6, cadaKm: 6000 })).toBe('cada 6 meses o 6000 km');
		expect(textoPeriodicidad({ cadaMeses: 24, cadaKm: null })).toBe('cada 2 años');
		expect(textoPeriodicidad({ cadaMeses: null, cadaKm: 800 })).toBe('cada 800 km');
	});
});
