import { describe, expect, it } from 'vitest';
import {
	articuloCoincide,
	costesVehiculo,
	existencias,
	listaCompraAutomatica,
	ordenarTareasLocal,
	piezasDeTareas,
	siguienteTareaLocal,
	type ArticuloConStock
} from '../src/inventario';

const art = (o: Partial<ArticuloConStock>): ArticuloConStock => ({ id: 1, tipo: 'consumible', nombre: 'x', referencia: null, unidad: 'ud', stockMinimo: null, vehiculoIds: [], cantidad: 0, ...o });

describe('inventario', () => {
	it('existencias como suma de movimientos', () => {
		const e = existencias([
			{ articuloId: 1, cantidad: 4 },
			{ articuloId: 1, cantidad: -3.5 },
			{ articuloId: 2, cantidad: 1 }
		]);
		expect(e.get(1)).toBe(0.5);
		expect(e.get(2)).toBe(1);
	});
	it('saca las piezas de las tareas «Cambiar…»', () => {
		expect(piezasDeTareas(['Cambiar aceite de motor (3,5 L con cambio de filtro)', 'Holgura de válvulas', 'Cambiar bujías', 'Sustituir líquido de frenos'])).toEqual([
			'Aceite de motor',
			'Bujías',
			'Líquido de frenos'
		]);
	});
	it('reconoce el artículo de una pieza', () => {
		expect(articuloCoincide('Filtro de aceite', { nombre: 'Filtro aceite HF138' })).toBe(true);
		expect(articuloCoincide('Aceite de motor', { nombre: 'Aceite Motul 7100 10W40' })).toBe(true);
		expect(articuloCoincide('Filtro de aceite', { nombre: 'Aceite Motul 7100' })).toBe(false);
		expect(articuloCoincide('Bujías', { nombre: 'Bujía', referencia: 'NGK CR9EK' })).toBe(true);
		expect(articuloCoincide('Latiguillos de freno', { nombre: 'Latiguillo freno delantero' })).toBe(true);
	});
});

describe('lista de la compra automática', () => {
	const revision = { vehiculoId: 1, vehiculo: 'Bandit', codigo: 'I2', nombre: 'Servicio', tareas: ['Cambiar aceite de motor', 'Cambiar filtro de aceite', 'Frenos: pastillas'], nivel: 'pronto' as const, dias: 12 };
	it('reponer lo que baja del mínimo y piezas de revisiones próximas que no tienes', () => {
		const items = listaCompraAutomatica(
			[
				art({ id: 1, nombre: 'Aceite Motul 7100 10W40', unidad: 'L', cantidad: 4, stockMinimo: 1 }),
				art({ id: 2, nombre: 'Guantes de nitrilo', cantidad: 5, stockMinimo: 10 }),
				art({ id: 3, nombre: 'Filtro aceite HF138', cantidad: 0, vehiculoIds: [1] }),
				art({ id: 4, tipo: 'herramienta', nombre: 'Llave de filtro', cantidad: 1, stockMinimo: 2 })
			],
			[revision, { ...revision, vehiculoId: 2, vehiculo: 'Vespa', nivel: 'ok', dias: 200 }]
		);
		expect(items.map((i) => [i.motivo, i.texto, i.articuloId])).toEqual([
			['stock', 'Guantes de nitrilo', 2],
			['revision', 'Filtro de aceite', 3]
		]);
		expect(items[1].detalle).toBe('I2 · Servicio de Bandit');
	});
});

describe('costes por vehículo', () => {
	it('separa la compra, calcula €/km, €/mes y margen', () => {
		const c = costesVehiculo({
			movimientos: [
				{ tipo: 'gasto', importeCent: 150000, cuenta: '600', categoria: 'Compra de vehículo', color: '#666' },
				{ tipo: 'gasto', importeCent: 30000, cuenta: '602', categoria: 'Recambios', color: '#f2a' },
				{ tipo: 'gasto', importeCent: 20000, cuenta: null, categoria: 'Seguros', color: '#4f8' },
				{ tipo: 'ingreso', importeCent: 5000, cuenta: '705', categoria: 'Trabajos', color: null }
			],
			kmRecorridos: 2500,
			desde: '2026-01-01',
			hoy: '2026-07-01',
			horas: 10,
			tarifaHoraCent: 3500,
			valorEstimadoCent: 260000
		});
		expect(c.compra).toBe(150000);
		expect(c.operativo).toBe(50000);
		expect(c.costeKm).toBe(20);
		expect(c.meses).toBe(6);
		expect(c.inversion).toBe(200000);
		expect(c.manoObra).toBe(35000);
		expect(c.margen).toBe(60000);
		expect(c.margenConHoras).toBe(25000);
		expect(c.porCategoria[0].nombre).toBe('Compra de vehículo');
	});
});

describe('tareas del local', () => {
	it('repetición y orden de trabajo', () => {
		expect(siguienteTareaLocal('2026-10-10', 12)).toBe('2027-10-10');
		const orden = ordenarTareasLocal(
			[
				{ id: 1, prioridad: 'baja', fechaLimite: null, estado: 'pendiente' },
				{ id: 2, prioridad: 'alta', fechaLimite: '2026-12-01', estado: 'pendiente' },
				{ id: 3, prioridad: 'baja', fechaLimite: '2026-10-01', estado: 'pendiente' },
				{ id: 4, prioridad: 'alta', fechaLimite: '2026-11-01', estado: 'pendiente' }
			],
			'2026-10-10'
		);
		expect(orden.map((t) => t.id)).toEqual([3, 4, 2, 1]);
	});
});
