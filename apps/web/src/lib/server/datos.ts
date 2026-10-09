import {
	compararNivel,
	kmActual,
	lecturasPorVehiculo,
	peorNivel,
	type Alerta,
	type DB,
	type Nivel
} from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

export async function catalogos(db: DB) {
	const [tipos, estados, categorias, tiposVencimiento, contactos, plantillas] = await db.batch([
		db.select().from(s.tiposVehiculo).orderBy(asc(s.tiposVehiculo.orden), asc(s.tiposVehiculo.nombre)),
		db.select().from(s.estados).orderBy(asc(s.estados.orden)),
		db.select().from(s.categorias).orderBy(asc(s.categorias.tipo), asc(s.categorias.orden)),
		db.select().from(s.tiposVencimiento).orderBy(asc(s.tiposVencimiento.orden)),
		db.select().from(s.contactos).orderBy(asc(s.contactos.nombre)),
		db.select().from(s.plantillasFases).orderBy(asc(s.plantillasFases.nombre))
	]);
	return { tipos, estados, categorias, tiposVencimiento, contactos, plantillas };
}
export type Catalogos = Awaited<ReturnType<typeof catalogos>>;

/** Registra una lectura de km si aporta algo (evita duplicados del mismo día con el mismo km). */
export async function registrarKm(db: DB, vehiculoId: number, fecha: string, km: number | null, origen: 'manual' | 'entrada' = 'manual') {
	if (km == null || km < 0) return;
	const existe = await db
		.select({ id: s.lecturasKm.id })
		.from(s.lecturasKm)
		.where(and(eq(s.lecturasKm.vehiculoId, vehiculoId), eq(s.lecturasKm.fecha, fecha), eq(s.lecturasKm.km, km)))
		.get();
	if (!existe) await db.insert(s.lecturasKm).values({ vehiculoId, fecha, km, origen });
}

export interface ResumenVehiculo {
	id: number;
	alias: string;
	marca: string | null;
	modelo: string | null;
	anio: number | null;
	matricula: string | null;
	propietario: 'novaz' | 'tercero';
	tipoId: number;
	estadoId: number | null;
	contacto: string | null;
	portada: string | null;
	km: number | null;
	nivel: Nivel;
	alertas: number;
	restauracion: { id: number; nombre: string; avance: number } | null;
}

/** Progreso (0–1) de una restauración por tareas hechas. */
export async function avanceRestauraciones(db: DB, ids: number[]) {
	const mapa = new Map<number, { total: number; hechas: number }>();
	if (!ids.length) return mapa;
	const filas = await db
		.select({
			restauracionId: s.fases.restauracionId,
			total: sql<number>`count(${s.tareas.id})`,
			hechas: sql<number>`coalesce(sum(${s.tareas.hecha}), 0)`
		})
		.from(s.fases)
		.leftJoin(s.tareas, eq(s.tareas.faseId, s.fases.id))
		.where(inArray(s.fases.restauracionId, ids))
		.groupBy(s.fases.restauracionId);
	for (const f of filas) mapa.set(f.restauracionId, { total: Number(f.total), hechas: Number(f.hechas) });
	return mapa;
}

export async function resumenVehiculos(db: DB, alertas: Alerta[]): Promise<ResumenVehiculo[]> {
	const filas = await db
		.select({ v: s.vehiculos, contacto: s.contactos.nombre, portada: s.adjuntos.clave })
		.from(s.vehiculos)
		.leftJoin(s.contactos, eq(s.vehiculos.contactoId, s.contactos.id))
		.leftJoin(s.adjuntos, eq(s.vehiculos.portadaId, s.adjuntos.id))
		.orderBy(asc(s.vehiculos.alias));
	const ids = filas.map((f) => f.v.id);
	const lecturas = await lecturasPorVehiculo(db, ids);

	const restas = ids.length
		? await db
				.select({ id: s.restauraciones.id, vehiculoId: s.restauraciones.vehiculoId, nombre: s.restauraciones.nombre })
				.from(s.restauraciones)
				.where(and(inArray(s.restauraciones.vehiculoId, ids), inArray(s.restauraciones.estado, ['en_curso', 'planificada', 'pausada'])))
		: [];
	const avances = await avanceRestauraciones(db, restas.map((r) => r.id));

	return filas.map(({ v, contacto, portada }) => {
		const propias = alertas.filter((a) => a.vehiculoId === v.id && a.nivel !== 'ok');
		const r = restas.find((x) => x.vehiculoId === v.id);
		const av = r ? avances.get(r.id) : null;
		return {
			id: v.id,
			alias: v.alias,
			marca: v.marca,
			modelo: v.modelo,
			anio: v.anio,
			matricula: v.matricula,
			propietario: v.propietario,
			tipoId: v.tipoId,
			estadoId: v.estadoId,
			contacto,
			portada,
			km: kmActual(lecturas.get(v.id) ?? []),
			nivel: peorNivel(...propias.map((a) => a.nivel)),
			alertas: propias.length,
			restauracion: r ? { id: r.id, nombre: r.nombre, avance: av && av.total ? av.hechas / av.total : 0 } : null
		};
	});
}

export function ordenarPorNivel<T extends { nivel: Nivel }>(xs: T[]) {
	return [...xs].sort((a, b) => compararNivel(a.nivel, b.nivel));
}

export async function totalesDinero(db: DB, filtro: ReturnType<typeof and> | undefined) {
	const filas = await db
		.select({ tipo: s.movimientos.tipo, total: sql<number>`coalesce(sum(${s.movimientos.importeCent}), 0)` })
		.from(s.movimientos)
		.where(filtro)
		.groupBy(s.movimientos.tipo);
	const gasto = Number(filas.find((f) => f.tipo === 'gasto')?.total ?? 0);
	const ingreso = Number(filas.find((f) => f.tipo === 'ingreso')?.total ?? 0);
	return { gasto, ingreso };
}

