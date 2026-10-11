// Alta rápida del inventario: una foto de una balda (o una lista escrita) → los objetos que hay, listos para revisar y guardar.
import { TIPOS_ARTICULO, type TipoArticulo } from './schema';

export interface ObjetoDetectado {
	nombre: string;
	marca: string | null;
	cantidad: number;
	tipo: TipoArticulo;
	categoria: string | null;
}

export const PROMPT_BALDA = `Eres un jefe de taller mecánico experto en herramientas, recambios y consumibles. Te paso la foto de UNA balda, cajón, panel o rincón del taller. Haz el inventario de lo que se ve y devuelve SOLO un JSON con "objetos": una lista donde cada objeto distinto aparece una vez con:
- nombre: concreto y en español, como lo buscaría el dueño ("Llave combinada 13 mm", "Taladro percutor", "Alicates de punta", "Pistola de silicona", "Aceite 10W40 1 L"). Si se lee el modelo, añádelo ("Taladro percutor DCD996").
- marca: si se ve la marca (DeWalt, Bahco, Facom, Würth, Motul…); si no, vacío.
- cantidad: cuántas unidades iguales hay.
- tipo: "herramienta" (se usa y se guarda), "recambio" (pieza para un vehículo: filtros, pastillas, bujías…) o "consumible" (se gasta: aceite, lija, cinta, guantes, spray, tornillería…).
- categoria: una de Llaves, Vasos y carracas, Destornilladores, Alicates, Eléctrica, Batería y cargadores, Neumática, Medición, Elevación, Corte, Soldadura, Pintura, Limpieza, Aceites y líquidos, Filtros, Frenos, Encendido, Tornillería, Químicos, Seguridad, Almacenaje u Otros.
Reglas: un juego en su caja (vasos, puntas, llaves Allen) es UN objeto ("Juego de vasos 1/2\\"", cantidad 1), no cada pieza. Tornillería o piezas pequeñas sueltas y mezcladas: un solo objeto ("Tornillería variada"). No incluyas el propio mueble, la balda, cajas vacías ni lo que no se distinga bien. No inventes marcas ni modelos que no se lean.`;

export const ESQUEMA_BALDA = {
	type: 'object',
	properties: {
		objetos: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					nombre: { type: 'string' },
					marca: { type: 'string' },
					cantidad: { type: 'number' },
					tipo: { type: 'string', enum: [...TIPOS_ARTICULO] },
					categoria: { type: 'string' }
				},
				required: ['nombre']
			}
		}
	},
	required: ['objetos']
} as const;

const CONSUMIBLE = /\b(cinta|guantes?|lijas?|aceite|spray|grasa|tornill|tuercas?|arandelas?|bridas?|silicona|pintura|imprimaci|barniz|disolvente|trapos?|papel|pegamento|adhesivo|limpiador|l[ií]quido|anticongelante|refrigerante|wd-?40|desengrasante|electrodos?|hilo de soldar|esta[ñn]o|discos? de (corte|desbaste|l[aá]minas)|masilla|fundente|loctite|fijador|teflon|tefl[oó]n|cola|abrillantador|cera|champ[uú]|pilas?|bolsas?|mascarillas?)\b/i;
const RECAMBIO = /\b(filtros?|pastillas?|buj[ií]as?|juntas?|correas?|rodamientos?|ret[eé]n|retenes|zapatas?|discos? de freno|escobillas?|bombillas?|fusibles?|amortiguador|latiguillos?|manguitos?|termostato|bomba de agua|embrague|cadena|pi[ñn][oó]n|corona|neum[aá]tico|c[aá]mara|bater[ií]a de (moto|coche)|kit de distribuci[oó]n)\b/i;

/** Si no se dice, el tipo por el nombre: la cinta y los guantes se gastan, un filtro es un recambio. */
export function adivinarTipo(nombre: string): TipoArticulo {
	if (RECAMBIO.test(nombre)) return 'recambio';
	if (CONSUMIBLE.test(nombre)) return 'consumible';
	return 'herramienta';
}

const texto = (v: unknown, max = 80) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : null);
const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const cantidadValida = (v: unknown) => {
	const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
	return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n * 100) / 100, 9999) : 1;
};

/** Lo que devuelve la IA → objetos limpios (sin duplicados: se suman las cantidades). */
export function normalizarObjetos(raw: unknown): ObjetoDetectado[] {
	const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const lista = Array.isArray(o.objetos) ? o.objetos : Array.isArray(raw) ? raw : [];
	const porNombre = new Map<string, ObjetoDetectado>();
	for (const x of lista as Record<string, unknown>[]) {
		const nombre = texto(x?.nombre);
		if (!nombre) continue;
		const marca = texto(x.marca, 40);
		const clave = `${nombre.toLowerCase()}|${(marca ?? '').toLowerCase()}`;
		const tipo = TIPOS_ARTICULO.includes(x.tipo as TipoArticulo) ? (x.tipo as TipoArticulo) : adivinarTipo(nombre);
		const ya = porNombre.get(clave);
		if (ya) ya.cantidad += cantidadValida(x.cantidad);
		else porNombre.set(clave, { nombre: mayus(nombre), marca: marca && !/^(desconocid|n\/?a|sin marca|ninguna)/i.test(marca) ? marca : null, cantidad: cantidadValida(x.cantidad), tipo, categoria: texto(x.categoria, 40) });
	}
	return [...porNombre.values()].slice(0, 60);
}

/**
 * Lista escrita o dictada, una cosa por línea (o separadas por comas):
 * «3x Llave fija 13», «Llave fija 13 x3», «Llave fija 13 (3)», «2 destornilladores planos».
 */
export function parsearLista(t: string): ObjetoDetectado[] {
	const lineas = t
		.split(/\n|;|,(?!\d)/)
		.map((l) => l.replace(/^\s*[-•*·]\s*/, '').trim())
		.filter(Boolean);
	return normalizarObjetos({
		objetos: lineas.map((l) => {
			let m = l.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|×|uds?\.?|unidades)\s+(.+)$/i);
			if (m) return { nombre: m[2], cantidad: m[1] };
			m = l.match(/^(.+?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)$/i) ?? l.match(/^(.+?)\s*\((\d+(?:[.,]\d+)?)\)$/);
			if (m) return { nombre: m[1], cantidad: m[2] };
			m = l.match(/^(\d{1,3})\s+(\D.+)$/);
			if (m) return { nombre: m[2], cantidad: m[1] };
			return { nombre: l, cantidad: 1 };
		})
	});
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** El artículo que ya está en el inventario con ese nombre (para moverlo en vez de duplicarlo). */
export function articuloExistente<A extends { id: number; nombre: string; marca: string | null }>(o: { nombre: string; marca: string | null }, articulos: A[]): A | null {
	const n = sinTildes(o.nombre);
	return articulos.find((a) => sinTildes(a.nombre) === n && (!o.marca || !a.marca || sinTildes(a.marca) === sinTildes(o.marca))) ?? null;
}
