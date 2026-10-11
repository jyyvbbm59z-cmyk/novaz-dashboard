import { diasEntre } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import { corte, ejercicioDeUrl, libros } from '$lib/server/contabilidad';

/** Resumen de Dinero: lo que hay en el banco, en qué se va el dinero este año y de dónde sale. */
export const load = async ({ locals, url }) => {
	const { hoy, ajustes, db } = locals;
	const ejercicio = ejercicioDeUrl(url, hoy);
	const fechaCorte = corte(ejercicio, hoy);
	const { asientos } = await libros(locals);

	// Lo que hay: banco y caja a hoy
	const ahora = asientos.filter((a) => a.fecha <= hoy);
	const saldo = (p: string) => ahora.reduce((t, a) => t + a.apuntes.filter((x) => x.cuenta.startsWith(p)).reduce((x, y) => x + y.debe - y.haber, 0), 0);

	// Movimientos reales del ejercicio y del mismo periodo del año anterior (sin ajustes de cuadre)
	const mismoDiaAnterior = `${ejercicio - 1}${fechaCorte.slice(4)}`;
	const [movs, anteriores, categorias] = await Promise.all([
		db
			.select({ fecha: s.movimientos.fecha, tipo: s.movimientos.tipo, importe: s.movimientos.importeCent, categoriaId: s.movimientos.categoriaId })
			.from(s.movimientos)
			.where(and(gte(s.movimientos.fecha, `${ejercicio}-01-01`), lte(s.movimientos.fecha, fechaCorte), isNull(s.movimientos.cuadreSaldoCent))),
		db
			.select({ importe: s.movimientos.importeCent, categoriaId: s.movimientos.categoriaId })
			.from(s.movimientos)
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.fecha, `${ejercicio - 1}-01-01`), lte(s.movimientos.fecha, mismoDiaAnterior), isNull(s.movimientos.cuadreSaldoCent))),
		db.select().from(s.categorias)
	]);

	const gastos = movs.filter((m) => m.tipo === 'gasto');
	const porCategoria = new Map<number | null, { total: number; n: number; anterior: number }>();
	for (const g of gastos) {
		const c = porCategoria.get(g.categoriaId) ?? { total: 0, n: 0, anterior: 0 };
		c.total += g.importe;
		c.n++;
		porCategoria.set(g.categoriaId, c);
	}
	for (const g of anteriores) {
		const c = porCategoria.get(g.categoriaId);
		if (c) c.anterior += g.importe;
	}
	const totalGasto = gastos.reduce((t, g) => t + g.importe, 0);
	const categoriasGasto = [...porCategoria.entries()]
		.map(([id, c]) => {
			const cat = categorias.find((x) => x.id === id);
			return { id, nombre: cat?.nombre ?? 'Sin categoría', color: cat?.color ?? '#6c727c', ...c };
		})
		.sort((a, b) => b.total - a.total);

	// Gasto mes a mes
	const meses = Array.from({ length: 12 }, () => 0);
	for (const g of gastos) meses[Number(g.fecha.slice(5, 7)) - 1] += g.importe;
	const mesesTranscurridos = ejercicio < Number(hoy.slice(0, 4)) ? 12 : Number(hoy.slice(5, 7));

	// De dónde sale el dinero: tus aportaciones y los ingresos
	const ingresosPorCat = new Map<number | null, number>();
	for (const m of movs.filter((x) => x.tipo === 'ingreso')) ingresosPorCat.set(m.categoriaId, (ingresosPorCat.get(m.categoriaId) ?? 0) + m.importe);
	const entradas = [
		{ nombre: 'Tus aportaciones', total: movs.filter((m) => m.tipo === 'aportacion').reduce((t, m) => t + m.importe, 0) },
		...[...ingresosPorCat.entries()].map(([id, total]) => ({ nombre: categorias.find((x) => x.id === id)?.nombre ?? 'Otros ingresos', total }))
	].filter((e) => e.total);

	return {
		banco: saldo('572'),
		caja: saldo('570'),
		diasCuadre: ajustes.ultimoCuadre ? diasEntre(ajustes.ultimoCuadre, hoy) : null,
		fechaCorte,
		totalGasto,
		totalAnterior: anteriores.reduce((t, g) => t + g.importe, 0),
		mediaMensual: Math.round(totalGasto / Math.max(1, mesesTranscurridos)),
		categoriasGasto,
		meses,
		mesesTranscurridos,
		entradas
	};
};
