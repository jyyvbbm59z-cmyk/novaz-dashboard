// Dónde está cada cosa en el local: plano a escala, zonas, muebles con baldas/cajones y códigos de ubicación
// al estilo de un almacén aeronáutico: «Z1·E2·3» = zona Z1, estantería E2, balda 3.
import type { TipoContenedor, TipoMueble } from './schema';

// ─── El plano del local (metros) ─────────────────────────────────────────────
// Origen: esquina interior izquierda, a la altura de la esquina derecha de la fachada. X hacia la derecha, Y hacia el fondo.
// La fachada va inclinada: el lado izquierdo mide 14,36 m y el derecho 14,96 m.

export interface Rect {
	x: number;
	y: number;
	ancho: number;
	alto: number;
}

export const PLANO_LOCAL = {
	ancho: 7.23,
	fondo: 14.96,
	/** Fachada: de la esquina izquierda (más atrás) a la derecha. */
	fachada: { izq: { x: 0, y: 0.6 }, der: { x: 7.23, y: 0 } },
	/** Hueco de la fachada (persiana / cristal), medido en X. */
	entrada: { desde: 0.66, hasta: 3.62 },
	/** Pilares centrales (0,40 × 0,40) y pilastras de las paredes. */
	pilares: [
		{ x: 3.62, y: 0.3, ancho: 0.4, alto: 0.42 },
		{ x: 3.62, y: 4.39, ancho: 0.4, alto: 0.4 },
		{ x: 3.62, y: 7.96, ancho: 0.4, alto: 0.4 },
		{ x: 3.62, y: 11.5, ancho: 0.4, alto: 0.4 }
	] as Rect[],
	pilastras: [
		{ x: 0, y: 0.6, ancho: 0.15, alto: 0.35 },
		{ x: 0, y: 4.39, ancho: 0.15, alto: 0.4 },
		{ x: 0, y: 7.96, ancho: 0.15, alto: 0.4 },
		{ x: 0, y: 11.5, ancho: 0.25, alto: 0.4 },
		{ x: 6.95, y: 0, ancho: 0.28, alto: 0.5 },
		{ x: 6.95, y: 4.39, ancho: 0.28, alto: 0.4 },
		{ x: 6.95, y: 7.96, ancho: 0.28, alto: 0.6 },
		{ x: 6.95, y: 11.5, ancho: 0.28, alto: 0.4 },
		{ x: 0, y: 14.81, ancho: 0.15, alto: 0.15 },
		{ x: 6.95, y: 14.81, ancho: 0.28, alto: 0.15 }
	] as Rect[],
	/** Puerta del fondo al cuarto trasero (en X). */
	puertaFondo: { desde: 4.83, hasta: 5.52 },
	/** Cuarto trasero: 3,40 × 1,25 m. */
	cuarto: { x: 3.83, y: 15.18, ancho: 3.4, alto: 1.25 } as Rect,
	/** Tabiques del cuarto de electrónica (al fondo a la izquierda), con su puerta hacia Z1. */
	tabiques: [
		{ x1: 0.15, y1: 11.7, x2: 2.6, y2: 11.7 },
		{ x1: 3.45, y1: 11.7, x2: 3.62, y2: 11.7 },
		{ x1: 3.82, y1: 11.9, x2: 3.82, y2: 14.96 }
	],
	puertaElectronica: { desde: 2.6, hasta: 3.45, y: 11.7 },
	muro: 0.2
} as const;

/** Lo que se ve del plano entero (con margen para cotas y la entrada). */
export const VISTA_PLANO = { x: -0.45, y: -0.75, w: PLANO_LOCAL.ancho + 0.9, h: PLANO_LOCAL.cuarto.y + PLANO_LOCAL.cuarto.alto + 1.0 };
export type Camara = typeof VISTA_PLANO;

/** Cámara que encuadra algo del plano con la misma proporción que el plano entero (el dibujo no cambia de tamaño). */
export function cajaCamara(r: Rect | null, cerca = 1): Camara {
	const VB = VISTA_PLANO;
	if (!r) return VB;
	const margen = (Math.max(r.ancho, r.alto) * 0.6 + 0.6) / cerca;
	let w = r.ancho + margen * 2;
	let h = r.alto + margen * 2;
	if (w / h > VB.w / VB.h) h = (w * VB.h) / VB.w;
	else w = (h * VB.w) / VB.h;
	const minW = 2.2 / cerca;
	if (w < minW) ((h = (minW * VB.h) / VB.w), (w = minW));
	return { x: r.x + r.ancho / 2 - w / 2, y: r.y + r.alto / 2 - h / 2, w, h };
}

