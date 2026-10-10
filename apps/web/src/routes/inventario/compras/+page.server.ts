import { cargarAlertas, listaCompraAutomatica } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc, eq } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { registrarStock } from '$lib/server/inventario';

export const load = async ({ locals, parent }) => {
	const { articulos } = await parent();
	const [alertas, planes, manual] = await Promise.all([
		cargarAlertas(locals.db, { hoy: locals.hoy, urgenteDias: locals.ajustes.urgenteDias, incluirOk: true }),
		locals.db.select({ id: s.planesMantenimiento.id, codigo: s.planesMantenimiento.codigo, nombre: s.planesMantenimiento.nombre, tareas: s.planesMantenimiento.tareas }).from(s.planesMantenimiento),
		locals.db.select().from(s.listaCompra).orderBy(asc(s.listaCompra.comprado), asc(s.listaCompra.id))
	]);
	const revisiones = alertas
		.filter((a) => a.tipo === 'mantenimiento' && a.planId != null)
		.map((a) => {
			const p = planes.find((x) => x.id === a.planId)!;
			return { vehiculoId: a.vehiculoId, vehiculo: a.vehiculo, codigo: p.codigo, nombre: p.nombre, tareas: p.tareas, nivel: a.nivel, dias: a.dias };
		});
	return { automaticos: listaCompraAutomatica(articulos, revisiones), manual };
};

/** Marca algo como comprado: suma al inventario (creando el artículo si no existe) y apunta el gasto. */
async function comprar(locals: App.Locals, fd: FormData) {
	const f = leer(fd);
	let articuloId = f.idOpcional('articuloId');
	if (!articuloId && f.bool('alInventario')) {
		const vehiculoId = f.idOpcional('vehiculoId');
		const [a] = await locals.db
			.insert(s.articulos)
			.values({ tipo: f.texto('tipoArticulo') === 'consumible' ? 'consumible' : 'recambio', nombre: f.obligatorio('texto', 'qué'), unidad: f.texto('unidad') ?? 'ud', vehiculoIds: vehiculoId ? [vehiculoId] : [] })
			.returning({ id: s.articulos.id });
		articuloId = a.id;
	}
	if (articuloId) {
		const datos = new FormData();
		for (const [k, v] of fd.entries()) datos.set(k, v);
		datos.set('articuloId', String(articuloId));
		datos.set('motivo', 'compra');
		if (!datos.get('cantidad')) datos.set('cantidad', '1');
		await registrarStock(locals, datos, async () => 0);
	} else if (f.euros('importe')) {
		throw new ErrorFormulario('Para apuntar el gasto, marca «Añadir al inventario» o regístralo en Dinero');
	}
}

export const actions = {
	anadir: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		await locals.db.insert(s.listaCompra).values({ texto: f.obligatorio('texto', 'qué comprar'), cantidad: f.decimal('cantidad'), unidad: f.texto('unidad') });
		return {};
	}),
	comprado: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		await comprar(locals, fd);
		const id = leer(fd).idOpcional('itemId');
		if (id) await locals.db.update(s.listaCompra).set({ comprado: true }).where(eq(s.listaCompra.id, id));
		return { mensaje: 'Comprado', momento: 'tareaHecha' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.listaCompra).where(eq(s.listaCompra.id, leer(await request.formData()).id('id')));
		return {};
	}),
	limpiar: accion(async ({ locals }) => {
		await locals.db.delete(s.listaCompra).where(eq(s.listaCompra.comprado, true));
		return { mensaje: 'Lista limpia' };
	})
};
