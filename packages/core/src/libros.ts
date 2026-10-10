// Carga de datos contables desde D1 y construcción de todos los asientos (manuales + derivados).
import { asc, eq } from 'drizzle-orm';
import type { DB } from './consultas';
import {
	asientoDeMovimiento,
	asientosAmortizacion,
	asientosLiquidacionIva,
	numerar,
	type Asiento
} from './contabilidad';
import * as s from './schema';
import { diferenciasCuadre, fechasRecurrente } from './tesoreria';

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

	const manualesAs: Asiento[] = manuales.map((a) => ({
			clave: `x${a.id}`,
			fecha: a.fecha,
			concepto: a.concepto,
			origen: 'manual' as const,
			refId: a.id,
			apuntes: (porAsiento.get(a.id) ?? []).map((p) => ({ cuenta: p.cuenta, debe: p.debeCent, haber: p.haberCent }))
	}));
	const asientoDe = (m: s.Movimiento) => asientoDeMovimiento(m, m.categoriaId ? (cuentaCategoria.get(m.categoriaId) ?? null) : null);

	// Ajustes de cuadre «vivos»: su importe se recalcula para que el saldo de ese día sea el real
	const normales = movs.filter((m) => m.cuadreSaldoCent == null);
	const cuadres = movs.filter((m) => m.cuadreSaldoCent != null);
	const ajustados: s.Movimiento[] = [];
	if (cuadres.length) {
		const diferencias = diferenciasCuadre(
			[...manualesAs, ...normales.map(asientoDe)],
			cuadres.map((m) => ({ id: m.id, fecha: m.fecha, cuenta: m.pago === 'caja' ? '570' : '572', saldoCent: m.cuadreSaldoCent! }))
		);
		for (const m of cuadres) {
			const nuevo = { ...m, ...ajusteCuadre(m, diferencias.get(m.id) ?? 0) };
			if (nuevo.importeCent !== m.importeCent || nuevo.tipo !== m.tipo || nuevo.cuentaContable !== m.cuentaContable) {
				await db
					.update(s.movimientos)
					.set({ importeCent: nuevo.importeCent, tipo: nuevo.tipo, cuentaContable: nuevo.cuentaContable, concepto: nuevo.concepto, ivaPct: 0 })
					.where(eq(s.movimientos.id, m.id));
			}
			ajustados.push(nuevo);
		}
	}

	const base: Asiento[] = [...manualesAs, ...normales.map(asientoDe), ...ajustados.map(asientoDe), ...bienes.flatMap((b) => asientosAmortizacion(b, hoy))];
	const asientos = numerar([...base, ...asientosLiquidacionIva(base, hoy)]);
	return {
		asientos,
		cuentas,
		plan: new Map(cuentas.map((c) => [c.codigo, c.nombre])),
		bienes,
		ejercicios: [...new Set([Number(hoy.slice(0, 4)), ...asientos.map((a) => Number(a.fecha.slice(0, 4)))])].sort((a, b) => b - a)
	};
}

/** Tipo, cuenta e importe de un ajuste de cuadre según la diferencia (con signo) que tiene que cubrir. */
export function ajusteCuadre(m: Pick<s.Movimiento, 'tipo' | 'concepto' | 'pago' | 'cuentaContable'>, diferencia: number) {
	const efectivo = m.pago === 'caja';
	if (diferencia < 0) {
		const tipo = 'gasto' as const;
		return { tipo, importeCent: -diferencia, cuentaContable: m.tipo === tipo && m.cuentaContable ? m.cuentaContable : '678', ivaPct: 0, concepto: m.tipo === tipo ? m.concepto : efectivo ? 'Descuadre de caja' : 'Descuadre con el banco' };
	}
	// Lo que sobra: lo pusiste tú y no se apuntó (o un ingreso sin identificar, si así lo elegiste)
	if (m.tipo === 'ingreso') return { tipo: 'ingreso' as const, importeCent: diferencia, cuentaContable: '759', ivaPct: 0, concepto: m.concepto };
	return { tipo: 'aportacion' as const, importeCent: diferencia, cuentaContable: '118', ivaPct: 0, concepto: m.tipo === 'aportacion' ? m.concepto : 'Aportación sin apuntar' };
}

/**
 * Convierte en movimientos reales las ocurrencias de operaciones recurrentes ya vencidas.
 * Idempotente: avanza `ultimaGenerada`, así que lo que borres a mano no vuelve a aparecer.
 */
export async function materializarRecurrentes(db: DB, hoy: string): Promise<number> {
	const reglas = await db.select().from(s.recurrentes).where(eq(s.recurrentes.activo, true));
	let creados = 0;
	for (const r of reglas) {
		const fechas = fechasRecurrente(r, hoy);
		if (!fechas.length) continue;
		await db.insert(s.movimientos).values(
			fechas.map((fecha) => ({
				fecha,
				tipo: r.tipo,
				importeCent: r.importeCent,
				ivaPct: r.ivaPct,
				pago: r.pago,
				cuentaContable: r.cuentaContable,
				categoriaId: r.categoriaId,
				concepto: r.concepto,
				proveedor: r.proveedor,
				recurrenteId: r.id
			}))
		);
		await db.update(s.recurrentes).set({ ultimaGenerada: fechas[fechas.length - 1] }).where(eq(s.recurrentes.id, r.id));
		creados += fechas.length;
	}
	return creados;
}
