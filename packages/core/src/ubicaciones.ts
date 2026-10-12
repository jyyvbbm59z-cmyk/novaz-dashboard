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
	/** Puerta corredera del fondo, al baño (en X). */
	puertaFondo: { desde: 4.83, hasta: 5.52 },
	/** Baño: 3,40 × 1,25 m. */
	cuarto: { x: 3.83, y: 15.18, ancho: 3.4, alto: 1.25 } as Rect,
	/** Tabiques del cuarto de electrónica (al fondo a la izquierda); su puerta da a limpieza. */
	tabiques: [
		{ x1: 0.15, y1: 11.7, x2: 3.62, y2: 11.7 },
		{ x1: 3.82, y1: 11.9, x2: 3.82, y2: 13.3 },
		{ x1: 3.82, y1: 14.1, x2: 3.82, y2: 14.96 }
	],
	/** En el tabique con limpieza, abajo (en Y); abre hacia dentro a izquierdas: bisagra en el extremo de abajo. */
	puertaElectronica: { x: 3.82, desde: 13.3, hasta: 14.1 },
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
	// Sin salirse del plano: si el destino está pegado a una pared, la cámara se desplaza en vez de enseñar vacío
	const dentro = (v: number, tam: number, min: number, total: number) => (tam >= total ? min + (total - tam) / 2 : Math.min(Math.max(v, min), min + total - tam));
	return { x: dentro(r.x + r.ancho / 2 - w / 2, w, VB.x, VB.w), y: dentro(r.y + r.alto / 2 - h / 2, h, VB.y, VB.h), w, h };
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
	{ codigo: 'BA', nombre: 'Baño', color: '#9a8f6a', x: 3.83, y: 15.18, ancho: 3.4, alto: 1.25, notas: 'Puerta corredera' }
];

// ─── Muebles ─────────────────────────────────────────────────────────────────

export const MUEBLES: Record<TipoMueble, { nombre: string; prefijo: string; nivel: string; ancho: number; fondo: number; niveles: number; ayudaNivel: string }> = {
	estanteria: { nombre: 'Estantería', prefijo: 'E', nivel: 'balda', ancho: 0.9, fondo: 0.4, niveles: 5, ayudaNivel: 'La balda 1 es la de arriba; lo de encima, la 0' },
	armario: { nombre: 'Armario', prefijo: 'A', nivel: 'balda', ancho: 1.0, fondo: 0.5, niveles: 4, ayudaNivel: 'La balda 1 es la de arriba; lo de encima, la 0' },
	cajonera: { nombre: 'Cajonera', prefijo: 'C', nivel: 'cajón', ancho: 0.7, fondo: 0.46, niveles: 7, ayudaNivel: 'El cajón 1 es el de arriba' },
	panel: { nombre: 'Panel de pared', prefijo: 'P', nivel: 'fila', ancho: 2.0, fondo: 0.25, niveles: 4, ayudaNivel: 'La fila 1 es la de arriba' },
	banco: { nombre: 'Banco de trabajo', prefijo: 'B', nivel: 'cajón', ancho: 2.0, fondo: 0.75, niveles: 3, ayudaNivel: 'El cajón 1 es el de la izquierda' },
	carro: { nombre: 'Carro', prefijo: 'K', nivel: 'bandeja', ancho: 0.8, fondo: 0.45, niveles: 3, ayudaNivel: 'La bandeja 1 es la de arriba' },
	equipo: { nombre: 'Equipo', prefijo: 'M', nivel: 'nivel', ancho: 0.8, fondo: 0.8, niveles: 0, ayudaNivel: 'Compresor, elevador, soldador…' },
	otro: { nombre: 'Otro', prefijo: 'O', nivel: 'nivel', ancho: 0.6, fondo: 0.6, niveles: 1, ayudaNivel: '' }
};

// ─── Muebles a medida: filas de distinto alto, partidas en cajones, huecos ───

