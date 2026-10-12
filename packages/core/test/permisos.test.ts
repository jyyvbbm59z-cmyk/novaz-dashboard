import { describe, expect, it } from 'vitest';
import { normalizarPermisos, permisoDeRuta } from '../src/permisos';

describe('permisos', () => {
	it('cada ruta pide su permiso', () => {
		expect(permisoDeRuta('/contabilidad/tesoreria')).toBe('dinero');
		expect(permisoDeRuta('/facturas/3')).toBe('dinero');
		expect(permisoDeRuta('/archivos/movimiento/12/x.jpg')).toBe('dinero');
		expect(permisoDeRuta('/flota/5')).toBe('vehiculos');
		expect(permisoDeRuta('/agenda')).toBe('vehiculos');
		expect(permisoDeRuta('/inventario/mueble/2')).toBe('inventario');
		expect(permisoDeRuta('/compras')).toBe('inventario');
		expect(permisoDeRuta('/local')).toBe('local');
		expect(permisoDeRuta('/ajustes/usuarios')).toBe('ajustes');
		expect(permisoDeRuta('/')).toBeNull();
		expect(permisoDeRuta('/perfil')).toBeNull();
		expect(permisoDeRuta('/flotante')).toBeNull();
	});
	it('limpia permisos desconocidos', () => {
		expect(normalizarPermisos(['dinero', 'raro', 'vehiculos'])).toEqual(['vehiculos', 'dinero']);
		expect(normalizarPermisos(null)).toEqual([]);
	});
});

import { recortarInforme, type DatosInforme } from '../src/informe';

describe('informe por persona', () => {
	const d = {
		taller: 'Novaz',
		hoy: '2026-10-12',
		alertas: [{ clave: 'x' }],
		nuevas: new Set<string>(),
		local: [{ titulo: 'Pintar', zona: null, fechaLimite: null, prioridad: 'media' }],
		compras: 2,
		listaCompra: [{ texto: 'Lija', para: 'local' }],
		fueraDeSitio: 1,
		finanzas: { tesoreria: 52037, gastoMes: 0, gastoAnio: 0, ingresosAnio: 0, diasCuadre: 3 },
		flota: [{ alias: 'Ibiza', mensual: 9000, porKm: 20, completo: true }],
		kmSinActualizar: []
	} as unknown as DatosInforme;
	it('sin dinero no hay finanzas ni costes; sin local, sin sus tareas', () => {
		const r = recortarInforme(d, ['vehiculos', 'inventario']);
		expect(r.finanzas).toBeNull();
		expect(r.flota).toEqual([]);
		expect(r.local).toEqual([]);
		expect(r.alertas.length).toBe(1);
		expect(r.listaCompra.length).toBe(1);
		expect(recortarInforme(d, ['vehiculos', 'inventario', 'local', 'dinero', 'ajustes']).finanzas?.tesoreria).toBe(52037);
	});
	it('la compra de las tareas del local, solo con «El local»', () => {
		const conLocal = { ...d, listaCompra: [{ texto: 'Lija', para: 'apuntado a mano' }, { texto: 'Pintura', para: 'local: Pintar', local: true }] };
		expect(recortarInforme(conLocal, ['vehiculos', 'inventario']).listaCompra.map((c) => c.texto)).toEqual(['Lija']);
		expect(recortarInforme(conLocal, ['vehiculos', 'inventario']).compras).toBe(1);
		expect(recortarInforme(conLocal, ['inventario', 'local']).listaCompra.length).toBe(2);
	});
	it('con privados de otros: solo las obras de los suyos y los del taller', () => {
		const conObras = { ...d, obras: [{ nombre: 'Vespa', vehiculoId: 3, avance: 0.1 }, { nombre: 'Marbella', vehiculoId: 6, avance: 0 }] };
		expect(recortarInforme(conObras, ['vehiculos'], { ids: [1, 6], alias: [] }).obras?.map((o) => o.nombre)).toEqual(['Marbella']);
		expect(recortarInforme(conObras, ['vehiculos']).obras?.length).toBe(2);
		expect(recortarInforme(conObras, ['inventario']).obras).toBeUndefined();
	});
});
