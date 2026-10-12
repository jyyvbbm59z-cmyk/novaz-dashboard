// Gráfico de gasto por mes, apilado por categoría.

/** Cuántas categorías tienen color propio; el resto va junto en «Otros». */
export const MAX_SERIES = 7;

export interface SerieGasto {
	/** «c12» para una categoría; «otros» para lo demás (y lo que no tiene categoría). */
	clave: string;
	nombre: string;
	/** Hueco de color (1–7) o 0 para «Otros». */
	hueco: number;
}

/**
 * Las series del gráfico y el gasto de cada mes por serie. El color de cada categoría sale de lo que gasta en el año
 * (sin filtros): así no cambia de color al filtrar. Con más de siete, las pequeñas van juntas en «Otros».
 */
export function seriesGasto(
	porMes: { mes: string; cat: number | null; total: number }[],
	delAnio: { cat: number | null; total: number }[],
	categorias: { id: number; nombre: string }[]
) {
	const orden = delAnio
		.filter((x) => x.cat != null && Number(x.total) > 0)
		.sort((a, b) => Number(b.total) - Number(a.total) || a.cat! - b.cat!)
		.map((x) => x.cat!);
	const conColor = orden.slice(0, MAX_SERIES);
	const clave = (cat: number | null) => (cat != null && conColor.includes(cat) ? `c${cat}` : 'otros');
	// Si se filtra por una categoría de «Otros», se ve con su nombre (en gris)
	const presentes = [...new Set(porMes.filter((x) => Number(x.total) > 0).map((x) => x.cat))];
	const solo = presentes.length === 1 && presentes[0] != null && !conColor.includes(presentes[0]) ? presentes[0] : null;
	const nombre = (cat: number | null) => categorias.find((c) => c.id === cat)?.nombre ?? 'Sin categoría';
	const series: SerieGasto[] = [
		...conColor.filter((c) => presentes.includes(c)).map((c) => ({ clave: `c${c}`, nombre: nombre(c), hueco: conColor.indexOf(c) + 1 })),
		...(presentes.some((c) => clave(c) === 'otros') ? [{ clave: 'otros', nombre: solo != null ? nombre(solo) : 'Otros', hueco: 0 }] : [])
	];
	const meses = Array.from({ length: 12 }, (_, i) => {
		const mes = String(i + 1).padStart(2, '0');
		const partes: Record<string, number> = {};
		for (const x of porMes.filter((y) => y.mes === mes)) partes[clave(x.cat)] = (partes[clave(x.cat)] ?? 0) + Number(x.total);
		return { mes, total: Object.values(partes).reduce((a, b) => a + b, 0), partes };
	});
	return { series, meses };
}

/** Escala «redonda» para el eje: 0, 250, 500… hasta pasar del máximo (en céntimos). */
export function escalaEje(maxCent: number, marcas = 4): number[] {
	const max = Math.max(maxCent, 100);
	const bruto = max / marcas;
	const mag = 10 ** Math.floor(Math.log10(bruto));
	const paso = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((p) => p >= bruto)!;
	const tope = Math.ceil(max / paso) * paso;
	return Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso);
}