/** Una fila del mueble, de arriba a abajo: su alto (en «alturas de cajón») y en cuántos cajones se parte; o un hueco abierto. */
export interface FilaMueble {
	alto: number;
	cajones: number;
	hueco?: boolean;
	/** Empieza otra pieza (el carro bajo el cofre): se dibuja separada de la de encima. */
	aparte?: boolean;
}
export interface DisposicionMueble {
	filas: FilaMueble[];
	/** Cómo se llama cada nivel si no es lo del tipo de mueble («cesta» en un Råskog). */
	nivel?: string;
}
export interface NivelMueble {
	/** Su número en el código de ubicación: de arriba a abajo y, en una fila partida, de izquierda a derecha. */
	numero: number;
	fila: number;
	col: number;
	cols: number;
	/** Alto y posición desde arriba, en «alturas de cajón». */
	alto: number;
	desde: number;
	hueco: boolean;
	aparte: boolean;
	nombre: string;
}

type MuebleNiveles = { tipo: TipoMueble; niveles?: number; disposicion?: DisposicionMueble | null };

/** Cómo se llama un nivel de este mueble: balda, cajón, cesta… */
export const nombreDeNivel = (m: MuebleNiveles) => m.disposicion?.nivel?.trim() || MUEBLES[m.tipo].nivel;

/** «cajón» → «cajones», «balda» → «baldas». */
export const pluralNivel = (n: string) => (/[nlr]$/.test(n) ? `${n.replace('ó', 'o')}es` : `${n}s`);

/** Los niveles de un mueble: los de su disposición a medida o, si no tiene, todos iguales de arriba a abajo. */
export function nivelesMueble(m: MuebleNiveles): NivelMueble[] {
	const base = nombreDeNivel(m);
	const femenino = /a$/.test(base);
	const lado = (col: number, cols: number) =>
		cols === 2 ? (femenino ? ['izquierda', 'derecha'] : ['izquierdo', 'derecho'])[col] : cols === 3 ? (femenino ? ['izquierda', 'central', 'derecha'] : ['izquierdo', 'central', 'derecho'])[col] : `${col + 1}.º por la izquierda`;
	const filas: FilaMueble[] = m.disposicion?.filas?.length ? m.disposicion.filas : Array.from({ length: Math.max(m.niveles ?? 0, 0) }, () => ({ alto: 1, cajones: 1 }));
	const out: NivelMueble[] = [];
	let desde = 0;
	filas.forEach((f, fila) => {
		const cols = f.hueco ? 1 : Math.max(1, Math.round(f.cajones));
		for (let col = 0; col < cols; col++) {
			const numero = out.length + 1;
			const nombre = f.hueco ? `hueco ${numero}` : `${base} ${numero}${cols > 1 ? ` (${lado(col, cols)})` : ''}`;
			out.push({ numero, fila, col, cols, alto: f.alto, desde, hueco: !!f.hueco, aparte: !!f.aparte && fila > 0, nombre });
		}
		desde += f.alto;
	});
	return out;
}

/** Estanterías y armarios tienen balda 0: lo de encima, arriba del todo. */
export const tieneEncima = (tipo: TipoMueble) => tipo === 'estanteria' || tipo === 'armario';
/** El primer nivel que admite un mueble (0 si tiene encima). */
export const nivelMinimo = (tipo: TipoMueble) => (tieneEncima(tipo) ? 0 : 1);
/** ¿Existe ese nivel en el mueble? */
export const nivelValido = (m: { tipo: TipoMueble; niveles: number }, n: number | null | undefined): n is number => n != null && Number.isInteger(n) && n >= nivelMinimo(m.tipo) && n <= m.niveles;
/** Los números de nivel de un mueble, de arriba a abajo (con el 0 de encima si lo tiene). */
export const numerosNivel = (m: MuebleNiveles & { niveles: number }) => [...(tieneEncima(m.tipo) ? [0] : []), ...nivelesMueble(m).map((n) => n.numero)];

