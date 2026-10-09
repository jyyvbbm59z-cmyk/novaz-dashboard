import { describe, expect, it } from 'vitest';
import {
	estadoMantenimiento,
	estadoVencimiento,
	nivelPorDias,
	planAplica,
	ritmoKmDia,
	tipoVencimientoAplica,
	umbralAlcanzado
} from '../src/alertas';
import { claveDesdeEtiqueta, parsearCampos, type CampoDef } from '../src/campos';
import { euros, parsearEuros } from '../src/dinero';
import { diasEntre, hoy, sumarMeses, textoDias } from '../src/fechas';
import { AJUSTES_POR_DEFECTO, fusionarAjustes } from '../src/ajustes';

describe('fechas', () => {
	it('suma meses respetando fin de mes', () => {
		expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
		expect(sumarMeses('2028-01-31', 1)).toBe('2028-02-29');
		expect(sumarMeses('2026-11-15', 3)).toBe('2027-02-15');
		expect(sumarMeses('2026-03-10', -3)).toBe('2025-12-10');
	});
	it('cuenta días aunque haya cambio de hora', () => {
		expect(diasEntre('2026-03-28', '2026-03-30')).toBe(2);
		expect(diasEntre('2026-10-09', '2026-10-01')).toBe(-8);
	});
	it('calcula hoy en Madrid', () => {
		// 23:30 UTC del 9 oct = 01:30 del 10 oct en Madrid (CEST)
		expect(hoy('Europe/Madrid', new Date('2026-10-09T23:30:00Z'))).toBe('2026-10-10');
	});
	it('texto humano', () => {
		expect(textoDias(0)).toBe('hoy');
		expect(textoDias(12)).toBe('en 12 días');
		expect(textoDias(-3)).toBe('hace 3 días');
	});
});

describe('dinero', () => {
	it('parsea formatos españoles e ingleses', () => {
		expect(parsearEuros('12')).toBe(1200);
		expect(parsearEuros('12,5')).toBe(1250);
		expect(parsearEuros('1.234,56 €')).toBe(123456);
		expect(parsearEuros('88.70')).toBe(8870);
		expect(parsearEuros('abc')).toBeNull();
		expect(parsearEuros('')).toBeNull();
	});
	it('formatea', () => {
		expect(euros(123456)).toMatch(/^1\.?234,56\s€$/);
		expect(euros(null)).toBe('—');
	});
});

describe('campos personalizados', () => {
	const defs: CampoDef[] = [
		{ clave: 'cilindrada', etiqueta: 'Cilindrada', tipo: 'numero', unidad: 'cc' },
		{ clave: 'combustible', etiqueta: 'Combustible', tipo: 'lista', opciones: ['Gasolina', 'Diésel'] },
		{ clave: 'clasico', etiqueta: 'Histórico', tipo: 'booleano' },
		{ clave: 'color', etiqueta: 'Color', tipo: 'texto', obligatorio: true }
	];
	it('convierte tipos', () => {
		const r = parsearCampos(defs, { cilindrada: '645', combustible: 'Gasolina', clasico: 'on', color: 'Rojo' });
		expect(r).toEqual({ ok: true, valores: { cilindrada: 645, combustible: 'Gasolina', clasico: true, color: 'Rojo' } });
	});
	it('detecta errores', () => {
		const r = parsearCampos(defs, { cilindrada: 'mucha', combustible: 'Vapor' });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['cilindrada', 'color', 'combustible']);
	});
	it('genera claves', () => {
		expect(claveDesdeEtiqueta('Nº de plazas')).toBe('n_de_plazas');
		expect(claveDesdeEtiqueta('Año de pintura')).toBe('ano_de_pintura');
	});
});

describe('vencimientos', () => {
	it('niveles', () => {
		expect(nivelPorDias(-1, 30, 7)).toBe('vencido');
		expect(nivelPorDias(5, 30, 7)).toBe('urgente');
		expect(nivelPorDias(20, 30, 7)).toBe('pronto');
		expect(nivelPorDias(45, 30, 7)).toBe('ok');
		expect(estadoVencimiento('2026-10-21', '2026-10-09', [30, 7, 1])).toEqual({ dias: 12, nivel: 'pronto' });
	});
	it('umbral para avisos', () => {
		expect(umbralAlcanzado(40, [30, 7, 1])).toBeNull();
		expect(umbralAlcanzado(30, [30, 7, 1])).toBe(30);
		expect(umbralAlcanzado(6, [30, 7, 1])).toBe(7);
		expect(umbralAlcanzado(0, [30, 7, 1])).toBe(1);
		expect(umbralAlcanzado(-2, [30, 7, 1])).toBe('vencido');
	});
	it('aplica por tipo de vehículo', () => {
		expect(tipoVencimientoAplica({ tiposVehiculoIds: [], activo: true }, 3)).toBe(true);
		expect(tipoVencimientoAplica({ tiposVehiculoIds: [1, 2], activo: true }, 3)).toBe(false);
		expect(tipoVencimientoAplica({ tiposVehiculoIds: [3], activo: false }, 3)).toBe(false);
	});
});

