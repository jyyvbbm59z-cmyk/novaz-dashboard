// Dónde está cada cosa en el local: plano a escala, zonas, muebles con baldas/cajones y códigos de ubicación
// al estilo de un almacén aeronáutico: «D·E2·3» = zona D, estantería E2, balda 3.
import type { TipoMueble } from './schema';

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
	muro: 0.2
} as const;

/** Las zonas con las que arranca el local (se pueden cambiar). Izquierda: la calle de vehículos desde la persiana; derecha: el taller. */
export const ZONAS_INICIALES: (Rect & { codigo: string; nombre: string; color: string; notas: string })[] = [
	{ codigo: 'A', nombre: 'Bahía delantera', color: '#4f86c6', x: 0, y: 0, ancho: 3.62, alto: 7.96, notas: 'Vehículo en trabajo, junto a la entrada' },
	{ codigo: 'B', nombre: 'Bahía del fondo', color: '#5aa17f', x: 0, y: 7.96, ancho: 3.62, alto: 7.0, notas: 'Restauraciones largas' },
	{ codigo: 'C', nombre: 'Banco de trabajo', color: '#d08c3a', x: 3.62, y: 0, ancho: 3.61, alto: 4.39, notas: 'Banco, tornillo y lo que se usa a diario' },
	{ codigo: 'D', nombre: 'Herramientas', color: '#c45d5d', x: 3.62, y: 4.39, ancho: 3.61, alto: 3.97, notas: 'Paneles y cajoneras, a mano de las dos bahías' },
	{ codigo: 'E', nombre: 'Almacén', color: '#8a6fbf', x: 3.62, y: 8.36, ancho: 3.61, alto: 3.54, notas: 'Recambios y piezas desmontadas' },
	{ codigo: 'F', nombre: 'Limpieza y pintura', color: '#3fa6a6', x: 3.62, y: 11.9, ancho: 3.61, alto: 3.06, notas: 'Junto a la puerta del fondo (ventila)' },
	{ codigo: 'G', nombre: 'Cuarto trasero', color: '#9a8f6a', x: 3.83, y: 15.18, ancho: 3.4, alto: 1.25, notas: 'Consumibles y químicos' }
];

// ─── Muebles ─────────────────────────────────────────────────────────────────

export const MUEBLES: Record<TipoMueble, { nombre: string; prefijo: string; nivel: string; ancho: number; fondo: number; niveles: number; ayudaNivel: string }> = {
	estanteria: { nombre: 'Estantería', prefijo: 'E', nivel: 'balda', ancho: 1.0, fondo: 0.45, niveles: 5, ayudaNivel: 'La balda 1 es la de abajo' },
	armario: { nombre: 'Armario', prefijo: 'A', nivel: 'balda', ancho: 1.0, fondo: 0.5, niveles: 4, ayudaNivel: 'La balda 1 es la de abajo' },
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

// ─── Códigos y descripción ───────────────────────────────────────────────────

type ZonaMin = { id: number; codigo: string; nombre: string };
type MuebleMin = { id: number; codigo: string; nombre: string; tipo: TipoMueble; zonaId: number | null };

export function codigoUbicacion(zona: { codigo: string } | null | undefined, mueble: { codigo: string } | null | undefined, nivel?: number | null): string | null {
	if (!zona && !mueble) return null;
	return [zona?.codigo, mueble?.codigo, mueble && nivel ? String(nivel) : null].filter(Boolean).join('·');
}

export interface UbicacionDescrita {
	/** «D·E2·3», o null si no está ubicado en el plano. */
	codigo: string | null;
	/** «Herramientas · Estantería E2 · balda 3». */
	texto: string | null;
	zonaId: number | null;
	muebleId: number | null;
}

export function describirUbicacion(
	a: { zonaId: number | null; muebleId: number | null; nivel: number | null; ubicacion?: string | null },
	zonas: ZonaMin[],
	muebles: MuebleMin[]
): UbicacionDescrita {
	const mueble = a.muebleId ? muebles.find((m) => m.id === a.muebleId) : undefined;
	const zona = zonas.find((z) => z.id === (mueble ? mueble.zonaId : a.zonaId));
	const codigo = codigoUbicacion(zona, mueble, a.nivel);
	const partes = [zona?.nombre, mueble ? `${mueble.nombre} ${mueble.codigo}` : null, mueble && a.nivel ? `${MUEBLES[mueble.tipo].nivel} ${a.nivel}` : null, a.ubicacion].filter(Boolean);
	return { codigo, texto: partes.length ? partes.join(' · ') : null, zonaId: zona?.id ?? null, muebleId: mueble?.id ?? null };
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
