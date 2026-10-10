import { claseFlujo, esTesoreria, prevision, sumarMeses, type Asiento } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc, eq, isNotNull, or } from 'drizzle-orm';

/** Saldos, gasto habitual, previsión a 6 meses y sugerencia de aportación. */
export async function estadoTesoreria(locals: App.Locals, asientos: Asiento[]) {
	const { db, hoy } = locals;
	const [recurrentes, deRecurrente] = await Promise.all([
		db
			.select({ r: s.recurrentes, categoria: s.categorias.nombre })
			.from(s.recurrentes)
			.leftJoin(s.categorias, eq(s.recurrentes.categoriaId, s.categorias.id))
			.orderBy(asc(s.recurrentes.dia)),
		db
			.select({ id: s.movimientos.id })
			.from(s.movimientos)
			.where(or(isNotNull(s.movimientos.recurrenteId), isNotNull(s.movimientos.cuadreSaldoCent)))
	]);

	const hastaHoy = asientos.filter((a) => a.fecha <= hoy);
	const saldo = (p: string) => hastaHoy.reduce((t, a) => t + a.apuntes.filter((x) => x.cuenta.startsWith(p)).reduce((s, x) => s + x.debe - x.haber, 0), 0);
	const banco = saldo('572');
	const caja = saldo('570');

	// Cobros y pagos "habituales": media de los 3 meses completos anteriores, sin recurrentes, cuadres ni financiación
	const recurrenteIds = new Set(deRecurrente.map((m) => m.id));
	const desde = sumarMeses(`${hoy.slice(0, 7)}-01`, -3);
	const hasta = `${hoy.slice(0, 7)}-01`;
	let habitual = 0;
	let pagos = 0;
	for (const a of asientos) {
		if (a.fecha < desde || a.fecha >= hasta) continue;
		if (a.origen === 'movimiento' && recurrenteIds.has(a.refId!)) continue;
		const clase = claseFlujo(a);
		if (clase !== 'cobros' && clase !== 'pagos') continue;
		const delta = a.apuntes.filter((p) => esTesoreria(p.cuenta)).reduce((t, p) => t + p.debe - p.haber, 0);
		habitual += delta;
		if (delta < 0) pagos -= delta;
	}
	habitual = Math.round(habitual / 3);
	const habitualCalculado = habitual;
	const fijado = locals.ajustes.gastoHabitualCent;
	if (fijado != null) habitual = -Math.abs(fijado);

	const reglas = recurrentes.map((x) => x.r);
	const prev = prevision(banco + caja, hoy, reglas, habitual, 6);
	const peor = prev.reduce((m, p) => (p.saldo < m.saldo ? p : m), { saldo: Infinity, mes: '' } as { saldo: number; mes: string });
	let sugerencia: { mensual: number; mes: string } | null = null;
	if (peor.saldo < 0) {
		const n = prev.findIndex((p) => p.mes === peor.mes) + 1;
		sugerencia = { mensual: Math.ceil(-peor.saldo / n / 1000) * 1000, mes: peor.mes };
	}
	return {
		banco,
		caja,
		habitual,
		habitualCalculado,
		habitualFijado: fijado != null,
		gastoMedioMensual: Math.round(pagos / 3),
		prevision: prev,
		sugerencia,
		recurrentes: recurrentes.map((x) => ({ ...x.r, categoria: x.categoria }))
	};
}
