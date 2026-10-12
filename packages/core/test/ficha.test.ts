import { describe, expect, it } from 'vitest';
import { buscarEnFicha, EJEMPLO_FICHA, leerFichaJSON, plantillaFicha, sugerenciasFicha } from '../src/ficha';

describe('ficha técnica', () => {
	it('plantilla según el tipo', () => {
		expect(plantillaFicha('Moto').some((d) => d.clave === 'kit_transmision')).toBe(true);
		expect(plantillaFicha('Coche').some((d) => d.clave === 'aceite_caja')).toBe(true);
	});
	it('lee el JSON novaz-ficha sin fiarse', () => {
		const r = leerFichaJSON(EJEMPLO_FICHA);
		expect(r.datos.length).toBe(3);
		expect(r.procedimientos[0].pasos[1].par).toBe('23 Nm al montarlo');
		const raro = leerFichaJSON({ datos: [{ nombre: 'Aceite', valor: '10W40', seccion: 'inventada' }, { nombre: '', valor: 'x' }], procedimientos: [{ titulo: 'Algo', pasos: ['Paso uno', ''] }] });
		expect(raro.datos).toEqual([expect.objectContaining({ seccion: 'otros', clave: 'aceite', valor: '10W40', verificado: false })]);
		expect(raro.procedimientos[0].pasos).toEqual([{ texto: 'Paso uno', par: null }]);
		expect(leerFichaJSON(null).avisos.length).toBe(1);
	});
	it('aprende de lo que usas en los mantenimientos', () => {
		const s = sugerenciasFicha(
			[
				{ nombre: 'Aceite Motul 7100 10W-40', marca: 'Motul', referencia: null, cantidad: 3.2, unidad: 'L', fecha: '2026-01-12' },
				{ nombre: 'Filtro de aceite', marca: 'Hiflofiltro', referencia: 'HF138', cantidad: 1, unidad: 'ud', fecha: '2026-01-12' }
			],
			{ filtro_aceite_ref: 'HF138' },
			plantillaFicha('Moto')
		);
		expect(s.map((x) => [x.clave, x.valor])).toEqual([
			['aceite_motor', '10W40 · Motul'],
			['aceite_motor_litros', '3,2']
		]);
	});
	it('responde preguntas con la ficha', () => {
		const datos = [
			{ clave: 'aceite_motor', nombre: 'Aceite de motor', seccion: 'motor', valor: '10W40' },
			{ clave: 'par_ruedas', nombre: 'Tornillos de rueda', seccion: 'pares', valor: '120' },
			{ clave: 'presion_del', nombre: 'Presión delantera', seccion: 'ruedas', valor: '2,2' }
		];
		expect(buscarEnFicha('¿Qué aceite lleva?', datos)[0].clave).toBe('aceite_motor');
		expect(buscarEnFicha('par de apriete de las ruedas', datos)[0].clave).toBe('par_ruedas');
		expect(buscarEnFicha('a cuánto inflo las ruedas', datos)[0].clave).toBe('presion_del');
	});
});

import { readFileSync } from 'node:fs';

describe('manual de la Bandit', () => {
	it('el JSON del manual se importa entero', () => {
		const raw = JSON.parse(readFileSync(new URL('../../../docs/manuales/suzuki-gsf600-bandit.novaz-ficha.json', import.meta.url), 'utf8'));
		const r = leerFichaJSON(raw);
		expect(r.avisos).toEqual([]);
		expect(r.datos.length).toBe(93);
		expect(r.procedimientos.length).toBe(8);
		expect(new Set(r.datos.map((d) => d.clave)).size).toBe(93);
		expect(r.datos.find((d) => d.clave === 'par_eje_tras')?.valor).toBe('100');
		expect(r.datos.every((d) => d.verificado)).toBe(true);
	});
});