/**
 * Las zonas del local (según el croquis): delante la entrada y pintura y madera; en medio Z1 y Z2;
 * al fondo el cuarto de electrónica (con tabiques) y limpieza. Se pueden cambiar desde la app.
 */
export const ZONAS_INICIALES: (Rect & { codigo: string; nombre: string; color: string; notas: string })[] = [
	{ codigo: 'EN', nombre: 'Entrada', color: '#4f86c6', x: 0, y: 0, ancho: 3.82, alto: 4.59, notas: 'Junto a la persiana' },
	{ codigo: 'PM', nombre: 'Pintura y madera', color: '#d08c3a', x: 3.82, y: 0, ancho: 3.41, alto: 4.59, notas: '' },
	{ codigo: 'Z1', nombre: 'Z1', color: '#5aa17f', x: 0, y: 4.59, ancho: 3.82, alto: 7.11, notas: '' },
	{ codigo: 'Z2', nombre: 'Z2', color: '#c45d5d', x: 3.82, y: 4.59, ancho: 3.41, alto: 7.11, notas: '' },
	{ codigo: 'EL', nombre: 'Electrónica', color: '#8a6fbf', x: 0, y: 11.7, ancho: 3.82, alto: 3.26, notas: 'Cuarto con tabiques' },
	{ codigo: 'LI', nombre: 'Limpieza', color: '#3fa6a6', x: 3.82, y: 11.7, ancho: 3.41, alto: 3.26, notas: '' },
	{ codigo: 'CT', nombre: 'Cuarto trasero', color: '#9a8f6a', x: 3.83, y: 15.18, ancho: 3.4, alto: 1.25, notas: 'Consumibles y químicos' }
];

// ─── Muebles ─────────────────────────────────────────────────────────────────

export const MUEBLES: Record<TipoMueble, { nombre: string; prefijo: string; nivel: string; ancho: number; fondo: number; niveles: number; ayudaNivel: string }> = {
	estanteria: { nombre: 'Estantería', prefijo: 'E', nivel: 'balda', ancho: 1.0, fondo: 0.45, niveles: 5, ayudaNivel: 'La balda 1 es la de arriba' },
	armario: { nombre: 'Armario', prefijo: 'A', nivel: 'balda', ancho: 1.0, fondo: 0.5, niveles: 4, ayudaNivel: 'La balda 1 es la de arriba' },
	cajonera: { nombre: 'Cajonera', prefijo: 'C', nivel: 'cajón', ancho: 0.7, fondo: 0.46, niveles: 7, ayudaNivel: 'El cajón 1 es el de arriba' },
	panel: { nombre: 'Panel de pared', prefijo: 'P', nivel: 'fila', ancho: 2.0, fondo: 0.12, niveles: 4, ayudaNivel: 'La fila 1 es la de arriba' },
	banco: { nombre: 'Banco de trabajo', prefijo: 'B', nivel: 'cajón', ancho: 2.0, fondo: 0.75, niveles: 3, ayudaNivel: 'El cajón 1 es el de la izquierda' },
	carro: { nombre: 'Carro', prefijo: 'K', nivel: 'bandeja', ancho: 0.8, fondo: 0.45, niveles: 3, ayudaNivel: 'La bandeja 1 es la de arriba' },
	equipo: { nombre: 'Equipo', prefijo: 'M', nivel: 'nivel', ancho: 0.8, fondo: 0.8, niveles: 0, ayudaNivel: 'Compresor, elevador, soldador…' },
	otro: { nombre: 'Otro', prefijo: 'O', nivel: 'nivel', ancho: 0.6, fondo: 0.6, niveles: 1, ayudaNivel: '' }
};

/** El siguiente código libre para un tipo de mueble: E1, E2… (único en todo el local). */
export function siguienteCodigoMueble(tipo: TipoMueble, existentes: { codigo: string }[]): string {
	const p = MUEBLES[tipo].prefijo;
	const usados = existentes.map((m) => m.codigo.match(new RegExp(`^${p}(\\d+)$`))?.[1]).filter(Boolean).map(Number);
	return `${p}${usados.length ? Math.max(...usados) + 1 : 1}`;
}

