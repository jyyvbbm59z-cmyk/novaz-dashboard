// Fechas de negocio como 'YYYY-MM-DD'. Toda la aritmética en UTC para evitar saltos de horario.

const DIA_MS = 86_400_000;

function aUTC(iso: string): number {
	const [a, m, d] = iso.split('-').map(Number);
	return Date.UTC(a, m - 1, d);
}

function desdeUTC(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/** Fecha de hoy en la zona horaria indicada (por defecto, la del taller). */
export function hoy(zona = 'Europe/Madrid', ahora = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

/** Días de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
	return Math.round((aUTC(hasta) - aUTC(desde)) / DIA_MS);
}

export function sumarDias(iso: string, dias: number): string {
	return desdeUTC(aUTC(iso) + dias * DIA_MS);
}

/** Suma meses respetando fin de mes: 31-ene + 1 mes = 28/29-feb. */
export function sumarMeses(iso: string, meses: number): string {
	const [a, m, d] = iso.split('-').map(Number);
	const total = a * 12 + (m - 1) + meses;
	const na = Math.floor(total / 12);
	const nm = total % 12;
	const ultimo = new Date(Date.UTC(na, nm + 1, 0)).getUTCDate();
	return desdeUTC(Date.UTC(na, nm, Math.min(d, ultimo)));
}

export function esFechaISO(s: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(aUTC(s));
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** '2026-10-09' → '9 oct 2026' */
export function fechaLarga(iso: string | null | undefined): string {
	if (!iso) return '—';
	const [a, m, d] = iso.split('-').map(Number);
	return `${d} ${MESES[m - 1]} ${a}`;
}

/** Texto humano para N días: "hoy", "mañana", "en 12 días", "hace 3 días". */
export function textoDias(dias: number): string {
	if (dias === 0) return 'hoy';
	if (dias === 1) return 'mañana';
	if (dias === -1) return 'ayer';
	if (dias > 0) return `en ${dias} días`;
	return `hace ${-dias} días`;
}
