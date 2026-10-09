import * as s from '@novaz/core/schema';
import { count, eq } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { ICONOS_VALIDOS } from '$lib/server/iconos';

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const f = leer(fd);
		const id = f.idOpcional('id');
		const avisos = (f.texto('avisosDias') ?? '')
			.split(/[,\s]+/)
			.map(Number)
			.filter((n) => Number.isInteger(n) && n >= 0);
		const icono = f.texto('icono') ?? 'calendar-clock';
		const v = {
			nombre: f.obligatorio('nombre', 'nombre'),
			icono: ICONOS_VALIDOS.includes(icono) ? icono : 'calendar-clock',
			mesesValidez: f.entero('mesesValidez'),
			avisosDias: [...new Set(avisos)].sort((a, b) => b - a),
			tiposVehiculoIds: f.lista('tiposVehiculoIds').map(Number),
			categoriaId: f.idOpcional('categoriaId'),
			orden: f.entero('orden') ?? 0,
			activo: f.bool('activo')
		};
		if (id) await locals.db.update(s.tiposVencimiento).set(v).where(eq(s.tiposVencimiento.id, id));
		else await locals.db.insert(s.tiposVencimiento).values(v);
		return { mensaje: 'Guardado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		const id = leer(await request.formData()).id('id');
		const u = await locals.db.select({ n: count() }).from(s.vencimientos).where(eq(s.vencimientos.tipoId, id)).get();
		if (u?.n) throw new ErrorFormulario(`Tiene ${u.n} registros. Desactívalo en lugar de borrarlo.`);
		await locals.db.delete(s.tiposVencimiento).where(eq(s.tiposVencimiento.id, id));
		return { mensaje: 'Borrado' };
	})
};
