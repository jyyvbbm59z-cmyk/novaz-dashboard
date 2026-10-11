// Lectura de tickets por foto: instrucciones para el modelo de visión y limpieza de lo que devuelve.

export interface TicketLeido {
	importeCent: number | null;
	fecha: string | null;
	proveedor: string | null;
	nif: string | null;
	ivaPct: number | null;
	concepto: string | null;
	litros: number | null;
	precioLitro: number | null;
	combustible: boolean;
	/** Cada línea del ticket con su coste (lo que se compró). */
	lineas: { descripcion: string; cantidad: number | null; importeCent: number | null }[];
}

export const PROMPT_TICKET = `Eres un lector experto de tickets y facturas de España. Mira la imagen con atención y devuelve SOLO un JSON con:
- comercio: el nombre comercial de la tienda tal y como lo conoce la gente ("Leroy Merlin", "Repsol", "Norauto", "Mercadona"), no la razón social ("Leroy Merlin España S.L.U."). Si es una gasolinera o tiene varias tiendas, añade la localidad ("Repsol Moncada").
- fecha: la fecha de la compra en formato AAAA-MM-DD. En los tickets suele venir como 11/10/26 o 11-10-2026: conviértela. Es la fecha de compra, no la de caducidad ni la de garantía.
- total: el importe total pagado en euros (número, IVA incluido).
- lineas: TODAS las líneas de artículos del ticket, en orden. Para cada una: descripcion (legible y en español, sin códigos internos ni referencias largas), cantidad (si aparece) e importe (el total de esa línea en euros). No incluyas líneas de subtotal, IVA, total, cambio ni forma de pago.
- concepto: un resumen corto de lo comprado (p. ej. "Burletes y espuma para la puerta").
- nif: NIF/CIF del comercio si aparece.
- iva_porcentaje: el tipo de IVA principal (21, 10, 4 o 0).
- es_combustible: true si es un repostaje de gasolina o gasóleo; entonces litros y precio_litro.
No inventes nada: si un dato no se ve, déjalo fuera.`;

export const ESQUEMA_TICKET = {
	type: 'object',
	properties: {
		total: { type: 'number' },
		fecha: { type: 'string' },
		comercio: { type: 'string' },
		nif: { type: 'string' },
		iva_porcentaje: { type: 'number' },
		concepto: { type: 'string' },
		es_combustible: { type: 'boolean' },
		litros: { type: 'number' },
		precio_litro: { type: 'number' },
		lineas: {
			type: 'array',
			items: {
				type: 'object',
				properties: { descripcion: { type: 'string' }, cantidad: { type: 'number' }, importe: { type: 'number' } },
				required: ['descripcion']
			}
		}
	},
	required: ['total', 'fecha', 'comercio', 'lineas']
} as const;

/** Saca el primer objeto JSON de un texto (los modelos a veces lo envuelven en ``` o en frases). */
export function extraerJson(texto: unknown): Record<string, unknown> | null {
	if (texto && typeof texto === 'object') return texto as Record<string, unknown>;
	const t = String(texto ?? '');
	const i = t.indexOf('{');
	const j = t.lastIndexOf('}');
	if (i < 0 || j <= i) return null;
	try {
		return JSON.parse(t.slice(i, j + 1));
	} catch {
		return null;
	}
}

/** «1.234,56», «12,5 €», 12.5 → número. */
function numero(v: unknown): number | null {
	if (typeof v === 'number') return Number.isFinite(v) ? v : null;
	if (typeof v !== 'string') return null;
	let t = v.replace(/[€\s]|eur(os)?/gi, '');
	if (/,\d{1,3}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
	const n = Number(t);
	return Number.isFinite(n) ? n : null;
}

/** «2026-10-11», «11/10/2026», «11-10-26» → «2026-10-11» (si es una fecha válida y no futura lejana). */
function fecha(v: unknown, hoy: string): string | null {
	const t = String(v ?? '').trim();
	let a: number, m: number, d: number;
	let x = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (x) [a, m, d] = [Number(x[1]), Number(x[2]), Number(x[3])];
	else if ((x = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/))) [d, m, a] = [Number(x[1]), Number(x[2]), Number(x[3])];
	else return null;
	if (a < 100) a += 2000;
	if (m < 1 || m > 12 || d < 1 || d > 31) return null;
	const iso = `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
	return iso > hoy || iso < `${Number(hoy.slice(0, 4)) - 5}-01-01` ? null : iso;
}

const texto = (v: unknown, max = 80) => {
	const t = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
	return t ? t.slice(0, max) : null;
};

/** Convierte lo que devuelve el modelo en datos fiables para el formulario (lo dudoso se descarta). */
export function normalizarTicket(raw: unknown, hoy: string): TicketLeido {
	const o = extraerJson(raw) ?? {};
	const total = numero(o.total);
	const iva = numero(o.iva_porcentaje);
	const litros = numero(o.litros);
	const precio = numero(o.precio_litro);
	const combustible = o.es_combustible === true || (litros != null && litros > 0);
	const lineas = (Array.isArray(o.lineas) ? o.lineas : [])
		.map((l) => (l && typeof l === 'object' ? (l as Record<string, unknown>) : {}))
		.map((l) => {
			const importe = numero(l.importe);
			const cantidad = numero(l.cantidad);
			return {
				descripcion: texto(l.descripcion, 80) ?? '',
				cantidad: cantidad != null && cantidad > 0 && cantidad < 10000 ? cantidad : null,
				importeCent: importe != null && Math.abs(importe) < 100000 ? Math.round(importe * 100) : null
			};
		})
		.filter((l) => l.descripcion)
		.slice(0, 40);
	return {
		importeCent: total != null && total > 0 && total < 100000 ? Math.round(total * 100) : null,
		fecha: fecha(o.fecha, hoy),
		proveedor: texto(o.comercio, 60),
		nif: texto(o.nif, 20)?.toUpperCase().replace(/[\s.-]/g, '') ?? null,
		ivaPct: iva != null && [0, 4, 5, 10, 21].includes(Math.round(iva)) ? Math.round(iva) : null,
		concepto: texto(o.concepto),
		litros: combustible && litros != null && litros > 0 && litros < 200 ? Math.round(litros * 100) / 100 : null,
		precioLitro: combustible && precio != null && precio > 0.5 && precio < 5 ? precio : null,
		combustible,
		lineas
	};
}

const eur = (cent: number) => `${(cent / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Notas del gasto con lo que dice el ticket: tienda, fecha y cada línea con su coste. */
export function notasTicket(t: TicketLeido): string {
	const cab = ['Ticket', t.proveedor ? `de ${t.proveedor}` : null, t.fecha ? `del ${t.fecha.split('-').reverse().join('/')}` : null].filter(Boolean).join(' ');
	const lineas = t.lineas.map((l) => {
		const unidad = l.cantidad && l.cantidad !== 1 && l.importeCent != null ? ` (${l.cantidad.toLocaleString('es-ES')} × ${eur(Math.round(l.importeCent / l.cantidad))})` : '';
		return `- ${l.descripcion}${unidad}${l.importeCent != null ? `: ${eur(l.importeCent)}` : ''}`;
	});
	if (t.combustible && t.litros && !lineas.length) lineas.push(`- ${t.litros.toLocaleString('es-ES')} L${t.precioLitro ? ` a ${t.precioLitro.toLocaleString('es-ES', { minimumFractionDigits: 3 })} €/L` : ''}`);
	return [`${cab}:`, ...lineas, ...(t.importeCent != null ? [`Total: ${eur(t.importeCent)}`] : [])].join('\n');
}
