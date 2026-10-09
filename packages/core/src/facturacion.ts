// Facturas e informes de trabajos: líneas, totales, numeración y km.
import { desglosarIva } from './contabilidad';

export interface LineaFactura {
	concepto: string;
	detalle?: string | null;
	cantidad: number;
	unidad?: string | null;
	precioCent: number;
}

export const importeLinea = (l: LineaFactura) => Math.round(l.cantidad * l.precioCent);

export function totalesFactura(lineas: LineaFactura[], ivaPct: number) {
	const base = lineas.reduce((t, l) => t + importeLinea(l), 0);
	const iva = Math.round((base * ivaPct) / 100);
	return { base, iva, total: base + iva };
}

export const numeroFactura = (serie: string, anio: number, numero: number) => `${serie}-${anio}-${String(numero).padStart(4, '0')}`;

/**
 * Km de la factura: si todas las operaciones elegidas tienen el mismo km, ese.
 * Si no coinciden (o no hay), el km total del vehículo.
 */
export function kmFactura(kms: (number | null)[], kmVehiculo: number | null): number | null {
	const distintos = [...new Set(kms.filter((k): k is number => k != null))];
	return distintos.length === 1 ? distintos[0] : kmVehiculo;
}

/** Propuesta de líneas a partir de las operaciones: horas a la tarifa + materiales (sin IVA) de sus gastos. */
export function lineasDesdeEntradas(
	entradas: { id?: number; titulo: string; texto: string | null; horas: number | null }[],
	gastos: { entradaId?: number | null; concepto: string; proveedor?: string | null; importeCent: number; ivaPct: number }[],
	tarifaHoraCent: number
): LineaFactura[] {
	const material = (g: (typeof gastos)[number]): LineaFactura => ({
		concepto: `Material${g.proveedor ? ` (${g.proveedor})` : ''}`,
		detalle: g.concepto,
		cantidad: 1,
		precioCent: desglosarIva(g.importeCent, g.ivaPct).base
	});
	const lineas: LineaFactura[] = [];
	for (const e of entradas) {
		lineas.push({ concepto: e.titulo, detalle: e.texto, cantidad: e.horas ?? 1, unidad: e.horas ? 'h' : null, precioCent: e.horas ? tarifaHoraCent : 0 });
		for (const g of gastos) if (e.id != null && g.entradaId === e.id) lineas.push(material(g));
	}
	// Gastos sin operación asociada, al final
	for (const g of gastos) if (g.entradaId == null || !entradas.some((e) => e.id === g.entradaId)) lineas.push(material(g));
	return lineas;
}
