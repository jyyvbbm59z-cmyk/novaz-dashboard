import { materializarRecurrentes, operacion } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc, eq } from 'drizzle-orm';
import { guardarMovimiento } from '$lib/server/acciones';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals }) => ({
	cuentas: await locals.db.select().from(s.cuentas).orderBy(asc(s.cuentas.codigo))
});

export const actions = {
	registrar: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const f = leer(fd);
		const op = operacion(f.obligatorio('operacion', 'operación'));
		if (!op) throw new ErrorFormulario('Operación desconocida');

		// Categoría por nombre (la del catálogo), del mismo tipo
		const cats = await locals.db.select().from(s.categorias);
		const cat = op.categoria
			? cats.find((c) => c.tipo === op.tipo && c.nombre.toLowerCase().startsWith(op.categoria!.toLowerCase()))
			: undefined;

		const datos = new FormData();
		const copiar = (k: string) => {
			const v = fd.get(k);
			if (typeof v === 'string' && v !== '') datos.set(k, v);
		};
		['importe', 'fecha', 'concepto', 'proveedor', 'ivaPct', 'pago', 'vehiculoId', 'notas', 'vidaUtilAnios'].forEach(copiar);
		datos.set('tipo', op.tipo);
		if (cat) datos.set('categoriaId', String(cat.id));
		if (op.inmovilizado) {
			datos.set('inmovilizado', 'on');
			datos.set('cuentaInmovilizado', op.inmovilizado.cuenta);
		} else if (!cat || cat.cuentaContable !== op.cuenta) {
			datos.set('cuentaContable', op.cuenta);
		}
		const movimientoId = await guardarMovimiento(locals, datos);

		if (f.bool('mensual')) {
			const m = await locals.db.select().from(s.movimientos).where(eq(s.movimientos.id, movimientoId)).get();
			if (m) {
				const [r] = await locals.db
					.insert(s.recurrentes)
					.values({
						concepto: m.concepto,
						tipo: m.tipo,
						importeCent: m.importeCent,
						ivaPct: m.ivaPct,
						pago: m.pago,
						cuentaContable: m.cuentaContable,
						categoriaId: m.categoriaId,
						proveedor: m.proveedor,
						dia: Math.min(Math.max(f.entero('dia') ?? Number(m.fecha.slice(8, 10)), 1), 31),
						desde: m.fecha,
						hasta: f.fecha('hasta'),
						ultimaGenerada: m.fecha
					})
					.returning({ id: s.recurrentes.id });
				await locals.db.update(s.movimientos).set({ recurrenteId: r.id }).where(eq(s.movimientos.id, movimientoId));
				// Si la fecha era pasada, apunta ya los meses atrasados
				await materializarRecurrentes(locals.db, locals.hoy);
			}
		}
		return { mensaje: 'Apuntado', movimientoId };
	})
};
