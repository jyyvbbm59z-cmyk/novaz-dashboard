import { asientosAmortizacion, CUENTAS_INMOVILIZADO } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc, eq } from 'drizzle-orm';
import { corte, ejercicioDeUrl } from '$lib/server/contabilidad';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const fecha = corte(ejercicio, locals.hoy);
	const bienes = await locals.db.select().from(s.inmovilizado).orderBy(asc(s.inmovilizado.fechaAlta));
	return {
		fecha,
		bienes: bienes
			.filter((b) => b.fechaAlta <= fecha)
			.map((b) => {
				const cuotas = asientosAmortizacion(b, fecha);
				const acumulada = cuotas.reduce((t, a) => t + a.apuntes[0].debe, 0);
				const delEjercicio = cuotas.filter((a) => a.fecha.startsWith(String(ejercicio))).reduce((t, a) => t + a.apuntes[0].debe, 0);
				const amortizable = b.valorCent - b.valorResidualCent;
				return { ...b, acumulada, delEjercicio, neto: b.valorCent - acumulada, avance: amortizable > 0 ? acumulada / amortizable : 1 };
			})
	};
};

const CUENTAS_VALIDAS: string[] = CUENTAS_INMOVILIZADO.map(([c]) => c);

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const valor = f.euros('valor');
		if (!valor || valor <= 0) throw new ErrorFormulario('Indica el valor (sin IVA)');
		const cuenta = f.texto('cuenta') ?? '213';
		const v = {
			nombre: f.obligatorio('nombre', 'nombre'),
			cuenta: CUENTAS_VALIDAS.includes(cuenta) ? cuenta : '213',
			fechaAlta: f.fecha('fechaAlta') ?? locals.hoy,
			valorCent: valor,
			valorResidualCent: f.euros('residual') ?? 0,
			vidaUtilMeses: Math.max(1, Math.round((f.decimal('vidaUtilAnios') ?? 10) * 12)),
			fechaBaja: f.fecha('fechaBaja'),
			notas: f.texto('notas')
		};
		if (v.valorResidualCent >= v.valorCent) throw new ErrorFormulario('El valor residual debe ser menor que el valor');
		if (id) await locals.db.update(s.inmovilizado).set(v).where(eq(s.inmovilizado.id, id));
		else await locals.db.insert(s.inmovilizado).values(v);
		return { mensaje: 'Bien guardado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		const id = leer(await request.formData()).id('id');
		const bien = await locals.db.select().from(s.inmovilizado).where(eq(s.inmovilizado.id, id)).get();
		// Si venía de un movimiento, éste vuelve a ser un gasto normal
		if (bien?.movimientoId) await locals.db.update(s.movimientos).set({ cuentaContable: null }).where(eq(s.movimientos.id, bien.movimientoId));
		await locals.db.delete(s.inmovilizado).where(eq(s.inmovilizado.id, id));
		return { mensaje: 'Bien borrado' };
	})
};