describe('kilómetros y mantenimiento', () => {
	const lecturas = [
		{ fecha: '2026-01-01', km: 10_000 },
		{ fecha: '2026-04-01', km: 11_800 },
		{ fecha: '2026-10-01', km: 15_460 }
	];
	it('ritmo de uso', () => {
		expect(ritmoKmDia(lecturas, '2026-10-09')).toBeCloseTo(5460 / 273, 5);
		expect(ritmoKmDia([lecturas[0]], '2026-10-09')).toBeNull();
		expect(ritmoKmDia([{ fecha: '2026-10-01', km: 1 }, { fecha: '2026-10-03', km: 50 }], '2026-10-09')).toBeNull();
	});

	const plan = { cadaKm: 6000, cadaMeses: 12, avisoKm: 500, avisoDias: 30 };

	it('sin historial no alerta', () => {
		const e = estadoMantenimiento(plan, null, { hoy: '2026-10-09', kmActual: 15_000, ritmo: 20 });
		expect(e.sinHistorial).toBe(true);
		expect(e.nivel).toBe('ok');
	});
	it('gana el km cuando llega antes', () => {
		// último a 10.000 km el 2026-01-01 → próximo a 16.000 km o 2027-01-01
		const e = estadoMantenimiento(plan, { fecha: '2026-01-01', km: 10_000 }, { hoy: '2026-10-09', kmActual: 15_600, ritmo: 20 });
		expect(e.proximoKm).toBe(16_000);
		expect(e.kmRestantes).toBe(400);
		expect(e.diasRestantes).toBe(20);
		expect(e.motivo).toBe('km');
		expect(e.nivel).toBe('pronto');
	});
	it('gana la fecha cuando el vehículo apenas se usa', () => {
		const e = estadoMantenimiento(plan, { fecha: '2025-10-20', km: 10_000 }, { hoy: '2026-10-09', kmActual: 10_300, ritmo: 1 });
		expect(e.proximaFecha).toBe('2026-10-20');
		expect(e.diasRestantes).toBe(11);
		expect(e.motivo).toBe('fecha');
		expect(e.nivel).toBe('pronto');
	});
	it('km pasado = vencido aunque no haya ritmo', () => {
		const e = estadoMantenimiento({ ...plan, cadaMeses: null }, { fecha: '2026-01-01', km: 10_000 }, { hoy: '2026-10-09', kmActual: 16_200, ritmo: null });
		expect(e.nivel).toBe('vencido');
		expect(e.motivo).toBe('km');
	});
	it('ámbito del plan', () => {
		const v = { id: 7, tipoId: 2 };
		expect(planAplica({ vehiculoId: null, tipoVehiculoId: null, activo: true }, v)).toBe(true);
		expect(planAplica({ vehiculoId: null, tipoVehiculoId: 2, activo: true }, v)).toBe(true);
		expect(planAplica({ vehiculoId: null, tipoVehiculoId: 1, activo: true }, v)).toBe(false);
		expect(planAplica({ vehiculoId: 7, tipoVehiculoId: 1, activo: true }, v)).toBe(true);
		expect(planAplica({ vehiculoId: 8, tipoVehiculoId: null, activo: true }, v)).toBe(false);
	});
});

describe('ajustes', () => {
	it('fusiona con los defectos', () => {
		const a = fusionarAjustes([
			{ clave: 'acento', valor: '#ff0000' },
			{ clave: 'momentos', valor: { tareaHecha: { efecto: 'confeti', sonido: 'aplausos' } } },
			{ clave: 'desconocida', valor: 1 }
		]);
		expect(a.acento).toBe('#ff0000');
		expect(a.momentos.tareaHecha.efecto).toBe('confeti');
		expect(a.momentos.faseCompletada).toEqual(AJUSTES_POR_DEFECTO.momentos.faseCompletada);
		expect('desconocida' in a).toBe(false);
	});
});
