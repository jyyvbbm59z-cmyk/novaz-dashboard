import { cargarAlertas, listaCompraAutomatica, separarPrecio } from '@novaz/core';
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
			.select({ id: s.pendientes.id, titulo: s.pendientes.titulo, tipo: s.pendientes.tipo, presupuesto: s.pendientes.presupuestoCent, vehiculoId: s.pendientes.vehiculoId, vehiculo: s.vehiculos.alias })
			.from(s.pendientes)
			.innerJoin(s.vehiculos, eq(s.pendientes.vehiculoId, s.vehiculos.id))
			.where(inArray(s.pendientes.id, [0, ...manual.map((m) => m.pendienteId ?? 0)])),
		locals.db
			.select({ id: s.tareasLocal.id, titulo: s.tareasLocal.titulo })
			.from(s.tareasLocal)
			.where(inArray(s.tareasLocal.id, [0, ...manual.map((m) => m.tareaLocalId ?? 0)]))
	]);
	// Cada grupo enlaza a su origen exacto (la tarjeta de la mejora, avería o tarea) para ver el contexto y editarlo
	const origenes: { clave: string; titulo: string; detalle: string; href: string; presupuesto: number | null }[] = [
		...pends.map((p) => ({ clave: `p${p.id}`, titulo: p.titulo, detalle: `${p.vehiculo} · ${p.tipo === 'mejora' ? 'mejora' : 'avería'}`, href: `/flota/${p.vehiculoId}?pestana=historial#pend-${p.id}`, presupuesto: p.presupuesto })),
		...tareas.map((t) => ({ clave: `t${t.id}`, titulo: t.titulo, detalle: 'El local', href: `/local#tarea-${t.id}`, presupuesto: null }))
	];
	// Lo automático: el precio de la última compra del artículo (por la cantidad que toca)
	const automaticos = listaCompraAutomatica(articulos, revisiones).map((i) => {
		const a = i.articuloId ? articulos.find((x) => x.id === i.articuloId) : null;
		return {
			...i,
			precioEstimadoCent: a?.valorCent ? Math.round(a.valorCent * (i.cantidad && i.cantidad > 0 ? i.cantidad : 1)) : null,
			href: i.motivo === 'revision' && i.vehiculoId ? `/flota/${i.vehiculoId}?pestana=mantenimiento` : '/inventario/reserva'
		};
	});
	return { automaticos, manual, origenes };
};

/** Marca algo como comprado: suma al inventario (creando el artículo si no existe) y apunta el gasto. */
async function comprar(locals: App.Locals, fd: FormData): Promise<number | null> {
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
		return await registrarStock(locals, datos, async () => 0);
	} else if (f.euros('importe')) {
		// Va directo a su sitio (la moto de la avería, la tarea del local…) sin pasar por el inventario
		const cats = await locals.db.select().from(s.categorias).where(eq(s.categorias.tipo, 'gasto'));
		// Para una tarea del local: su categoría según sea mantenimiento o reforma (inversión)
		const tarea = item?.tareaLocalId ? await locals.db.select({ tipo: s.tareasLocal.tipo }).from(s.tareasLocal).where(eq(s.tareasLocal.id, item.tareaLocalId)).get() : null;
		const cat = tarea
			? (tarea.tipo === 'reforma' ? cats.find((c) => /reforma/i.test(c.nombre)) : null) ?? cats.find((c) => /mantenimiento del local/i.test(c.nombre))
			: item?.pendienteId || f.idOpcional('vehiculoId')
				? cats.find((c) => /recambio/i.test(c.nombre))
				: null;
		const datos = new FormData();
		datos.set('tipo', 'gasto');
		datos.set('importe', fd.get('importe') as string);
		datos.set('concepto', f.obligatorio('texto', 'qué'));
		const fecha = f.fecha('fecha');
		if (fecha) datos.set('fecha', fecha);
		const notas = f.texto('notas');
		if (notas) datos.set('notas', notas);
		if (cat) datos.set('categoriaId', String(cat.id));
		const proveedor = f.texto('proveedor');
		if (proveedor) datos.set('proveedor', proveedor);
		const movId = await guardarMovimiento(locals, datos, { vehiculoId: item?.vehiculoId ?? f.idOpcional('vehiculoId') });
		if (item?.tareaLocalId) await locals.db.update(s.movimientos).set({ tareaLocalId: item.tareaLocalId }).where(eq(s.movimientos.id, movId));
		return movId;
	}
	return null;
}

export const actions = {
	anadir: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		// También aquí el precio puede ir al final: «Lija de 400 · 6 €»
		const { texto, precioCent } = separarPrecio(f.obligatorio('texto', 'qué comprar'));
		await locals.db.insert(s.listaCompra).values({ texto, cantidad: f.decimal('cantidad'), unidad: f.texto('unidad'), precioEstimadoCent: precioCent });
		return {};
	}),
	editar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		await locals.db
			.update(s.listaCompra)
			.set({ texto: f.obligatorio('texto', 'qué comprar'), cantidad: f.decimal('cantidad'), unidad: f.texto('unidad'), precioEstimadoCent: f.euros('precioEstimado') })
			.where(eq(s.listaCompra.id, f.id('id')));
		return { mensaje: 'Guardado' };
	}),
	comprado: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const movimientoId = await comprar(locals, fd);
		const id = leer(fd).idOpcional('itemId');
		if (id) await locals.db.update(s.listaCompra).set({ comprado: true }).where(eq(s.listaCompra.id, id));
		return { mensaje: 'Comprado', momento: 'tareaHecha', movimientoId };
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