/** Tamaño en el plano (girado 90° cambia ancho por fondo). */
export function huella(m: { x: number; y: number; ancho: number; fondo: number; girado: boolean }): Rect {
	return { x: m.x, y: m.y, ancho: m.girado ? m.fondo : m.ancho, alto: m.girado ? m.ancho : m.fondo };
}

/** La zona en la que cae un punto (la más pequeña si se solapan). */
export function zonaEnPunto<Z extends Rect & { id: number }>(x: number, y: number, zonas: Z[]): Z | null {
	const dentro = zonas.filter((z) => x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto);
	return dentro.sort((a, b) => a.ancho * a.alto - b.ancho * b.alto)[0] ?? null;
}

// ─── El camino desde la persiana ─────────────────────────────────────────────

export interface Pt {
	x: number;
	y: number;
}

/** Fachada inclinada: su Y en cada X. */
export const yFachada = (x: number) => PLANO_LOCAL.fachada.izq.y + ((PLANO_LOCAL.fachada.der.y - PLANO_LOCAL.fachada.izq.y) * x) / PLANO_LOCAL.ancho;

/** Desde dónde se coge algo de un mueble: el lado que da a su zona (no el de la pared). */
export function frenteMueble(m: Rect, zona: Rect | null): Pt {
	const P = PLANO_LOCAL;
	const z = zona ?? { x: 0, y: 0, ancho: P.ancho, alto: P.fondo };
	const cz = { x: z.x + z.ancho / 2, y: z.y + z.alto / 2 };
	const cx = m.x + m.ancho / 2;
	const cy = m.y + m.alto / 2;
	const lados = [
		{ x: m.x - 0.35, y: cy },
		{ x: m.x + m.ancho + 0.35, y: cy },
		{ x: cx, y: m.y - 0.35 },
		{ x: cx, y: m.y + m.alto + 0.35 }
	].filter((p) => p.x > 0.1 && p.x < P.ancho - 0.1 && p.y > yFachada(p.x) + 0.1 && p.y < P.fondo - 0.1);
	return lados.sort((a, b) => Math.hypot(a.x - cz.x, a.y - cz.y) - Math.hypot(b.x - cz.x, b.y - cz.y))[0] ?? { x: cx, y: cy };
}

/**
 * Por dónde se llega desde la persiana, en tramos rectos por los pasillos y sin atravesar tabiques:
 * por la izquierda (bajando desde la entrada), por la derecha (cruzando por delante y bajando hasta la puerta del fondo)
 * o hasta electrónica (por su puerta).
 */
export function caminoEnLocal(destino: Rect, opts: { mueble: boolean; zona?: Rect | null }): Pt[] {
	const P = PLANO_LOCAL;
	const ex = (P.entrada.desde + P.entrada.hasta) / 2;
	const inicio = { x: ex, y: yFachada(ex) + 0.25 };
	const cruce = 2.6;
	const derecha = (P.puertaFondo.desde + P.puertaFondo.hasta) / 2;
	const c = { x: destino.x + destino.ancho / 2, y: destino.y + destino.alto / 2 };
	let pts: Pt[];
	if (c.y > P.fondo) pts = [inicio, { x: ex, y: cruce }, { x: derecha, y: cruce }, { x: derecha, y: c.y }];
	else {
		const t = opts.mueble ? frenteMueble(destino, opts.zona ?? null) : c;
		const pe = P.puertaElectronica;
		const puerta = (pe.desde + pe.hasta) / 2;
		if (t.x < P.pilares[0].x && t.y > pe.y) pts = [inicio, { x: ex, y: pe.y - 1.25 }, { x: puerta, y: pe.y - 1.25 }, { x: puerta, y: t.y }, t];
		else if (t.x < P.pilares[0].x || t.y < cruce + 0.6) pts = [inicio, { x: ex, y: t.y }, t];
		else pts = [inicio, { x: ex, y: cruce }, { x: derecha, y: cruce }, { x: derecha, y: t.y }, t];
	}
	// Fuera los tramos de longitud cero
	return pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.01);
}

// ─── Códigos y descripción ───────────────────────────────────────────────────

export function codigoUbicacion(
	zona: { codigo: string } | null | undefined,
	mueble: { codigo: string } | null | undefined,
	nivel?: number | null,
	contenedor?: { letra: string } | null
): string | null {
	if (!zona && !mueble) return null;
	return [zona?.codigo, mueble?.codigo, mueble && nivel ? String(nivel) : null, mueble && contenedor ? contenedor.letra : null].filter(Boolean).join('·');
}