/** El nombre de un nivel concreto («cajón 2 (central)», «balda 3», «hueco 9», «balda 0 (encima)»). */
export function nombreNivel(m: MuebleNiveles, numero: number): string {
	if (numero === 0 && tieneEncima(m.tipo)) return `${nombreDeNivel(m)} 0 (encima)`;
	return nivelesMueble(m).find((n) => n.numero === numero)?.nombre ?? `${nombreDeNivel(m)} ${numero}`;
}

/** Valida y limpia una disposición que llega de un formulario (null si no vale o está vacía). */
export function limpiarDisposicion(x: unknown): DisposicionMueble | null {
	const d = x as Partial<DisposicionMueble> | null;
	if (!d || !Array.isArray(d.filas)) return null;
	const filas = d.filas
		.slice(0, 30)
		.map((f) => ({
			alto: Math.min(10, Math.max(0.5, Number(f?.alto) || 1)),
			cajones: Math.min(8, Math.max(1, Math.round(Number(f?.cajones) || 1))),
			...(f?.hueco ? { hueco: true } : {}),
			...(f?.aparte ? { aparte: true } : {})
		}));
	if (!filas.length) return null;
	const nivel = typeof d.nivel === 'string' && d.nivel.trim() ? d.nivel.trim().slice(0, 20).toLowerCase() : undefined;
	return { filas, ...(nivel ? { nivel } : {}) };
}

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

// ─── Mover cosas: entender «la E3, balda 2» y «la caja de aceites» ───────────

const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface DestinoTexto {
	muebleId: number;
	nivel: number | null;
	/** Tercio pedido (1 izquierda, 2 centro, 3 derecha), si lo dice. */
	columna: number | null;
}

/**
 * Adónde va algo, dicho a mano: «E3 balda 2», «el armario A1, abajo», «carro C1 cajón 3», «la estantería del fondo, tercio derecho».
 * Primero por código; si no, por el nombre del mueble (solo si hay uno que encaje). null si no se sabe qué mueble es.
 */
export function leerDestino(texto: string, muebles: { id: number; codigo: string; nombre: string; tipo: TipoMueble; niveles: number; disposicion?: DisposicionMueble | null }[]): DestinoTexto | null {
	const t = plano(texto);
	const codigos = [...t.matchAll(/\b([a-z]{1,2}\d{1,2})\b/g)].map((x) => x[1].toUpperCase());
	let m = muebles.find((x) => codigos.includes(x.codigo.toUpperCase()));
	if (!m) {
		const palabras = t.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
		const candidatos = muebles.filter((x) => palabras.some((w) => plano(`${x.nombre} ${MUEBLES[x.tipo].nombre}`).includes(w)));
		if (candidatos.length === 1) m = candidatos[0];
	}
	if (!m) return null;
	const niveles = nivelesMueble(m);
	const num = t.match(/\b(?:balda|cajon|cesta|bandeja|fila|nivel|hueco|estante)\s*(?:n(?:umero|º|o)?\.?\s*)?(\d{1,2})\b/) ?? t.match(/\b[a-z]{1,2}\d{1,2}\s*[·.,-]?\s*(\d{1,2})\b/);
	let nivel: number | null = num ? Number(num[1]) : null;
	if (nivel == null && tieneEncima(m.tipo) && /\bencima\b/.test(t)) nivel = 0;
	if (nivel == null && niveles.length) {
		if (/\b(arriba del todo|la de arriba|el de arriba|arriba)\b/.test(t)) nivel = 1;
		else if (/\b(abajo del todo|la de abajo|el de abajo|abajo|el suelo|al fondo)\b/.test(t)) nivel = niveles.length;
	}
	if (nivel != null && (nivel < nivelMinimo(m.tipo) || nivel > niveles.length)) nivel = null;
	const columna = /\bizquierd/.test(t) ? 1 : /\b(centr|medio)/.test(t) ? 2 : /\bderech/.test(t) ? 3 : null;
	return { muebleId: m.id, nivel, columna };
}

