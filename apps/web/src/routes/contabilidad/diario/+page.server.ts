import { cuadra, esFechaISO, type Apunte } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { corte, delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos, cuentas } = await libros(locals);
	const hasta = asientos.filter((a) => a.fecha <= corte(ejercicio, locals.hoy));
	const saldo = (p: string) => hasta.reduce((t, a) => t + a.apuntes.filter((x) => x.cuenta.startsWith(p)).reduce((s, x) => s + x.debe - x.haber, 0), 0);
	return {
		asientos: delEjercicio(asientos, ejercicio).reverse(),
		cuentas,
		pendiente: { iva: -saldo('4750'), socio: -saldo('551') }
	};
};

function leerApuntes(json: string | null): Apunte[] {
	let crudo: unknown;
	try {
		crudo = JSON.parse(json ?? '[]');
	} catch {
		throw new ErrorFormulario('Líneas mal formadas');
	}
	if (!Array.isArray(crudo)) throw new ErrorFormulario('Líneas mal formadas');
	const apuntes = crudo.map((l) => ({
		cuenta: String(l?.cuenta ?? '').trim(),
		debe: Math.round(Number(l?.debe) || 0),
		haber: Math.round(Number(l?.haber) || 0)
	}));
	for (const a of apuntes) {
		if (!/^\d{3,10}$/.test(a.cuenta)) throw new ErrorFormulario(`Cuenta no válida: «${a.cuenta}»`);
		if (a.debe < 0 || a.haber < 0 || (a.debe && a.haber)) throw new ErrorFormulario('Cada línea va al debe o al haber, en positivo');
	}
	if (!cuadra(apuntes)) throw new ErrorFormulario('El asiento no cuadra');
	return apuntes;
}

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const fecha = f.obligatorio('fecha', 'fecha');
		if (!esFechaISO(fecha)) throw new ErrorFormulario('Fecha no válida');
		const apuntes = leerApuntes(f.texto('apuntes'));
		const valores = { fecha, concepto: f.obligatorio('concepto', 'concepto'), notas: f.texto('notas') };
		let asientoId = id;
		if (id) {
			await locals.db.update(s.asientos).set(valores).where(eq(s.asientos.id, id));
			await locals.db.delete(s.apuntes).where(eq(s.apuntes.asientoId, id));
		} else {
			asientoId = (await locals.db.insert(s.asientos).values(valores).returning({ id: s.asientos.id }))[0].id;
		}
		await locals.db.insert(s.apuntes).values(apuntes.map((a, orden) => ({ asientoId: asientoId!, cuenta: a.cuenta, debeCent: a.debe, haberCent: a.haber, orden })));
		return { mensaje: id ? 'Asiento actualizado' : 'Asiento contabilizado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.asientos).where(eq(s.asientos.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Asiento borrado' };
	})
};
