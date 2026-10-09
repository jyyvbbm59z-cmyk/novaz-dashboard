// Carga de datos contables desde D1 y construcción de todos los asientos (manuales + derivados).
import { asc } from 'drizzle-orm';
import type { DB } from './consultas';
import {
	asientoDeMovimiento,
	asientosAmortizacion,
	asientosLiquidacionIva,
	numerar,
	type Asiento
} from './contabilidad';
import * as s from './schema';

export async function cargarContabilidad(db: DB, hoy: string) {
	const [movs, cats, manuales, apuntes, bienes, cuentas] = await db.batch([
		db.select().from(s.movimientos),
		db.select({ id: s.categorias.id, cuenta: s.categorias.cuentaContable }).from(s.categorias),
		db.select().from(s.asientos),
		db.select().from(s.apuntes).orderBy(asc(s.apuntes.orden), asc(s.apuntes.id)),
		db.select().from(s.inmovilizado),
		db.select().from(s.cuentas).orderBy(asc(s.cuentas.codigo))
	]);
	const cuentaCategoria = new Map(cats.map((c) => [c.id, c.cuenta]));
	const porAsiento = new Map<number, typeof apuntes>();
	for (const p of apuntes) porAsiento.set(p.asientoId, [...(porAsiento.get(p.asientoId) ?? []), p]);

	const base: Asiento[] = [
		...manuales.map((a) => ({
			clave: `x${a.id}`,
			fecha: a.fecha,
			concepto: a.concepto,
			origen: 'manual' as const,
			refId: a.id,
			apuntes: (porAsiento.get(a.id) ?? []).map((p) => ({ cuenta: p.cuenta, debe: p.debeCent, haber: p.haberCent }))
		})),
		...movs.map((m) => asientoDeMovimiento(m, m.categoriaId ? (cuentaCategoria.get(m.categoriaId) ?? null) : null)),
		...bienes.flatMap((b) => asientosAmortizacion(b, hoy))
	];
	const asientos = numerar([...base, ...asientosLiquidacionIva(base, hoy)]);
	return {
		asientos,
		cuentas,
		plan: new Map(cuentas.map((c) => [c.codigo, c.nombre])),
		bienes,
		ejercicios: [...new Set([Number(hoy.slice(0, 4)), ...asientos.map((a) => Number(a.fecha.slice(0, 4)))])].sort((a, b) => b - a)
	};
}