/** Qué se mueve: un contenedor (por su nombre, su tipo o su letra) o, si no, un artículo. */
export function leerQueMover<C extends { id: number; letra: string; nombre: string; tipo: TipoContenedor }, A extends { id: number; nombre: string; marca: string | null; categoria: string | null; referencia: string | null }>(
	texto: string,
	contenedores: C[],
	articulos: A[]
): { contenedor: C } | { articulo: A } | null {
	const t = plano(texto);
	const tipoDicho = (Object.keys(CONTENEDORES) as TipoContenedor[]).find((k) => t.includes(plano(CONTENEDORES[k])));
	const resto = t
		.replace(/\b(el|la|los|las|de|del|con|mi)\b/g, ' ')
		.replace(new RegExp(`\\b(${Object.values(CONTENEDORES).map(plano).join('|')})s?\\b`, 'g'), ' ')
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length > 1)
		.map((w) => w.replace(/(es|s)$/, ''));
	const porNombre = contenedores.filter((c) => resto.length && resto.every((w) => plano(c.nombre).includes(w)));
	const conTipo = tipoDicho ? porNombre.filter((c) => c.tipo === tipoDicho) : porNombre;
	if (conTipo.length === 1) return { contenedor: conTipo[0] };
	if (porNombre.length === 1) return { contenedor: porNombre[0] };
	// «La mochila» a secas, si solo hay una
	if (!resto.length && tipoDicho) {
		const delTipo = contenedores.filter((c) => c.tipo === tipoDicho);
		if (delTipo.length === 1) return { contenedor: delTipo[0] };
	}
	const art = buscarArticulos(texto, articulos, 1)[0];
	return art ? { articulo: art } : null;
}

// ─── El camino desde la persiana ─────────────────────────────────────────────

export interface Pt {
	x: number;
	y: number;
}

/** Fachada inclinada: su Y en cada X. */
export const yFachada = (x: number) => PLANO_LOCAL.fachada.izq.y + ((PLANO_LOCAL.fachada.der.y - PLANO_LOCAL.fachada.izq.y) * x) / PLANO_LOCAL.ancho;

/**
 * Desde dónde se coge algo de un mueble: un lado que mire a su zona (mejor los largos: el frente, no el canto), que quede
 * dentro del local y que no esté tapado por otro mueble pegado. Devuelve el punto de llegada (algo separado) y el del borde.
 */
export function frenteMueble(m: Rect, zona: Rect | null, otros: Rect[] = []): { llegada: Pt; borde: Pt } {
	const P = PLANO_LOCAL;
	const z = zona ?? { x: 0, y: 0, ancho: P.ancho, alto: P.fondo };
	const cx = m.x + m.ancho / 2;
	const cy = m.y + m.alto / 2;
	const dx = z.x + z.ancho / 2 - cx;
	const dy = z.y + z.alto / 2 - cy;
	const d = Math.hypot(dx, dy) || 1;
	const lados = [
		{ n: [-1, 0], largo: m.alto, borde: { x: m.x, y: cy } },
		{ n: [1, 0], largo: m.alto, borde: { x: m.x + m.ancho, y: cy } },
		{ n: [0, -1], largo: m.ancho, borde: { x: cx, y: m.y } },
		{ n: [0, 1], largo: m.ancho, borde: { x: cx, y: m.y + m.alto } }
	].map((l) => ({ ...l, llegada: { x: l.borde.x + l.n[0] * 0.35, y: l.borde.y + l.n[1] * 0.35 }, toque: { x: l.borde.x + l.n[0] * 0.05, y: l.borde.y + l.n[1] * 0.05 } }));
	const dentroDe = (p: Pt, r: Rect) => p.x > r.x && p.x < r.x + r.ancho && p.y > r.y && p.y < r.y + r.alto;
	const libre = (p: Pt) => p.x > 0.1 && p.x < P.ancho - 0.1 && p.y > yFachada(p.x) + 0.1 && p.y < P.fondo - 0.1 && !otros.some((o) => dentroDe(p, o));
	const validos = lados.filter((l) => libre(l.llegada) && libre(l.toque));
	const puntua = (l: (typeof lados)[number]) => ((l.n[0] * dx + l.n[1] * dy) / d) * l.largo;
	const mejor = (validos.length ? validos : lados).sort((a, b) => puntua(b) - puntua(a))[0];
	return { llegada: mejor.llegada, borde: mejor.toque };
}

