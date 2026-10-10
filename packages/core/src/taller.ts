// Estado del taller (el local, compras, herramientas, obras): lo comparten el inicio y el parte diario.
import { eq, inArray } from 'drizzle-orm';
import type { Alerta, DB } from './consultas';
import { existencias, listaCompraAutomatica, ordenarTareasLocal } from './inventario';
import * as s from './schema';

export async function estadoTaller(db: DB, hoy: string, alertas: Alerta[]) {
	const [tareas, planes, articulos, movs, manual, obras] = await Promise.all([
		db.select().from(s.tareasLocal).where(inArray(s.tareasLocal.estado, ['pendiente', 'en_curso'])),
		db.select({ id: s.planesMantenimiento.id, codigo: s.planesMantenimiento.codigo, nombre: s.planesMantenimiento.nombre, tareas: s.planesMantenimiento.tareas }).from(s.planesMantenimiento),
		db.select().from(s.articulos),
		db.select({ articuloId: s.stock.articuloId, cantidad: s.stock.cantidad }).from(s.stock),
		db.select({ id: s.listaCompra.id }).from(s.listaCompra).where(eq(s.listaCompra.comprado, false)),
		db.select({ id: s.restauraciones.id, nombre: s.restauraciones.nombre }).from(s.restauraciones).where(inArray(s.restauraciones.estado, ['en_curso', 'pausada']))
	]);
	const cant = existencias(movs);
	const inventario = articulos.map((a) => ({ ...a, cantidad: cant.get(a.id) ?? 0 }));
	const revisiones = alertas
		.filter((a) => a.tipo === 'mantenimiento' && a.planId != null)
		.flatMap((a) => {
			const p = planes.find((x) => x.id === a.planId);
			return p ? [{ vehiculoId: a.vehiculoId, vehiculo: a.vehiculo, codigo: p.codigo, nombre: p.nombre, tareas: p.tareas, nivel: a.nivel, dias: a.dias }] : [];
		});

	// Avance de cada obra: tareas hechas / totales
	const fases = obras.length ? await db.select({ id: s.fases.id, restauracionId: s.fases.restauracionId }).from(s.fases).where(inArray(s.fases.restauracionId, obras.map((o) => o.id))) : [];
	const tareasObra = fases.length ? await db.select({ faseId: s.tareas.faseId, hecha: s.tareas.hecha }).from(s.tareas).where(inArray(s.tareas.faseId, fases.map((f) => f.id))) : [];
	const obraDeFase = new Map(fases.map((f) => [f.id, f.restauracionId]));

	return {
		/** Tareas abiertas del local, de la más urgente a la menos. */
		local: ordenarTareasLocal(tareas, hoy),
		compras: listaCompraAutomatica(inventario, revisiones).length + manual.length,
		fueraDeSitio: inventario.filter((a) => a.tipo === 'herramienta' && (a.estado === 'perdida' || a.estado === 'prestada')).length,
		obras: obras.map((o) => {
			const ts = tareasObra.filter((t) => obraDeFase.get(t.faseId) === o.id);
			return { nombre: o.nombre, avance: ts.length ? ts.filter((t) => t.hecha).length / ts.length : 0 };
		})
	};
}
