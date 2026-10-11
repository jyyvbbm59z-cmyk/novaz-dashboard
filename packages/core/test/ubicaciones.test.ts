import { describe, expect, it } from 'vitest';
import { buscarArticulos, codigoUbicacion, describirUbicacion, siguienteCodigoMueble, siguienteLetra, zonaEnPunto, ZONAS_INICIALES } from '../src/ubicaciones';

const zonas = ZONAS_INICIALES.map((z, i) => ({ ...z, id: i + 1 }));

describe('ubicaciones', () => {
	it('códigos de mueble y de ubicación', () => {
		expect(siguienteCodigoMueble('estanteria', [{ codigo: 'E1' }, { codigo: 'E3' }, { codigo: 'C1' }])).toBe('E4');
		expect(siguienteCodigoMueble('cajonera', [])).toBe('C1');
		expect(codigoUbicacion({ codigo: 'D' }, { codigo: 'E2' }, 3)).toBe('D·E2·3');
		expect(codigoUbicacion({ codigo: 'D' }, null)).toBe('D');
		expect(codigoUbicacion(null, null)).toBeNull();
	});
	it('la zona de un punto del plano', () => {
		expect(zonaEnPunto(1, 2, zonas)?.codigo).toBe('A');
		expect(zonaEnPunto(6, 6, zonas)?.codigo).toBe('D');
		expect(zonaEnPunto(5, 15.8, zonas)?.codigo).toBe('G');
		expect(zonaEnPunto(20, 20, zonas)).toBeNull();
	});
	it('describe dónde está un artículo', () => {
		const muebles = [{ id: 7, codigo: 'E2', nombre: 'Estantería', tipo: 'estanteria' as const, zonaId: 4 }];
		const d = describirUbicacion({ zonaId: 4, muebleId: 7, nivel: 3, ubicacion: 'caja roja' }, zonas, muebles);
		expect(d.codigo).toBe('D·E2·3');
		expect(d.texto).toBe('Herramientas · Estantería E2 · balda 3 · caja roja');
		expect(describirUbicacion({ zonaId: null, muebleId: null, nivel: null }, zonas, muebles).codigo).toBeNull();
	});
	it('busca artículos por nombre', () => {
		const a = (nombre: string) => ({ nombre, marca: null, categoria: null, referencia: null });
		const arts = [a('Llave dinamométrica 1/2"'), a('Llave de vaso 13'), a('Polímetro'), a('Juego de llaves fijas')];
		expect(buscarArticulos('la dinamométrica', arts)[0].nombre).toContain('dinamométrica');
		expect(buscarArticulos('llave de 13', arts)[0].nombre).toBe('Llave de vaso 13');
		expect(buscarArticulos('llaves', arts).length).toBe(3);
	});
});

describe('contenedores', () => {
	it('letras y códigos con contenedor', () => {
		expect(siguienteLetra([])).toBe('A');
		expect(siguienteLetra(['A', 'C'])).toBe('B');
		expect(siguienteLetra('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))).toBe('AA');
		expect(codigoUbicacion({ codigo: 'E' }, { codigo: 'E1' }, 2, { letra: 'B' })).toBe('E·E1·2·B');
		const muebles = [{ id: 7, codigo: 'E1', nombre: 'Estantería', tipo: 'estanteria' as const, zonaId: 5 }];
		const conts = [{ id: 3, letra: 'B', nombre: 'Electricidad', tipo: 'cubo' as const }];
		const d = describirUbicacion({ zonaId: 5, muebleId: 7, nivel: 2, contenedorId: 3 }, zonas, muebles, conts);
		expect(d.codigo).toBe('E·E1·2·B');
		expect(d.texto).toBe('Almacén · Estantería E1 · balda 2 · Cubo B (Electricidad)');
	});
});