/**
 * Por dónde se llega desde la persiana, en tramos rectos por los pasillos y sin atravesar tabiques:
 * por la izquierda (bajando desde la entrada), por la derecha (cruzando por delante y bajando hasta la puerta del baño)
 * o hasta electrónica (por limpieza y su puerta).
 */
export function caminoEnLocal(destino: Rect, opts: { mueble: boolean; zona?: Rect | null; otros?: Rect[] }): Pt[] {
	const P = PLANO_LOCAL;
	const ex = (P.entrada.desde + P.entrada.hasta) / 2;
	const inicio = { x: ex, y: yFachada(ex) + 0.25 };
	const cruce = 2.6;
	const derecha = (P.puertaFondo.desde + P.puertaFondo.hasta) / 2;
	const c = { x: destino.x + destino.ancho / 2, y: destino.y + destino.alto / 2 };
	let pts: Pt[];
	if (c.y > P.fondo) pts = [inicio, { x: ex, y: cruce }, { x: derecha, y: cruce }, { x: derecha, y: c.y }];
	else {
		const frente = opts.mueble ? frenteMueble(destino, opts.zona ?? null, opts.otros ?? []) : null;
		const t = frente?.llegada ?? c;
		const pe = P.puertaElectronica;
		const puerta = (pe.desde + pe.hasta) / 2;
		// Electrónica: se entra desde limpieza
		if (t.x < pe.x && t.y > P.tabiques[0].y1) pts = [inicio, { x: ex, y: cruce }, { x: derecha, y: cruce }, { x: derecha, y: puerta }, { x: t.x, y: puerta }, t];
		else if (t.x < P.pilares[0].x || t.y < cruce + 0.6) pts = [inicio, { x: ex, y: t.y }, t];
		else pts = [inicio, { x: ex, y: cruce }, { x: derecha, y: cruce }, { x: derecha, y: t.y }, t];
	}
	// Que la línea acabe tocando el mueble (no a un palmo)
	if (opts.mueble && c.y <= P.fondo) {
		const f = frenteMueble(destino, opts.zona ?? null, opts.otros ?? []);
		pts.push(f.borde);
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
	return [zona?.codigo, mueble?.codigo, mueble && nivel != null ? String(nivel) : null, mueble && contenedor ? contenedor.letra : null].filter((x) => x != null && x !== '').join('·');
}

// ─── Contenedores (cubos, maletines, cajas dentro de una balda) ──────────────

export const CONTENEDORES: Record<TipoContenedor, string> = { cubo: 'Cubo', maletin: 'Maletín', caja: 'Caja', bandeja: 'Bandeja', bolsa: 'Bolsa', mochila: 'Mochila', otro: 'Contenedor' };

// ─── Rejilla de una balda: 3 tercios a lo ancho × 3 alturas de caja baja ──────

export const REJILLA = { columnas: 3, alturas: 3 } as const;
/** Lo que suele ocupar de alto cada tipo (en alturas de caja baja). */
export const ALTO_CONTENEDOR: Record<TipoContenedor, number> = { cubo: 2, maletin: 1, caja: 1, bandeja: 1, bolsa: 2, mochila: 3, otro: 1 };
/** Muebles con baldas en los que los contenedores se colocan en la rejilla. */
export const conRejilla = (tipo: TipoMueble) => tipo === 'estanteria' || tipo === 'armario';

export interface Celda {
	/** Tercio desde la izquierda (1–3). */
	columna: number;
	ancho: number;
	/** Alturas por debajo (0 = sobre la balda). */
	piso: number;
	alto: number;
}
type ContRejilla = { id: number; letra: string; tipo: TipoContenedor; columna?: number | null; ancho?: number | null; piso?: number | null; alto?: number | null };

const recortar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));
/** Una celda dentro de la rejilla (lo que se sale, se mete). */
export function encajar(c: { [K in keyof Celda]?: number | null }): Celda {
	const ancho = recortar(c.ancho ?? 1, 1, REJILLA.columnas);
	const alto = recortar(c.alto ?? 1, 1, REJILLA.alturas);
	return { ancho, alto, columna: recortar(c.columna ?? 1, 1, REJILLA.columnas - ancho + 1), piso: recortar(c.piso ?? 0, 0, REJILLA.alturas - alto) };
}
const casillas = (c: Celda) => {
	const out: string[] = [];
	for (let x = c.columna; x < c.columna + c.ancho; x++) for (let y = c.piso; y < c.piso + c.alto; y++) out.push(`${x}:${y}`);
	return out;
};
/** ¿Se pisan dos celdas? */
export const sePisan = (a: Celda, b: Celda) => casillas(a).some((k) => casillas(b).includes(k));

