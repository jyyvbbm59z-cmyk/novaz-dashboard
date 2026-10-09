// Importes en céntimos enteros: nunca flotantes para dinero.

/** "1.234,56" | "1234.56" | "12" → céntimos. null si no es válido. */
export function parsearEuros(texto: string | null | undefined): number | null {
	if (texto == null) return null;
	let s = texto.trim().replace(/[€\s]/g, '');
	if (s === '') return null;
	// Si hay coma, es el separador decimal y los puntos son de miles.
	if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
	if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
	const [ent, dec = ''] = s.replace('-', '').split('.');
	const cent = Number(ent) * 100 + Number(dec.padEnd(2, '0'));
	return s.startsWith('-') ? -cent : cent;
}

const formato = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const formatoSinDec = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function euros(cent: number | null | undefined, { redondo = false } = {}): string {
	if (cent == null) return '—';
	return (redondo ? formatoSinDec : formato).format(cent / 100);
}

/** Céntimos → valor para un <input> ("12,50"). */
export function eurosInput(cent: number | null | undefined): string {
	if (cent == null) return '';
	return (cent / 100).toFixed(2).replace('.', ',');
}
