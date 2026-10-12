import { describe, expect, it } from 'vitest';
import { buscarArticulos, caminoEnLocal, codigoUbicacion, describirUbicacion, huella, limpiarDisposicion, nivelesMueble, nombreNivel, PLANO_LOCAL, siguienteCodigoMueble, siguienteLetra, zonaEnPunto, ZONAS_INICIALES, type Pt } from '../src/ubicaciones';

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
		expect(zonaEnPunto(5, 15.8, zonas)?.codigo).toBe('BA');
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
		{ x: 3.6, y: 9.55, ancho: 0.8, fondo: 0.45, girado: true, zona: 'Z2' },
		{ x: 3.59, y: 6.75, ancho: 0.8, fondo: 0.46, girado: true, zona: 'Z1' },
		{ x: 1.2, y: 12.2, ancho: 1, fondo: 0.45, girado: false, zona: 'EL' },
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
	it('a electrónica entra por su puerta; al baño, por la corredera del fondo', () => {
		const r = caminoEnLocal(huella(muebles[0]), { mueble: true, zona: zona('EL') });
		const pe = P.puertaElectronica;
		// Cruza el tabique con limpieza justo por la puerta
		const cruza = r.slice(1).some((p, i) => {
			const a = r[i];
			if ((a.x - pe.x) * (p.x - pe.x) >= 0) return false;
			const y = a.y + ((p.y - a.y) * (pe.x - a.x)) / (p.x - a.x);
			return y > pe.desde && y < pe.hasta;
		});
		expect(cruza).toBe(true);
		const ct = caminoEnLocal(zona('BA'), { mueble: false });
		expect(ct.at(-1)!.x).toBeGreaterThan(P.puertaFondo.desde);
		expect(ct.at(-1)!.x).toBeLessThan(P.puertaFondo.hasta);
	});
});

describe('muebles a medida', () => {
	const c2 = {
		tipo: 'carro' as const,
		niveles: 9,
		disposicion: {
			nivel: 'cajón',
			filas: [{ alto: 1, cajones: 3 }, { alto: 1, cajones: 1 }, { alto: 1, cajones: 1 }, { alto: 2, cajones: 1 }, { alto: 2, cajones: 1, aparte: true }, { alto: 2, cajones: 1 }, { alto: 3, cajones: 1, hueco: true }]
		}
	};
	it('numera de arriba a abajo y, en una fila partida, de izquierda a derecha', () => {
		const n = nivelesMueble(c2);
		expect(n.length).toBe(9);
		expect(n.slice(0, 3).map((x) => x.nombre)).toEqual(['cajón 1 (izquierdo)', 'cajón 2 (central)', 'cajón 3 (derecho)']);
		expect(n[3]).toMatchObject({ numero: 4, desde: 1, alto: 1 });
		expect(n[5]).toMatchObject({ numero: 6, desde: 3, alto: 2 });
		expect(n[6]).toMatchObject({ numero: 7, aparte: true });
		expect(n[8]).toMatchObject({ numero: 9, hueco: true, alto: 3, nombre: 'hueco 9' });
	});
	it('nombres en femenino, por defecto y en la descripción', () => {
		expect(nombreNivel({ tipo: 'carro', disposicion: { nivel: 'cesta', filas: [{ alto: 1, cajones: 2 }] } }, 2)).toBe('cesta 2 (derecha)');
		expect(nombreNivel({ tipo: 'estanteria', niveles: 5 }, 3)).toBe('balda 3');
		const d = describirUbicacion({ zonaId: 3, muebleId: 9, nivel: 2 }, zonas, [{ id: 9, codigo: 'C2', nombre: 'Carro', tipo: 'carro', zonaId: 3, ...c2 }]);
		expect(d.texto).toBe('Z1 · Carro C2 · cajón 2 (central)');
		expect(d.codigo).toBe('Z1·C2·2');
	});
	it('limpia lo que llega del formulario', () => {
		expect(limpiarDisposicion({ filas: [{ alto: 99, cajones: 0 }, { alto: 2, cajones: 3, hueco: 1 }], nivel: ' Cesta ' })).toEqual({ filas: [{ alto: 10, cajones: 1 }, { alto: 2, cajones: 3, hueco: true }], nivel: 'cesta' });
		expect(limpiarDisposicion({ filas: [] })).toBeNull();
		expect(limpiarDisposicion('x')).toBeNull();
	});
});