/** El primer sitio libre (de izquierda a derecha y de abajo arriba) para algo de este tamaño; null si no cabe. */
export function huecoLibre(ocupadas: Celda[], tam: { ancho: number; alto: number }): Celda | null {
	for (let columna = 1; columna <= REJILLA.columnas - tam.ancho + 1; columna++)
		for (let piso = 0; piso <= REJILLA.alturas - tam.alto; piso++) {
			const c = { columna, piso, ancho: tam.ancho, alto: tam.alto };
			if (!ocupadas.some((o) => sePisan(o, c))) return c;
		}
	return null;
}

/**
 * Dónde va cada contenedor de una balda en la rejilla. Los colocados, donde digan; los que no, en el primer hueco
 * (con el alto típico de su tipo). null si ninguno está colocado (y no se fuerza): entonces se reparten a lo ancho, como siempre.
 */
export function rejillaBalda(cs: ContRejilla[], forzar = false): Map<number, Celda> | null {
	if (!forzar && !cs.some((c) => c.columna != null)) return null;
	const out = new Map<number, Celda>();
	for (const c of cs) if (c.columna != null) out.set(c.id, encajar(c));
	for (const c of [...cs].filter((c) => c.columna == null).sort((a, b) => ordenLetra(a.letra, b.letra))) {
		const tam = { ancho: recortar(c.ancho ?? 1, 1, 3), alto: recortar(c.alto ?? ALTO_CONTENEDOR[c.tipo], 1, 3) };
		out.set(c.id, huecoLibre([...out.values()], tam) ?? huecoLibre([...out.values()], { ancho: 1, alto: 1 }) ?? encajar({}));
	}
	return out;
}

/** La siguiente letra libre en una balda (A, B… Z, luego AA, AB…). */
export function siguienteLetra(usadas: string[]): string {
	const nombre = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : nombre(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
	for (let i = 0; ; i++) if (!usadas.includes(nombre(i))) return nombre(i);
}

/** Orden de las letras en la balda (A, B, … Z, AA…): de izquierda a derecha. */
export const ordenLetra = (a: string, b: string) => a.length - b.length || a.localeCompare(b);

type ZonaMin = { id: number; codigo: string; nombre: string };
type MuebleMin = { id: number; codigo: string; nombre: string; tipo: TipoMueble; zonaId: number | null; niveles?: number; disposicion?: DisposicionMueble | null };
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
		mueble && a.nivel != null ? nombreNivel(mueble, a.nivel) : null,
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
