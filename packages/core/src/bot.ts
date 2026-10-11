// Bot de Telegram en las dos direcciones: entender lo que escribes («Repostaje Ibiza 40 L 72 € 117.200 km») y
// convertirlo en una acción de la app. La IA interpreta; si no está o falla, un intérprete por reglas cubre lo básico.

export interface VehiculoBot {
	id: number;
	alias: string;
	marca: string | null;
	modelo: string | null;
	matricula: string | null;
}

export type TemaConsulta = 'general' | 'vehiculo' | 'gasto' | 'compras' | 'agenda' | 'donde';

export type Intencion =
	| { tipo: 'repostaje'; vehiculoId: number | null; litros: number | null; importeCent: number | null; km: number | null; gasolinera: string | null; lleno: boolean }
	| { tipo: 'km'; vehiculoId: number | null; km: number }
	| { tipo: 'gasto'; vehiculoId: number | null; importeCent: number; concepto: string; proveedor: string | null; categoria: string | null; local: boolean }
	| { tipo: 'mantenimiento' | 'reparacion'; vehiculoId: number | null; titulo: string; km: number | null; revisiones: string[]; importeCent: number | null }
	| { tipo: 'averia' | 'mejora'; vehiculoId: number | null; titulo: string; urgente: boolean }
	| { tipo: 'tarea_local'; titulo: string; zona: string | null; reforma: boolean }
	| { tipo: 'compra'; items: string[]; vehiculoId: number | null }
	| { tipo: 'consulta'; vehiculoId: number | null; tema: TemaConsulta; buscar?: string | null }
	| { tipo: 'ayuda' }
	| { tipo: 'desconocido'; texto: string };

/** Qué tipos de intención necesitan un vehículo para poder apuntarse. */
export const NECESITA_VEHICULO = new Set(['repostaje', 'km', 'mantenimiento', 'reparacion', 'averia', 'mejora']);

// ─── Números y vehículos ─────────────────────────────────────────────────────

