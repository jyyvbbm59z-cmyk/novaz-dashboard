import { existencias } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { borrarAdjuntos, borrarAdjuntosDe } from '$lib/server/adjuntos';
import { accion, leer } from '$lib/server/form';
import { guardarArticulo, guardarRecuento, registrarStock } from '$lib/server/inventario';

const cantidadDe = (db: App.Locals['db']) => async (id: number) =>
	existencias(await db.select({ articuloId: s.stock.articuloId, cantidad: s.stock.cantidad }).from(s.stock).where(eq(s.stock.articuloId, id))).get(id) ?? 0;

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		const articuloId = await guardarArticulo(locals, fd);
		return { mensaje: nuevo ? 'Añadido al inventario' : 'Guardado', articuloId };
	}),
	stock: accion(async ({ request, locals }) => {
		await registrarStock(locals, await request.formData(), cantidadDe(locals.db));
		return { mensaje: 'Inventario actualizado' };
	}),
	recuento: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const lista = (k: string) => (f.texto(k) ?? '').split(',').map(Number).filter(Number.isInteger);
		await guardarRecuento(locals, lista('presentes'), lista('faltan'));
		return { mensaje: 'Recuento guardado', momento: 'cajaCuadrada' };
	}),
	borrar: accion(async ({ request, locals, platform }) => {
		const id = leer(await request.formData()).id('id');
		await borrarAdjuntosDe(locals.db, platform!.env.ARCHIVOS, 'articulo', id);
		await locals.db.delete(s.articulos).where(eq(s.articulos.id, id));
		return { mensaje: 'Borrado del inventario' };
	}),
	borrarAdjunto: accion(async ({ request, locals, platform }) => {
		await borrarAdjuntos(locals.db, platform!.env.ARCHIVOS, [leer(await request.formData()).id('id')]);
		return { mensaje: 'Archivo borrado' };
	})
};
