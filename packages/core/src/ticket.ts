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
}

export const PROMPT_TICKET = `Eres un lector de tickets y facturas de España. Mira la imagen y devuelve SOLO un JSON con:
- total: importe total pagado en euros (número, con IVA incluido).
- fecha: fecha del ticket en formato AAAA-MM-DD.
- comercio: nombre del comercio o gasolinera, corto (p. ej. "Repsol Moncada", "Leroy Merlin").
- nif: NIF/CIF del comercio si aparece.
- iva_porcentaje: tipo de IVA principal (21, 10, 4 o 0).
- concepto: qué se ha comprado, en pocas palabras y en español (p. ej. "Aceite 5W30 y filtro").
- es_combustible: true si es un repostaje de gasolina o gasóleo.
- litros y precio_litro: solo si es combustible.
Si un dato no aparece, no lo pongas. No inventes nada.`;

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
		precio_litro: { type: 'number' }
	},
	required: ['total']
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
	return {
		importeCent: total != null && total > 0 && total < 100000 ? Math.round(total * 100) : null,
		fecha: fecha(o.fecha, hoy),
		proveedor: texto(o.comercio, 60),
		nif: texto(o.nif, 20)?.toUpperCase().replace(/[\s.-]/g, '') ?? null,
		ivaPct: iva != null && [0, 4, 5, 10, 21].includes(Math.round(iva)) ? Math.round(iva) : null,
		concepto: texto(o.concepto),
		litros: combustible && litros != null && litros > 0 && litros < 200 ? Math.round(litros * 100) / 100 : null,
		precioLitro: combustible && precio != null && precio > 0.5 && precio < 5 ? precio : null,
		combustible
	};
}
