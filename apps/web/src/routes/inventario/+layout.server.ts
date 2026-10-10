import * as s from '@novaz/core/schema';
import { desc, eq } from 'drizzle-orm';
import { adjuntosDe } from '$lib/server/adjuntos';
import { cargarInventario } from '$lib/server/inventario';

export const load = async ({ locals }) => {
	const articulos = await cargarInventario(locals.db);
	const movs = await locals.db
		.select({ m: s.stock, vehiculo: s.vehiculos.alias, entrada: s.entradas.titulo })
		.from(s.stock)
		.leftJoin(s.entradas, eq(s.stock.entradaId, s.entradas.id))
		.leftJoin(s.vehiculos, eq(s.entradas.vehiculoId, s.vehiculos.id))
		.orderBy(desc(s.stock.fecha), desc(s.stock.id))
		.limit(1000);
	const historial: Record<number, { id: number; fecha: string; cantidad: number; motivo: string; notas: string | null; detalle: string | null }[]> = {};
	for (const { m, vehiculo, entrada } of movs)
		(historial[m.articuloId] ??= []).push({ id: m.id, fecha: m.fecha, cantidad: m.cantidad, motivo: m.motivo, notas: m.notas, detalle: entrada ? `${entrada}${vehiculo ? ` · ${vehiculo}` : ''}` : null });
	const unicos = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))].sort((a, b) => a.localeCompare(b, 'es'));
	return {
		articulos,
		historial,
		fotosInv: await adjuntosDe(locals.db, 'articulo', articulos.map((a) => a.id)),
		categoriasInv: unicos(articulos.map((a) => a.categoria)),
		ubicaciones: unicos(articulos.map((a) => a.ubicacion))
	};
};
