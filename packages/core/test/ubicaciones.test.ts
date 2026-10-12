import { describe, expect, it } from 'vitest';
import { buscarArticulos, caminoEnLocal, codigoUbicacion, describirUbicacion, huella, PLANO_LOCAL, siguienteCodigoMueble, siguienteLetra, zonaEnPunto, ZONAS_INICIALES, type Pt } from '../src/ubicaciones';

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
		expect(zonaEnPunto(1, 2, zonas)?.codigo).toBe('EN');
		expect(zonaEnPunto(6, 6, zonas)?.codigo).toBe('Z2');
		expect(zonaEnPunto(1, 13, zonas)?.codigo).toBe('EL');
		expect(zonaEnPunto(5, 15.8, zonas)?.codigo).toBe('CT');
		expect(zonaEnPunto(20, 20, zonas)).toBeNull();
	});
	it('describe dónde está un artículo', () => {
		const muebles = [{ id: 7, codigo: 'E2', nombre: 'Estantería', tipo: 'estanteria' as const, zonaId: 4 }];
		const d = describirUbicacion({ zonaId: 4, muebleId: 7, nivel: 3, ubicacion: 'caja roja' }, zonas, muebles);
		expect(d.codigo).toBe('Z2·E2·3');
		expect(d.texto).toBe('Z2 · Estantería E2 · balda 3 · caja roja');
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
		expect(d.codigo).toBe('EL·E1·2·B');
		expect(d.texto).toBe('Electrónica · Estantería E1 · balda 2 · Cubo B (Electricidad)');
	});
});

describe('camino desde la persiana', () => {
	const P = PLANO_LOCAL;
	const zona = (c: string) => zonas.find((z) => z.codigo === c)!;
	// ¿Se cortan dos segmentos?
	const corta = (a: Pt, b: Pt, c: Pt, d: Pt) => {
		const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
		return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
	};
	const tabiques = P.tabiques.map((w) => [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }] as const);
	const muebles = [
		{ x: 0.6, y: 14.26, ancho: 2.6, fondo: 0.7, girado: false, zona: 'EL' },
		{ x: 3.92, y: 14.51, ancho: 0.85, fondo: 0.45, girado: false, zona: 'LI' },
		{ x: 6.53, y: 12.45, ancho: 2.3, fondo: 0.7, girado: true, zona: 'LI' },
		{ x: 3.6, y: 9.55, ancho: 0.8, fondo: 0.45, girado: true, zona: 'Z1' },
		{ x: 4.05, y: 0.3, ancho: 1.85, fondo: 0.7, girado: false, zona: 'PM' },
		{ x: 0.45, y: 10.9, ancho: 2, fondo: 0.7, girado: false, zona: 'Z1' }
	];
	it('no atraviesa los tabiques de electrónica y acaba delante del mueble', () => {
		for (const m of muebles) {
			const h = huella(m);
			const r = caminoEnLocal(h, { mueble: true, zona: zona(m.zona) });
			for (let i = 1; i < r.length; i++) for (const [a, b] of tabiques) expect(corta(r[i - 1], r[i], a, b)).toBe(false);
			const fin = r[r.length - 1];
			// Fuera del mueble y a menos de medio metro
			expect(fin.x >= h.x && fin.x <= h.x + h.ancho && fin.y >= h.y && fin.y <= h.y + h.alto).toBe(false);
			expect(Math.min(Math.abs(fin.x - h.x), Math.abs(fin.x - h.x - h.ancho), Math.abs(fin.y - h.y), Math.abs(fin.y - h.y - h.alto))).toBeLessThan(0.5);
		}
	});
	it('a electrónica entra por su puerta; al cuarto trasero, por la puerta del fondo', () => {
		const r = caminoEnLocal(huella(muebles[0]), { mueble: true, zona: zona('EL') });
		const pe = P.puertaElectronica;
		expect(r.some((p) => p.x > pe.desde && p.x < pe.hasta)).toBe(true);
		const ct = caminoEnLocal(zona('CT'), { mueble: false });
		expect(ct.at(-1)!.x).toBeGreaterThan(P.puertaFondo.desde);
		expect(ct.at(-1)!.x).toBeLessThan(P.puertaFondo.hasta);
	});
});
