import { flujoDeCaja } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { guardarMovimiento } from '$lib/server/acciones';
import { ejercicioDeUrl, libros } from '$lib/server/contabilidad';
import { estadoTesoreria } from '$lib/server/tesoreria';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos } = await libros(locals);
	return { ...(await estadoTesoreria(locals, asientos)), flujo: flujoDeCaja(asientos, ejercicio) };
};

export const actions = {
	cuadrar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const real = f.euros('saldoReal');
		if (real == null) throw new ErrorFormulario('Escribe el saldo que ves en tu banco');
		const cuenta = f.texto('cuenta') === '570' ? '570' : '572';
		const { asientos } = await libros(locals);
		const libro = asientos.filter((a) => a.fecha <= locals.hoy).reduce((t, a) => t + a.apuntes.filter((p) => p.cuenta === cuenta).reduce((x, p) => x + p.debe - p.haber, 0), 0);
		const diferencia = real - libro;
		const como = f.texto('como');
		if (diferencia !== 0 && como) {
			const fd = new FormData();
			const pago = cuenta === '570' ? 'caja' : 'banco';
			fd.set('importe', String(Math.abs(diferencia) / 100).replace('.', ','));
			fd.set('fecha', locals.hoy);
			fd.set('pago', pago);
			fd.set('ivaPct', '0');
			fd.set('notas', `Ajuste para cuadrar con el saldo real (${(real / 100).toFixed(2)} €)`);
			if (diferencia < 0) {
				fd.set('tipo', 'gasto');
				fd.set('cuentaContable', como === 'otros' ? '678' : '626');
				fd.set('concepto', como === 'otros' ? 'Descuadre de caja' : 'Comisiones y cargos sin apuntar');
			} else if (como === 'aportacion') {
				fd.set('tipo', 'aportacion');
				fd.set('cuentaContable', '118');
				fd.set('concepto', 'Aportación sin apuntar');
			} else {
				fd.set('tipo', 'ingreso');
				fd.set('cuentaContable', '759');
				fd.set('concepto', 'Ingreso sin identificar');
			}
			await guardarMovimiento(locals, fd);
		}
		if (diferencia === 0 || como) {
			await locals.db
				.insert(s.ajustes)
				.values({ clave: 'ultimoCuadre', valor: locals.hoy })
				.onConflictDoUpdate({ target: s.ajustes.clave, set: { valor: locals.hoy } });
		}
		return diferencia === 0 || como
			? { mensaje: '¡Cuadrado con el banco!', momento: 'cajaCuadrada', diferencia: 0 }
			: { diferencia };
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
