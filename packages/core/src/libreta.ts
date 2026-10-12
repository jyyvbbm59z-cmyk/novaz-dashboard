// La libreta de gastos de un vehículo propio (un amigo con sus coches): sencilla, sin contabilidad.

export const NOMBRE_GASTO_SIMPLE: Record<string, string> = {
	combustible: 'Combustible',
	mantenimiento: 'Mantenimiento',
	reparacion: 'Reparación',
	seguro: 'Seguro',
	itv: 'ITV',
	impuestos: 'Impuestos',
	otros: 'Otros'
};

/** La categoría por lo que dice el concepto («Gasolina» → combustible, «Seguro Mapfre» → seguro…). */
export function categoriaSimple(texto: string): string {
	const t = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	if (/gasolin|gasoil|diesel|repost|combust|lleno/.test(t)) return 'combustible';
	if (/seguro|poliza/.test(t)) return 'seguro';
	if (/\bitv\b|inspeccion/.test(t)) return 'itv';
	if (/impuesto|ivtm|circulacion|tasa|multa/.test(t)) return 'impuestos';
	if (/reparac|averia|arregl/.test(t)) return 'reparacion';
	if (/aceite|filtro|revision|manten|neumatic|ruedas|pastillas|frenos|correa|bujia/.test(t)) return 'mantenimiento';
	return 'otros';
}

export interface ResumenLibreta {
	mes: number;
	anio: number;
	total: number;
	porCategoria: { categoria: string; total: number }[];
	/** Céntimos por km en el año (si hay km para calcularlo). */
	porKm: number | null;
	/** Consumo medio (L/100 km) de los repostajes con litros y km. */
	consumo: number | null;
}

export function resumenLibreta(gastos: { fecha: string; categoria: string; importeCent: number; km: number | null; litros: number | null }[], lecturas: { fecha: string; km: number }[], hoy: string): ResumenLibreta {
	const anio = hoy.slice(0, 4);
	const delAnio = gastos.filter((g) => g.fecha.startsWith(anio));
	const suma = (xs: typeof gastos) => xs.reduce((t, g) => t + g.importeCent, 0);
	const cats = new Map<string, number>();
	for (const g of delAnio) cats.set(g.categoria, (cats.get(g.categoria) ?? 0) + g.importeCent);
	// Km del año: de la primera a la última lectura del año (lecturas del vehículo y km apuntados en la libreta)
	const kms = [...lecturas.filter((l) => l.fecha.startsWith(anio)).map((l) => l.km), ...delAnio.flatMap((g) => (g.km ? [g.km] : []))];
	const recorridos = kms.length >= 2 ? Math.max(...kms) - Math.min(...kms) : 0;
	// Consumo: litros repostados entre el primer y el último repostaje con km (el primero no cuenta: llena lo gastado antes)
	const reps = gastos.filter((g) => g.categoria === 'combustible' && g.litros && g.km).sort((a, b) => a.km! - b.km!);
	const consumo = reps.length >= 2 && reps[reps.length - 1].km! > reps[0].km! ? (reps.slice(1).reduce((t, r) => t + r.litros!, 0) / (reps[reps.length - 1].km! - reps[0].km!)) * 100 : null;
	return {
		mes: suma(gastos.filter((g) => g.fecha.startsWith(hoy.slice(0, 7)))),
		anio: suma(delAnio),
		total: suma(gastos),
		porCategoria: [...cats.entries()].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total),
		porKm: recorridos > 100 ? Math.round(suma(delAnio) / recorridos) : null,
		consumo: consumo != null ? Math.round(consumo * 10) / 10 : null
	};
}
