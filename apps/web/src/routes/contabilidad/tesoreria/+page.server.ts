import { flujoDeCaja } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { ejercicioDeUrl, libros } from '$lib/server/contabilidad';
import { estadoTesoreria } from '$lib/server/tesoreria';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos } = await libros(locals);
	const [cuadres, efectivo] = await Promise.all([
		locals.db
			.select({ id: s.movimientos.id, fecha: s.movimientos.fecha, pago: s.movimientos.pago, saldo: s.movimientos.cuadreSaldoCent, tipo: s.movimientos.tipo, importe: s.movimientos.importeCent, concepto: s.movimientos.concepto })
			.from(s.movimientos)
			.where(isNotNull(s.movimientos.cuadreSaldoCent))
			.orderBy(desc(s.movimientos.fecha), desc(s.movimientos.id)),
		locals.db.select({ id: s.movimientos.id }).from(s.movimientos).where(and(eq(s.movimientos.pago, 'caja'), isNull(s.movimientos.cuadreSaldoCent)))
	]);
	return {
		...(await estadoTesoreria(locals, asientos)),
		flujo: flujoDeCaja(asientos, ejercicio),
		cuadres,
		primerCuadre: cuadres.at(-1)?.fecha ?? null,
		movimientosEfectivo: efectivo.length
	};
};

export const actions = {
	cuadrar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const real = f.euros('saldoReal');
		if (real == null) throw new ErrorFormulario('Escribe el saldo que ves en tu banco');
		const cuenta = f.texto('cuenta') === '570' ? '570' : '572';
		const pago = cuenta === '570' ? 'caja' : 'banco';
		const { asientos } = await libros(locals);
		const libro = asientos.filter((a) => a.fecha <= locals.hoy).reduce((t, a) => t + a.apuntes.filter((p) => p.cuenta === cuenta).reduce((x, p) => x + p.debe - p.haber, 0), 0);
		const diferencia = real - libro;
		const como = f.texto('como');
		if (diferencia !== 0 && !como) return { diferencia };

		// El cuadre queda «vivo»: guarda el saldo real y su importe se recalcula si luego apuntas algo con fecha anterior
		const notas = `Ajuste para cuadrar con el saldo real (${(real / 100).toFixed(2)} €)`;
		const [deHoy] = await locals.db
			.select()
			.from(s.movimientos)
			.where(and(eq(s.movimientos.fecha, locals.hoy), eq(s.movimientos.pago, pago), isNotNull(s.movimientos.cuadreSaldoCent)));
		if (deHoy) {
			await locals.db.update(s.movimientos).set({ cuadreSaldoCent: real, notas }).where(eq(s.movimientos.id, deHoy.id));
		} else {
			const tipo = diferencia < 0 ? 'gasto' : como === 'ingreso' ? 'ingreso' : 'aportacion';
			const concepto =
				diferencia === 0
					? cuenta === '570' ? 'Cuadre de caja' : 'Cuadre con el banco'
					: diferencia < 0
						? como === 'comision' ? 'Comisiones y cargos sin apuntar' : cuenta === '570' ? 'Descuadre de caja' : 'Descuadre con el banco'
						: como === 'ingreso' ? 'Ingreso sin identificar' : 'Aportación sin apuntar';
			const cuentaContable = diferencia < 0 ? (como === 'comision' ? '626' : '678') : como === 'ingreso' ? '759' : '118';
			await locals.db.insert(s.movimientos).values({
				fecha: locals.hoy,
				tipo,
				importeCent: Math.abs(diferencia),
				ivaPct: 0,
				pago,
				cuentaContable,
				concepto,
				notas,
				cuadreSaldoCent: real
			});
		}
		await locals.db
			.insert(s.ajustes)
			.values({ clave: 'ultimoCuadre', valor: locals.hoy })
			.onConflictDoUpdate({ target: s.ajustes.clave, set: { valor: locals.hoy } });
		return { mensaje: cuenta === '570' ? '¡Caja cuadrada!' : '¡Cuadrado con el banco!', momento: 'cajaCuadrada', diferencia: 0 };
	}),

	borrarCuadre: accion(async ({ request, locals }) => {
		const id = leer(await request.formData()).id('id');
		await locals.db.delete(s.movimientos).where(and(eq(s.movimientos.id, id), isNotNull(s.movimientos.cuadreSaldoCent)));
		return { mensaje: 'Cuadre deshecho' };
	}),

	efectivoABanco: accion(async ({ locals }) => {
		const r = await locals.db
			.update(s.movimientos)
			.set({ pago: 'banco' })
			.where(and(eq(s.movimientos.pago, 'caja'), isNull(s.movimientos.cuadreSaldoCent)))
			.returning({ id: s.movimientos.id });
		// Si la caja tenía cuadres, ya no tienen sentido
		await locals.db.delete(s.movimientos).where(and(eq(s.movimientos.pago, 'caja'), isNotNull(s.movimientos.cuadreSaldoCent)));
		return { mensaje: `${r.length} ${r.length === 1 ? 'movimiento pasado' : 'movimientos pasados'} al banco` };
	}),

	habitual: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const valor = f.bool('automatico') ? null : Math.abs(f.euros('gastoHabitual') ?? 0);
		await locals.db
			.insert(s.ajustes)
			.values({ clave: 'gastoHabitualCent', valor })
			.onConflictDoUpdate({ target: s.ajustes.clave, set: { valor } });
		return { mensaje: valor == null ? 'La previsión calculará el gasto habitual sola' : 'Previsión actualizada' };
	}),

	recurrente: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const importe = f.euros('importe');
		if (!importe) throw new ErrorFormulario('Indica el importe');
		await locals.db
			.update(s.recurrentes)
			.set({
				concepto: f.obligatorio('concepto', 'concepto'),
				importeCent: Math.abs(importe),
				dia: Math.min(Math.max(f.entero('dia') ?? 1, 1), 31),
				hasta: f.fecha('hasta'),
				activo: f.bool('activo')
			})
			.where(eq(s.recurrentes.id, f.id('id')));
		return { mensaje: 'Guardado. Afecta a los próximos meses' };
	}),

	borrarRecurrente: accion(async ({ request, locals }) => {
		const id = leer(await request.formData()).id('id');
		// Los movimientos ya apuntados se quedan; solo deja de repetirse
		await locals.db.update(s.movimientos).set({ recurrenteId: null }).where(eq(s.movimientos.recurrenteId, id));
		await locals.db.delete(s.recurrentes).where(eq(s.recurrentes.id, id));
		return { mensaje: 'Ya no se repetirá' };
	})
};
