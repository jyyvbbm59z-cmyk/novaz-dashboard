import { cargarAlertas, listaCompraAutomatica } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc, eq, inArray } from 'drizzle-orm';
import { accion, leer } from '$lib/server/form';
import { guardarMovimiento } from '$lib/server/acciones';
import { cargarInventario, registrarStock } from '$lib/server/inventario';

export const load = async ({ locals }) => {
	const articulos = await cargarInventario(locals.db);
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
	// De dónde viene cada cosa: una avería de un vehículo o una tarea del local
	const [pends, tareas] = await Promise.all([
		locals.db
			.select({ id: s.pendientes.id, titulo: s.pendientes.titulo, vehiculoId: s.pendientes.vehiculoId, vehiculo: s.vehiculos.alias })
			.from(s.pendientes)
			.innerJoin(s.vehiculos, eq(s.pendientes.vehiculoId, s.vehiculos.id))
			.where(inArray(s.pendientes.id, [0, ...manual.map((m) => m.pendienteId ?? 0)])),
		locals.db
			.select({ id: s.tareasLocal.id, titulo: s.tareasLocal.titulo })
			.from(s.tareasLocal)
			.where(inArray(s.tareasLocal.id, [0, ...manual.map((m) => m.tareaLocalId ?? 0)]))
	]);
	const origenes: { clave: string; titulo: string; detalle: string; href: string }[] = [
		...pends.map((p) => ({ clave: `p${p.id}`, titulo: p.titulo, detalle: `${p.vehiculo} · avería`, href: `/flota/${p.vehiculoId}?pestana=historial` })),
		...tareas.map((t) => ({ clave: `t${t.id}`, titulo: t.titulo, detalle: 'El local', href: '/local' }))
	];
	return { automaticos: listaCompraAutomatica(articulos, revisiones), manual, origenes };
};

/** Marca algo como comprado: suma al inventario (creando el artículo si no existe) y apunta el gasto. */
async function comprar(locals: App.Locals, fd: FormData) {
	const f = leer(fd);
	const itemId = f.idOpcional('itemId');
	const item = itemId ? await locals.db.select().from(s.listaCompra).where(eq(s.listaCompra.id, itemId)).get() : null;
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
		// Va directo a su sitio (la moto de la avería, la tarea del local…) sin pasar por el inventario
		const cats = await locals.db.select().from(s.categorias).where(eq(s.categorias.tipo, 'gasto'));
		const cat = item?.tareaLocalId ? cats.find((c) => /local/i.test(c.nombre)) : item?.pendienteId || f.idOpcional('vehiculoId') ? cats.find((c) => /recambio/i.test(c.nombre)) : null;
		const datos = new FormData();
		datos.set('tipo', 'gasto');
		datos.set('importe', fd.get('importe') as string);
		datos.set('concepto', f.obligatorio('texto', 'qué'));
		if (cat) datos.set('categoriaId', String(cat.id));
		const proveedor = f.texto('proveedor');
		if (proveedor) datos.set('proveedor', proveedor);
		const movId = await guardarMovimiento(locals, datos, { vehiculoId: item?.vehiculoId ?? f.idOpcional('vehiculoId') });
		if (item?.tareaLocalId) await locals.db.update(s.movimientos).set({ tareaLocalId: item.tareaLocalId }).where(eq(s.movimientos.id, movId));
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