// ─── Contenedores (cubos, maletines, cajas dentro de una balda) ──────────────

export const CONTENEDORES: Record<TipoContenedor, string> = { cubo: 'Cubo', maletin: 'Maletín', caja: 'Caja', bandeja: 'Bandeja', bolsa: 'Bolsa', otro: 'Contenedor' };

/** La siguiente letra libre en una balda (A, B… Z, luego AA, AB…). */
export function siguienteLetra(usadas: string[]): string {
	const nombre = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : nombre(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
	for (let i = 0; ; i++) if (!usadas.includes(nombre(i))) return nombre(i);
}

/** Orden de las letras en la balda (A, B, … Z, AA…): de izquierda a derecha. */
export const ordenLetra = (a: string, b: string) => a.length - b.length || a.localeCompare(b);

type ZonaMin = { id: number; codigo: string; nombre: string };
type MuebleMin = { id: number; codigo: string; nombre: string; tipo: TipoMueble; zonaId: number | null };
type ContenedorMin = { id: number; letra: string; nombre: string; tipo: TipoContenedor };

export interface UbicacionDescrita {
	/** «Z1·E2·3», «Z1·E2·3·B», o null si no está ubicado en el plano. */
	codigo: string | null;
	/** «Herramientas · Estantería E2 · balda 3 · Cubo B (electricidad)». */
	texto: string | null;
	zonaId: number | null;
	muebleId: number | null;
	contenedorId: number | null;
}

export function describirUbicacion(
	a: { zonaId: number | null; muebleId: number | null; nivel: number | null; contenedorId?: number | null; ubicacion?: string | null },
	zonas: ZonaMin[],
	muebles: MuebleMin[],
	contenedores: ContenedorMin[] = []
): UbicacionDescrita {
	const mueble = a.muebleId ? muebles.find((m) => m.id === a.muebleId) : undefined;
	const zona = zonas.find((z) => z.id === (mueble ? mueble.zonaId : a.zonaId));
	const cont = mueble && a.contenedorId ? contenedores.find((c) => c.id === a.contenedorId) : undefined;
	const codigo = codigoUbicacion(zona, mueble, a.nivel, cont);
	const partes = [
		zona?.nombre,
		mueble ? `${mueble.nombre} ${mueble.codigo}` : null,
		mueble && a.nivel ? `${MUEBLES[mueble.tipo].nivel} ${a.nivel}` : null,
		cont ? `${CONTENEDORES[cont.tipo]} ${cont.letra}${cont.nombre && cont.nombre !== CONTENEDORES[cont.tipo] ? ` (${cont.nombre})` : ''}` : null,
		a.ubicacion
	].filter(Boolean);
	return { codigo, texto: partes.length ? partes.join(' · ') : null, zonaId: zona?.id ?? null, muebleId: mueble?.id ?? null, contenedorId: cont?.id ?? null };
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'mi', 'para']);

/** Artículos que encajan con lo que se busca («la dinamométrica», «llave de 13»), los mejores primero. */
export function buscarArticulos<A extends { nombre: string; marca: string | null; categoria: string | null; referencia: string | null }>(texto: string, articulos: A[], max = 6): A[] {
	const palabras = sinTildes(texto)
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length > 1 && !VACIAS.has(w))
		.map((w) => w.replace(/(es|s)$/, ''));
	if (!palabras.length) return [];
	const puntuados = articulos.map((a) => {
		const nombre = sinTildes(a.nombre);
		const resto = sinTildes(`${a.marca ?? ''} ${a.categoria ?? ''} ${a.referencia ?? ''}`);
		let p = 0;
		for (const w of palabras) p += nombre.includes(w) ? 2 : resto.includes(w) ? 1 : 0;
		return { a, p, todas: palabras.every((w) => nombre.includes(w) || resto.includes(w)) };
	});
	// Si alguno tiene todas las palabras, solo esos («llave de 13» no trae las demás llaves)
	const completos = puntuados.some((x) => x.todas);
	return puntuados
		.filter((x) => x.p > 0 && (!completos || x.todas))
		.sort((x, y) => Number(y.todas) - Number(x.todas) || y.p - x.p)
		.slice(0, max)
		.map((x) => x.a);
}
