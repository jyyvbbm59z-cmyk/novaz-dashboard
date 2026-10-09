import { diasEntre, perdidasYGanancias, resumenIva, revisionContable, sumasYSaldos, trimestreDe } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, eq, gte, inArray, isNull } from 'drizzle-orm';
import { estadoTesoreria } from '$lib/server/tesoreria';
import { corte, delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';

export const load = async ({ locals, url }) => {
	const { hoy, ajustes } = locals;
	const ejercicio = ejercicioDeUrl(url, hoy);
	const { asientos, bienes } = await libros(locals);
	const delEj = delEjercicio(asientos, ejercicio);
	const fechaCorte = corte(ejercicio, hoy);
	const hasta = asientos.filter((a) => a.fecha <= fechaCorte);
	const saldo = (p: string) => hasta.reduce((t, a) => t + a.apuntes.filter((x) => x.cuenta.startsWith(p)).reduce((s, x) => s + x.debe - x.haber, 0), 0);

	const pyg = perdidasYGanancias(sumasYSaldos(delEj));
	let ingresos = 0;
	let gastos = 0;
	const meses = Array.from({ length: 12 }, () => ({ ingresos: 0, gastos: 0 }));
	for (const a of delEj)
		for (const p of a.apuntes) {
			const m = meses[Number(a.fecha.slice(5, 7)) - 1];
			if (p.cuenta[0] === '7') {
				ingresos += p.haber - p.debe;
				m.ingresos += p.haber - p.debe;
			} else if (p.cuenta[0] === '6') {
				gastos += p.debe - p.haber;
				m.gastos += p.debe - p.haber;
			}
		}

	const iva = resumenIva(asientos, ejercicio, hoy);

	// Revisión contable (siempre sobre la situación de hoy)
	const tes = await estadoTesoreria(locals, asientos);
	const ahora = asientos.filter((a) => a.fecha <= hoy);
	const saldoHoy = (p: string) => ahora.reduce((t, a) => t + a.apuntes.filter((x) => x.cuenta.startsWith(p)).reduce((s, x) => s + x.debe - x.haber, 0), 0);
	const [sinCategoria, grandes, bienesMov] = await Promise.all([
		locals.db.select({ id: s.movimientos.id }).from(s.movimientos).where(and(isNull(s.movimientos.categoriaId), isNull(s.movimientos.cuentaContable), inArray(s.movimientos.tipo, ['gasto', 'ingreso']))),
		locals.db
			.select({ id: s.movimientos.id, concepto: s.movimientos.concepto, importe: s.movimientos.importeCent, cuenta: s.movimientos.cuentaContable, catCuenta: s.categorias.cuentaContable })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.importeCent, 30000))),
		locals.db.select({ id: s.inmovilizado.movimientoId }).from(s.inmovilizado)
	]);
	const yaInmov = new Set(bienesMov.map((b) => b.id));
	const revision = revisionContable({
		tesoreria: tes.banco + tes.caja,
		socio: -saldoHoy('551'),
		ivaPagar: -saldoHoy('4750'),
		sinCategoria: sinCategoria.length,
		posiblesInmovilizado: grandes
			.filter((g) => !yaInmov.has(g.id) && ['629', '602', '622'].includes(g.cuenta ?? g.catCuenta ?? '629'))
			.map((g) => ({ id: g.id, concepto: g.concepto, importe: g.importe })),
		hayAportacionMensual: tes.recurrentes.some((r) => r.activo && r.tipo === 'aportacion'),
		gastoMedioMensual: tes.gastoMedioMensual,
		diasCuadre: ajustes.ultimoCuadre ? diasEntre(ajustes.ultimoCuadre, hoy) : null,
		sugerencia: tes.sugerencia,
		hayMovimientos: asientos.some((a) => a.origen === 'movimiento')
	});
	const tActual = ejercicio === Number(hoy.slice(0, 4)) ? trimestreDe(hoy).t : 4;
	return {
		resultado: pyg.resultado,
		antesImpuestos: pyg.antesImpuestos,
		impuestoEstimado: Math.round((Math.max(pyg.antesImpuestos, 0) * ajustes.tipoImpuestoSociedades) / 100),
		ingresos,
		gastos,
		meses: meses.map((m) => ({ ...m, resultado: m.ingresos - m.gastos })),
		tesoreria: { banco: saldo('572'), caja: saldo('570') },
		socio: -saldo('551'),
		hacienda: { ivaPagar: -saldo('4750'), ivaCompensar: saldo('4700') },
		ivaTrimestre: iva[tActual - 1],
		inmovilizado: { bienes: bienes.length, neto: saldo('2') },
		asientos: delEj.length,
		fechaCorte,
		revision
	};
};
