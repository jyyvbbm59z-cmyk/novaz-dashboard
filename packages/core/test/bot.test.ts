import { describe, expect, it } from 'vitest';
import { buscarVehiculo, faltanDatos, interpretarReglas, normalizarIntencion, numeroES, resumenIntencion, type VehiculoBot } from '../src/bot';

const V: VehiculoBot[] = [
	{ id: 1, alias: 'Bandit', marca: 'Suzuki', modelo: 'GSF 600', matricula: '7858 CHK' },
	{ id: 5, alias: 'Ibiza', marca: 'SEAT', modelo: 'Ibiza 1.4 TDI 105 CV', matricula: '6780 JNX' },
	{ id: 6, alias: 'Marbella', marca: 'SEAT', modelo: 'Marbella', matricula: 'A 9742 DB' }
];

describe('bot: números y vehículos', () => {
	it('números en español', () => {
		expect(numeroES('117.200')).toBe(117200);
		expect(numeroES('72,50 €')).toBe(72.5);
		expect(numeroES('1.234,5')).toBe(1234.5);
		expect(numeroES('40 L')).toBe(40);
	});
	it('encuentra el vehículo por alias, matrícula o modelo; la marca sola no basta si hay dos', () => {
		expect(buscarVehiculo('repostaje ibiza', V)).toBe(5);
		expect(buscarVehiculo('la 7858CHK', V)).toBe(1);
		expect(buscarVehiculo('el suzuki', V)).toBe(1);
		expect(buscarVehiculo('el seat', V)).toBeNull();
		expect(buscarVehiculo('nada', V)).toBeNull();
	});
});

describe('bot: intérprete por reglas', () => {
	it('repostaje en lenguaje natural', () => {
		expect(interpretarReglas('Repostaje Ibiza 40 litros 72,50 € 117.200 km', V)).toEqual({ tipo: 'repostaje', vehiculoId: 5, litros: 40, importeCent: 7250, km: 117200, gasolinera: null, lleno: true });
	});
	it('km', () => {
		expect(interpretarReglas('El Ibiza tiene 117.300 km', V)).toEqual({ tipo: 'km', vehiculoId: 5, km: 117300 });
		expect(interpretarReglas('/km bandit 29500', V)).toEqual({ tipo: 'km', vehiculoId: 1, km: 29500 });
	});
	it('comandos', () => {
		expect(interpretarReglas('/hoy', V)).toEqual({ tipo: 'consulta', vehiculoId: null, tema: 'general' });
		expect(interpretarReglas('/compra lija de 400 · 6 €, masilla', V)).toEqual({ tipo: 'compra', items: ['Lija de 400 · 6 €', 'Masilla'], vehiculoId: null });
		expect(interpretarReglas('/averia bandit retén horquilla urgente', V)).toMatchObject({ tipo: 'averia', vehiculoId: 1, titulo: 'Retén horquilla urgente', urgente: true });
		expect(interpretarReglas('/start', V)).toEqual({ tipo: 'ayuda' });
		expect(interpretarReglas('hola qué tal', V).tipo).toBe('desconocido');
	});
});

describe('bot: lo que devuelve la IA', () => {
	it('normaliza y descarta lo dudoso', () => {
		expect(normalizarIntencion({ accion: 'repostaje', vehiculo: 'ibiza', litros: '40', importe: '72,00', km: '117.200' }, V, '')).toMatchObject({ tipo: 'repostaje', vehiculoId: 5, litros: 40, importeCent: 7200, km: 117200, lleno: true });
		expect(normalizarIntencion({ accion: 'mantenimiento', vehiculo: 'Ibiza', titulo: 'cambio de aceite y filtro', revisiones: ['aceite', 'C2'] }, V, '')).toMatchObject({ tipo: 'mantenimiento', titulo: 'Cambio de aceite y filtro', revisiones: ['aceite', 'C2'] });
		expect(normalizarIntencion({ accion: 'gasto', importe: 0 }, V, 'x').tipo).toBe('desconocido');
		expect(normalizarIntencion({ accion: 'consulta', vehiculo: 'Bandit' }, V, '')).toEqual({ tipo: 'consulta', vehiculoId: 1, tema: 'vehiculo' });
		// Si la IA no dice el vehículo pero el texto sí lo menciona
		expect(normalizarIntencion({ accion: 'km', km: 29600 }, V, 'la bandit marca 29600')).toEqual({ tipo: 'km', vehiculoId: 1, km: 29600 });
	});
});

describe('confirmación', () => {
	it('resume lo entendido y señala lo que falta', () => {
		const i = interpretarReglas('Repostaje Ibiza 40 l 72 € 117.200 km', V);
		const r = resumenIntencion(i, V);
		expect(r).toContain('Repostaje');
		expect(r).toContain('Ibiza');
		expect(r).toContain('117.200 km');
		expect(faltanDatos(i)).toEqual([]);
		expect(faltanDatos({ tipo: 'repostaje', vehiculoId: 1, litros: null, importeCent: 5000, km: null, gasolinera: null, lleno: true })).toEqual(['los litros']);
	});
});

describe('dónde está', () => {
	it('entiende la pregunta', () => {
		expect(interpretarReglas('¿Dónde está la llave dinamométrica?', V)).toEqual({ tipo: 'consulta', vehiculoId: null, tema: 'donde', buscar: 'llave dinamométrica' });
		expect(interpretarReglas('/donde polímetro', V)).toMatchObject({ tema: 'donde', buscar: 'polímetro' });
		expect(normalizarIntencion({ accion: 'consulta', tema: 'donde', buscar: 'llave de 13' }, V, 'x')).toMatchObject({ tema: 'donde', buscar: 'llave de 13' });
	});
});