/** «117.200» → 117200 · «72,50» → 72.5 · «1.234,5» → 1234.5 */
export function numeroES(t: unknown): number | null {
	if (typeof t === 'number') return Number.isFinite(t) ? t : null;
	let s = String(t ?? '').trim().replace(/[€\s]|eur(os)?|km|litros?|\bl\b/gi, '');
	if (!s) return null;
	if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
	else s = s.replace(',', '.');
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** El vehículo que se menciona en un texto (por alias, matrícula, modelo o marca). */
export function buscarVehiculo(texto: string | null | undefined, vehiculos: VehiculoBot[]): number | null {
	if (!texto) return null;
	const t = ` ${sinTildes(texto).replace(/[^a-z0-9]+/g, ' ')} `;
	const pal = (x: string | null) => (x ? ` ${sinTildes(x).replace(/[^a-z0-9]+/g, ' ').trim()} ` : null);
	const candidatos = (f: (v: VehiculoBot) => string | null) => vehiculos.filter((v) => {
		const p = pal(f(v));
		return p && p.trim() && t.includes(p);
	});
	for (const f of [(v: VehiculoBot) => v.alias, (v: VehiculoBot) => (v.matricula ? v.matricula.replace(/[\s-]/g, '') : null), (v: VehiculoBot) => v.modelo?.split(' ')[0] ?? null, (v: VehiculoBot) => v.marca]) {
		const c = candidatos(f);
		if (c.length === 1) return c[0].id;
	}
	// Matrícula escrita con espacios o guiones
	const compacto = sinTildes(texto).replace(/[^a-z0-9]/g, '');
	const porMatricula = vehiculos.filter((v) => v.matricula && compacto.includes(v.matricula.replace(/[\s-]/g, '').toLowerCase()));
	return porMatricula.length === 1 ? porMatricula[0].id : null;
}

// ─── Intérprete por reglas (comandos y frases sencillas) ─────────────────────

const AYUDA = /^\/?(start|ayuda|help)\b/i;

export function interpretarReglas(texto: string, vehiculos: VehiculoBot[]): Intencion {
	const t = texto.trim();
	const veh = buscarVehiculo(t, vehiculos);
	const resto = (cmd: RegExp) => t.replace(cmd, '').trim();
	if (AYUDA.test(t)) return { tipo: 'ayuda' };
	const donde = t.match(/^(?:\/donde\b|¿?\s*d[oó]nde\s+(?:est[aá]n?|tengo|guardo|guard[eé]|dej[eé]|va|van|hay)(?=[\s?]|$))\s*(.*?)\??$/i);
	if (donde) return { tipo: 'consulta', vehiculoId: null, tema: 'donde', buscar: donde[1].replace(/^(el|la|los|las|un|una|mi|mis)\s+/i, '').trim() || null };
	if (/^\/(hoy|informe)\b/i.test(t)) return { tipo: 'consulta', vehiculoId: null, tema: 'general' };
	if (/^\/agenda\b/i.test(t)) return { tipo: 'consulta', vehiculoId: null, tema: 'agenda' };
	if (/^\/compras\b/i.test(t)) return { tipo: 'consulta', vehiculoId: null, tema: 'compras' };
	if (/^\/compra\b/i.test(t)) return { tipo: 'compra', items: resto(/^\/compra\b/i).split(/\s*[,;\n]\s*/).filter(Boolean).map(mayus), vehiculoId: veh };
	if (/^\/tarea\b/i.test(t)) return { tipo: 'tarea_local', titulo: mayus(resto(/^\/tarea\b/i)), zona: null, reforma: false };
	if (/^\/(averia|avería)\b/i.test(t)) return { tipo: 'averia', vehiculoId: veh, titulo: limpiarVehiculo(resto(/^\/(averia|avería)\b/i), veh, vehiculos), urgente: /urgente/i.test(t) };
	if (/^\/mejora\b/i.test(t)) return { tipo: 'mejora', vehiculoId: veh, titulo: limpiarVehiculo(resto(/^\/mejora\b/i), veh, vehiculos), urgente: false };

	const km = t.match(/(\d{1,3}(?:\.\d{3})+|\d{3,7})\s*km\b/i);
	const litros = t.match(/(\d+(?:[.,]\d+)?)\s*(?:l|litros?)\b/i);
	const euros = t.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur(?:os)?)/i);
	if (/^\/km\b/i.test(t) || (/\b(tiene|lleva|marca|km)\b/i.test(t) && km && !litros && !euros)) {
		const n = numeroES(km?.[1] ?? resto(/^\/km\b/i).match(/\d[\d.]*/)?.[0]);
		if (n) return { tipo: 'km', vehiculoId: veh, km: Math.round(n) };
	}
	if (/^\/repostaje\b/i.test(t) || /\b(reposta|repostaje|gasolina|gasoil|di[eé]sel|lleno)\b/i.test(t) || (litros && euros)) {
		const nums = resto(/^\/repostaje\b/i).match(/\d[\d.,]*/g) ?? [];
		return {
			tipo: 'repostaje',
			vehiculoId: veh,
			litros: numeroES(litros?.[1] ?? nums[0]),
			importeCent: (() => {
				const e = numeroES(euros?.[1] ?? nums[1]);
				return e ? Math.round(e * 100) : null;
			})(),
			km: (() => {
				const k = numeroES(km?.[1] ?? nums[2]);
				return k && k > 100 ? Math.round(k) : null;
			})(),
			gasolinera: null,
			lleno: !/\b(parcial|medio)\b/i.test(t)
		};
	}
	if (/^\/gasto\b/i.test(t) && euros) {
		const e = numeroES(euros[1])!;
		return { tipo: 'gasto', vehiculoId: veh, importeCent: Math.round(e * 100), concepto: mayus(resto(/^\/gasto\b/i).replace(euros[0], '').trim()) || 'Gasto', proveedor: null, categoria: null, local: /\blocal\b/i.test(t) };
	}
	return { tipo: 'desconocido', texto: t };
}

