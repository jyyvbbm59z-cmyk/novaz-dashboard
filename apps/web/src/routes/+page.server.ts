import * as s from '@novaz/core/schema';
import { and, desc, eq, gte, inArray, like, sql } from 'drizzle-orm';
import { avanceRestauraciones } from '$lib/server/datos';
import { cargarInventario } from '$lib/server/inventario';
import { listaCompraAutomatica, ordenarTareasLocal } from '@novaz/core';

export const load = async ({ locals, parent }) => {
	const { db, hoy } = locals;
	const mes = hoy.slice(0, 7);
	const anio = hoy.slice(0, 4);

	const [restas, entradas, gastoMes, gastoAnio, porCategoria] = await Promise.all([
		db
			.select({ r: s.restauraciones, vehiculo: s.vehiculos.alias, portada: s.adjuntos.clave })
			.from(s.restauraciones)
			.innerJoin(s.vehiculos, eq(s.restauraciones.vehiculoId, s.vehiculos.id))
			.leftJoin(s.adjuntos, eq(s.vehiculos.portadaId, s.adjuntos.id))
			.where(inArray(s.restauraciones.estado, ['en_curso', 'pausada', 'planificada']))
			.orderBy(desc(s.restauraciones.fechaInicio)),
		db
			.select({ e: s.entradas, vehiculo: s.vehiculos.alias })
			.from(s.entradas)
			.innerJoin(s.vehiculos, eq(s.entradas.vehiculoId, s.vehiculos.id))
			.orderBy(desc(s.entradas.fecha), desc(s.entradas.id))
			.limit(6),
		db
			.select({ total: sql<number>`coalesce(sum(${s.movimientos.importeCent}), 0)` })
			.from(s.movimientos)
			.where(and(eq(s.movimientos.tipo, 'gasto'), like(s.movimientos.fecha, `${mes}%`))),
		db
			.select({ total: sql<number>`coalesce(sum(${s.movimientos.importeCent}), 0)` })
			.from(s.movimientos)
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.fecha, `${anio}-01-01`))),
		db
			.select({ nombre: s.categorias.nombre, color: s.categorias.color, total: sql<number>`sum(${s.movimientos.importeCent})` })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.fecha, `${anio}-01-01`)))
			.groupBy(s.movimientos.categoriaId)
			.orderBy(desc(sql`sum(${s.movimientos.importeCent})`))
			.limit(5)
	]);

	const avances = await avanceRestauraciones(db, restas.map((x) => x.r.id));

	// El local, la lista de la compra y las herramientas fuera de su sitio
	const { alertas } = await parent();
	const [tareas, planes, inventario, manual] = await Promise.all([
		db.select().from(s.tareasLocal).where(inArray(s.tareasLocal.estado, ['pendiente', 'en_curso'])),
		db.select({ id: s.planesMantenimiento.id, codigo: s.planesMantenimiento.codigo, nombre: s.planesMantenimiento.nombre, tareas: s.planesMantenimiento.tareas }).from(s.planesMantenimiento),
		cargarInventario(db),
		db.select({ id: s.listaCompra.id }).from(s.listaCompra).where(eq(s.listaCompra.comprado, false))
	]);
	const revisiones = alertas
		.filter((a) => a.tipo === 'mantenimiento' && a.planId != null)
		.map((a) => {
			const p = planes.find((x) => x.id === a.planId)!;
			return { vehiculoId: a.vehiculoId, vehiculo: a.vehiculo, codigo: p.codigo, nombre: p.nombre, tareas: p.tareas, nivel: a.nivel, dias: a.dias };
		});
	const taller = {
		local: ordenarTareasLocal(tareas, hoy).slice(0, 3),
		localTotal: tareas.length,
		compras: listaCompraAutomatica(inventario, revisiones).length + manual.length,
		fueraDeSitio: inventario.filter((a) => a.tipo === 'herramienta' && (a.estado === 'perdida' || a.estado === 'prestada')).length
	};
	return {
		taller,
		restauraciones: restas.map((x) => {
			const a = avances.get(x.r.id);
			return { ...x.r, vehiculo: x.vehiculo, portada: x.portada, avance: a && a.total ? a.hechas / a.total : 0 };
		}),
		entradas: entradas.map((x) => ({ ...x.e, vehiculo: x.vehiculo })),
		gasto: {
			mes: Number(gastoMes[0]?.total ?? 0),
			anio: Number(gastoAnio[0]?.total ?? 0),
			categorias: porCategoria.map((c) => ({ nombre: c.nombre ?? 'Sin categoría', color: c.color ?? '#6c727c', total: Number(c.total) }))
		}
	};
};
