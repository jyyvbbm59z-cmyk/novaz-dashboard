import { sumasYSaldos } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos, cuentas } = await libros(locals);
	const saldos = Object.fromEntries(sumasYSaldos(delEjercicio(asientos, ejercicio)).map((x) => [x.cuenta, x.saldo]));
	const usadas = [...new Set(asientos.flatMap((a) => a.apuntes.map((p) => p.cuenta)))];
	return { cuentas, saldos, usadas };
};

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const original = f.texto('original');
		const codigo = f.obligatorio('codigo', 'código');
		if (!/^\d{1,10}$/.test(codigo)) throw new ErrorFormulario('El código es numérico (p. ej. 5720001)');
		const v = { codigo, nombre: f.obligatorio('nombre', 'nombre'), descripcion: f.texto('descripcion') };
		if (original) {
			if (original !== codigo) throw new ErrorFormulario('El código no se puede cambiar; crea una cuenta nueva');
			await locals.db.update(s.cuentas).set(v).where(eq(s.cuentas.codigo, original));
		} else {
			const existe = await locals.db.select().from(s.cuentas).where(eq(s.cuentas.codigo, codigo)).get();
			if (existe) throw new ErrorFormulario(`Ya existe la cuenta ${codigo}`);
			await locals.db.insert(s.cuentas).values(v);
		}
		return { mensaje: 'Cuenta guardada' };
	}),
	borrar: accion(async ({ request, locals }) => {
		const codigo = leer(await request.formData()).obligatorio('codigo');
		const { asientos } = await libros(locals);
		if (asientos.some((a) => a.apuntes.some((p) => p.cuenta === codigo))) throw new ErrorFormulario('La cuenta tiene movimientos: no se puede borrar');
		await locals.db.delete(s.cuentas).where(eq(s.cuentas.codigo, codigo));
		return { mensaje: 'Cuenta borrada' };
	})
};