/** Quita el nombre del vehículo del título: «/averia bandit retén» → «Retén». */
function limpiarVehiculo(texto: string, vehiculoId: number | null, vehiculos: VehiculoBot[]) {
	const v = vehiculos.find((x) => x.id === vehiculoId);
	const t = v ? texto.replace(new RegExp(`\\b${v.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '').trim() : texto;
	return t.charAt(0).toUpperCase() + t.slice(1);
}

// ─── Intérprete con IA ───────────────────────────────────────────────────────

export function promptInterprete(vehiculos: VehiculoBot[], hoy: string) {
	const lista = vehiculos.map((v) => `- ${v.alias}${v.marca || v.modelo ? ` (${[v.marca, v.modelo].filter(Boolean).join(' ')})` : ''}${v.matricula ? `, matrícula ${v.matricula}` : ''}`).join('\n');
	return `Eres el asistente del taller Novaz. El dueño te escribe desde el taller (a veces con prisa o por voz). Convierte su mensaje en UNA acción para la app y devuelve SOLO un JSON.
Hoy es ${hoy}. Sus vehículos:
${lista}

Acciones posibles (campo "accion"):
- repostaje: echó combustible. Campos: vehiculo, litros, importe (euros), km (cuentakilómetros), gasolinera, lleno (false solo si dice que no llenó).
- km: solo informa de los km. Campos: vehiculo, km.
- gasto: pagó algo que no es un repostaje. Campos: importe, concepto, proveedor, categoria (recambios, consumibles, herramienta, seguros, impuestos, itv, mantenimiento del local, reformas del local…), vehiculo (si es de un vehículo), local (true si es del local o taller).
- mantenimiento: ha HECHO un mantenimiento (aceite, filtros, frenos, revisión…). Campos: vehiculo, titulo, km, revisiones (palabras clave o códigos como "C2", "aceite", "filtro de aire"), importe si lo dice.
- reparacion: ha REPARADO algo. Campos: vehiculo, titulo, km, importe.
- averia: ha detectado algo roto que hay que arreglar. Campos: vehiculo, titulo, urgente.
- mejora: quiere hacerle una mejora (algo nuevo, no una avería). Campos: vehiculo, titulo.
- tarea_local: algo que hacer en el local/taller (pintar, arreglar, ordenar…). Campos: titulo, zona, reforma (true si es una obra que mejora el local).
- compra: hay que comprar cosas. Campos: items (lista; si dice precio ponlo al final: "Lija de 400 · 6 €"), vehiculo si es para uno.
- consulta: pregunta algo. Campos: tema (general = cómo va todo / qué hay pendiente; vehiculo = qué le toca a un vehículo; gasto = cuánto ha gastado; compras = qué hay que comprar; agenda = qué viene; donde = dónde está guardada una herramienta o cosa del taller), vehiculo si pregunta por uno, buscar (solo con tema donde: la cosa que busca, p. ej. "llave dinamométrica").
- ayuda: pregunta qué puedes hacer.
- desconocido: no encaja en nada.

Reglas: "vehiculo" es el alias de la lista (si no menciona ninguno, déjalo vacío). Números en formato español: "117.200" son ciento diecisiete mil doscientos; "72,50" es setenta y dos con cincuenta. Los títulos, cortos y en español, con mayúscula inicial. No inventes datos que no diga.`;
}

export const ESQUEMA_INTENCION = {
	type: 'object',
	properties: {
		accion: { type: 'string', enum: ['repostaje', 'km', 'gasto', 'mantenimiento', 'reparacion', 'averia', 'mejora', 'tarea_local', 'compra', 'consulta', 'ayuda', 'desconocido'] },
		vehiculo: { type: 'string' },
		litros: { type: 'number' },
		importe: { type: 'number' },
		km: { type: 'number' },
		gasolinera: { type: 'string' },
		lleno: { type: 'boolean' },
		concepto: { type: 'string' },
		proveedor: { type: 'string' },
		categoria: { type: 'string' },
		local: { type: 'boolean' },
		titulo: { type: 'string' },
		revisiones: { type: 'array', items: { type: 'string' } },
		urgente: { type: 'boolean' },
		zona: { type: 'string' },
		reforma: { type: 'boolean' },
		items: { type: 'array', items: { type: 'string' } },
		tema: { type: 'string', enum: ['general', 'vehiculo', 'gasto', 'compras', 'agenda', 'donde'] },
		buscar: { type: 'string' }
	},
	required: ['accion']
} as const;

const str = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : null);
const cent = (v: unknown) => {
	const n = numeroES(v);
	return n != null && n > 0 && n < 100000 ? Math.round(n * 100) : null;
};
const kms = (v: unknown) => {
	const n = numeroES(v);
	return n != null && n >= 0 && n < 2_000_000 ? Math.round(n) : null;
};
const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Lo que devuelve la IA → una intención fiable (lo dudoso se descarta). */
export function normalizarIntencion(raw: unknown, vehiculos: VehiculoBot[], texto: string): Intencion {
	const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const vehiculoId = buscarVehiculo(str(o.vehiculo), vehiculos) ?? buscarVehiculo(texto, vehiculos);
	switch (o.accion) {
		case 'repostaje':
			return { tipo: 'repostaje', vehiculoId, litros: (() => { const l = numeroES(o.litros); return l && l > 0 && l < 300 ? l : null; })(), importeCent: cent(o.importe), km: kms(o.km), gasolinera: str(o.gasolinera, 60), lleno: o.lleno !== false };
		case 'km': {
			const km = kms(o.km);
			return km != null ? { tipo: 'km', vehiculoId, km } : { tipo: 'desconocido', texto };
		}
		case 'gasto': {
			const importeCent = cent(o.importe);
			if (!importeCent) return { tipo: 'desconocido', texto };
			return { tipo: 'gasto', vehiculoId: o.local === true ? null : vehiculoId, importeCent, concepto: mayus(str(o.concepto) ?? 'Gasto'), proveedor: str(o.proveedor, 60), categoria: str(o.categoria, 40), local: o.local === true };
		}
		case 'mantenimiento':
		case 'reparacion':
			return {
				tipo: o.accion,
				vehiculoId,
				titulo: mayus(str(o.titulo) ?? (o.accion === 'mantenimiento' ? 'Mantenimiento' : 'Reparación')),
				km: kms(o.km),
				revisiones: Array.isArray(o.revisiones) ? o.revisiones.flatMap((r) => (str(r, 40) ? [str(r, 40)!] : [])).slice(0, 10) : [],
				importeCent: cent(o.importe)
			};
		case 'averia':
		case 'mejora': {
			const titulo = str(o.titulo);
			return titulo ? { tipo: o.accion, vehiculoId, titulo: mayus(titulo), urgente: o.urgente === true } : { tipo: 'desconocido', texto };
		}
		case 'tarea_local': {
			const titulo = str(o.titulo);
			return titulo ? { tipo: 'tarea_local', titulo: mayus(titulo), zona: str(o.zona, 60), reforma: o.reforma === true } : { tipo: 'desconocido', texto };
		}
		case 'compra': {
			const items = Array.isArray(o.items) ? o.items.flatMap((i) => (str(i) ? [mayus(str(i)!)] : [])).slice(0, 20) : [];
			return items.length ? { tipo: 'compra', items, vehiculoId } : { tipo: 'desconocido', texto };
		}
		case 'consulta': {
			const temas: TemaConsulta[] = ['general', 'vehiculo', 'gasto', 'compras', 'agenda', 'donde'];
			const tema = temas.includes(o.tema as TemaConsulta) ? (o.tema as TemaConsulta) : vehiculoId ? 'vehiculo' : 'general';
			if (tema === 'donde') return { tipo: 'consulta', vehiculoId: null, tema, buscar: str(o.buscar, 80) };
			return { tipo: 'consulta', vehiculoId, tema };
		}
		case 'ayuda':
			return { tipo: 'ayuda' };
		default:
			return { tipo: 'desconocido', texto };
	}
}

export const TEXTO_AYUDA = `<b>Escríbeme como hablarías:</b>
• <i>Repostaje Ibiza 40 litros 72 € 117.200 km</i>
• <i>El Ibiza tiene 117.300 km</i>
• <i>Cambiado el aceite y el filtro del Ibiza</i>
• <i>La Bandit pierde aceite por el retén</i>
• <i>Hay que pintar la pared del fondo</i>
• <i>Comprar lija de 400, 6 €</i>
• <i>¿Qué le toca a la Bandit?</i> · <i>¿Cuánto llevo gastado este mes?</i>
• <i>¿Dónde está la dinamométrica?</i>

También fotos de tickets (los leo y apunto el gasto) y notas de voz.

<b>Comandos:</b> /hoy (el informe) · /agenda · /compras · /ayuda`;

// ─── Confirmación: lo que entendió el bot, en claro ──────────────────────────

const eur = (c: number) => `${(c / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const nkm = (k: number) => `${k.toLocaleString('es-ES')} km`;
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Datos que faltan para poder apuntar la acción (el vehículo se elige con botones, no cuenta aquí). */
export function faltanDatos(i: Intencion): string[] {
	if (i.tipo === 'repostaje') return [...(i.litros ? [] : ['los litros']), ...(i.importeCent ? [] : ['el importe'])];
	return [];
}

/** «Repostaje · Ibiza» + detalle, en HTML de Telegram, para que confirmes antes de apuntar. */
export function resumenIntencion(i: Intencion, vehiculos: VehiculoBot[], extra: { fecha?: string | null; notas?: string | null } = {}): string {
	const v = 'vehiculoId' in i && i.vehiculoId ? vehiculos.find((x) => x.id === i.vehiculoId)?.alias : null;
	const cab = (t: string) => `<b>${t}</b>${v ? ` · ${esc(v)}` : ''}`;
	const lineas: string[] = [];
	switch (i.tipo) {
		case 'repostaje':
			lineas.push(cab('⛽ Repostaje'), [i.litros ? `${i.litros.toLocaleString('es-ES')} L` : null, i.importeCent ? eur(i.importeCent) : null, i.km ? nkm(i.km) : null, i.lleno ? 'lleno' : 'parcial'].filter(Boolean).join(' · '));
			if (i.litros && i.importeCent) lineas.push(`<i>${(i.importeCent / 100 / i.litros).toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €/L</i>`);
			if (i.gasolinera) lineas.push(esc(i.gasolinera));
			break;
		case 'km':
			lineas.push(cab('🔢 Kilómetros'), nkm(i.km));
			break;
		case 'gasto':
			lineas.push(cab(i.local ? '💶 Gasto del local' : '💶 Gasto'), `${esc(i.concepto)} · ${eur(i.importeCent)}`);
			if (i.proveedor || i.categoria) lineas.push([i.proveedor, i.categoria].filter(Boolean).map((x) => esc(x!)).join(' · '));
			break;
		case 'mantenimiento':
		case 'reparacion':
			lineas.push(cab(i.tipo === 'mantenimiento' ? '🔧 Mantenimiento hecho' : '🛠 Reparación hecha'), esc(i.titulo));
			if (i.revisiones.length) lineas.push(`Revisiones: ${i.revisiones.map(esc).join(', ')}`);
			if (i.km || i.importeCent) lineas.push([i.km ? nkm(i.km) : null, i.importeCent ? eur(i.importeCent) : null].filter(Boolean).join(' · '));
			break;
		case 'averia':
		case 'mejora':
			lineas.push(cab(i.tipo === 'averia' ? '⚠️ Avería por reparar' : '✨ Mejora pendiente'), esc(i.titulo) + (i.urgente ? ' · <b>urgente</b>' : ''));
			break;
		case 'tarea_local':
			lineas.push(`<b>🏠 Tarea del local${i.reforma ? ' (reforma)' : ''}</b>`, esc(i.titulo) + (i.zona ? ` · ${esc(i.zona)}` : ''));
			break;
		case 'compra':
			lineas.push(cab('🛒 A la lista de la compra'), ...i.items.map((x) => `- ${esc(x)}`));
			break;
		default:
			return '';
	}
	if (extra.fecha) lineas.push(`Fecha: ${extra.fecha.split('-').reverse().join('/')}`);
	if (extra.notas) lineas.push(`<i>${esc(extra.notas.length > 400 ? `${extra.notas.slice(0, 400)}…` : extra.notas)}</i>`);
	return lineas.filter(Boolean).join('\n');
}
