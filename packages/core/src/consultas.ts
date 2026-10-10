// Consultas compartidas entre la app web y el worker de avisos.
import { and, desc, eq, inArray } from 'drizzle-orm';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import { fusionarAjustes, type Ajustes } from './ajustes';
import {
	compararNivel,
	estadoMantenimiento,
	estadoVencimiento,
	kmActual,
	lecturasValidas,
	planAplica,
	ritmoKmDia,
	tienePlanesPropios,
	type Lectura,
	type Nivel
} from './alertas';
import { fechaLarga } from './fechas';

export type DB = DrizzleD1Database<typeof schema>;

export function crearDb(d1: Parameters<typeof drizzle>[0]): DB {
	return drizzle(d1, { schema });
}

export async function leerAjustes(db: DB): Promise<Ajustes> {
	return fusionarAjustes(await db.select().from(schema.ajustes));
}

export interface Alerta {
	clave: string;
	tipo: 'vencimiento' | 'mantenimiento' | 'pendiente';
	vehiculoId: number;
	vehiculo: string;
	matricula: string | null;
	titulo: string;
	detalle: string;
	nivel: Nivel;
	dias: number | null;
	kmRestantes: number | null;
	/** Umbrales de aviso (días) para Telegram. */
	avisosDias: number[];
	/** Cambia cuando se renueva/realiza, para no repetir avisos de un ciclo anterior. */
	ciclo: string;
	/** Plan de mantenimiento del que sale (solo tipo 'mantenimiento'). */
	planId?: number;
}

/** Vehículos activos: los que no están en un estado final (vendido, entregado…). */
export async function vehiculosActivos(db: DB) {
	const filas = await db
		.select({ v: schema.vehiculos, final: schema.estados.final })
		.from(schema.vehiculos)
		.leftJoin(schema.estados, eq(schema.vehiculos.estadoId, schema.estados.id));
	return filas.filter((f) => !f.final).map((f) => f.v);
}

export async function lecturasPorVehiculo(db: DB, ids: number[]): Promise<Map<number, Lectura[]>> {
	const mapa = new Map<number, Lectura[]>();
	if (!ids.length) return mapa;
	const filas = await db
		.select({ vehiculoId: schema.lecturasKm.vehiculoId, fecha: schema.lecturasKm.fecha, km: schema.lecturasKm.km })
		.from(schema.lecturasKm)
		.where(inArray(schema.lecturasKm.vehiculoId, ids));
	for (const f of filas) {
		const l = mapa.get(f.vehiculoId) ?? [];
		l.push({ fecha: f.fecha, km: f.km });
		mapa.set(f.vehiculoId, l);
	}
	return mapa;
}

/** Última realización de cada plan por vehículo: clave `${vehiculoId}:${planId}`. */
export async function ultimasPorPlan(db: DB, ids: number[]) {
	const mapa = new Map<string, { id: number; fecha: string; km: number | null }>();
	if (!ids.length) return mapa;
	const filas = await db
		.select({
			id: schema.entradas.id,
			vehiculoId: schema.entradas.vehiculoId,
			planId: schema.entradasPlanes.planId,
			fecha: schema.entradas.fecha,
			km: schema.entradas.km
		})
		.from(schema.entradasPlanes)
		.innerJoin(schema.entradas, eq(schema.entradasPlanes.entradaId, schema.entradas.id))
		.where(inArray(schema.entradas.vehiculoId, ids))
		.orderBy(desc(schema.entradas.fecha), desc(schema.entradas.id));
	for (const f of filas) {
		const k = `${f.vehiculoId}:${f.planId}`;
		if (!mapa.has(k)) mapa.set(k, { id: f.id, fecha: f.fecha, km: f.km });
	}
	return mapa;
}

export async function cargarAlertas(
	db: DB,
	opts: { hoy: string; urgenteDias: number; vehiculoId?: number; incluirOk?: boolean }
): Promise<Alerta[]> {
	let vehiculos = await vehiculosActivos(db);
	if (opts.vehiculoId != null) vehiculos = vehiculos.filter((v) => v.id === opts.vehiculoId);
	if (!vehiculos.length) return [];
	const ids = vehiculos.map((v) => v.id);
	const porId = new Map(vehiculos.map((v) => [v.id, v]));
	const alertas: Alerta[] = [];
	// En restauración no se circula: ni papeles ni revisiones avisan hasta que vuelva a la calle (las averías sí)
	const estadosObra = new Set(
		(await db.select({ id: schema.estados.id, nombre: schema.estados.nombre }).from(schema.estados)).filter((e) => /restaur/i.test(e.nombre)).map((e) => e.id)
	);
	const enObra = new Set(vehiculos.filter((v) => v.estadoId != null && estadosObra.has(v.estadoId)).map((v) => v.id));

	// Vencimientos vigentes
	const vencs = await db
		.select({ v: schema.vencimientos, tipo: schema.tiposVencimiento })
		.from(schema.vencimientos)
		.innerJoin(schema.tiposVencimiento, eq(schema.vencimientos.tipoId, schema.tiposVencimiento.id))
		.where(and(eq(schema.vencimientos.estado, 'vigente'), inArray(schema.vencimientos.vehiculoId, ids)));

	for (const { v, tipo } of vencs) {
		if (enObra.has(v.vehiculoId)) continue;
		const veh = porId.get(v.vehiculoId)!;
		const { dias, nivel } = estadoVencimiento(v.fechaVence, opts.hoy, tipo.avisosDias, opts.urgenteDias);
		alertas.push({
			clave: `venc:${v.id}`,
			tipo: 'vencimiento',
			vehiculoId: veh.id,
			vehiculo: veh.alias,
			matricula: veh.matricula,
			titulo: tipo.nombre,
			detalle: `${dias < 0 ? 'venció' : 'vence'} el ${fechaLarga(v.fechaVence)}`,
			nivel,
			dias,
			kmRestantes: null,
			avisosDias: tipo.avisosDias,
			ciclo: v.fechaVence
		});
	}

	// Mantenimientos
	const planes = await db.select().from(schema.planesMantenimiento).where(eq(schema.planesMantenimiento.activo, true));
	if (planes.length) {
		const lecturas = await lecturasPorVehiculo(db, ids);
		const ultimas = await ultimasPorPlan(db, ids);
		for (const veh of vehiculos) {
			if (enObra.has(veh.id)) continue;
			const ls = lecturasValidas(lecturas.get(veh.id) ?? []);
			const km = kmActual(ls);
			const ritmo = ritmoKmDia(ls, opts.hoy);
			const propios = tienePlanesPropios(planes, veh.id);
			for (const plan of planes) {
				if (!planAplica(plan, veh, propios)) continue;
				const ultima = ultimas.get(`${veh.id}:${plan.id}`) ?? null;
				const e = estadoMantenimiento(plan, ultima, { hoy: opts.hoy, kmActual: km, ritmo, urgenteDias: opts.urgenteDias });
				if (e.sinHistorial) continue;
				const planId = plan.id;
				const partes: string[] = [];
				if (e.kmRestantes != null)
					partes.push(e.kmRestantes < 0 ? `pasado ${(-e.kmRestantes).toLocaleString('es-ES')} km` : `quedan ${e.kmRestantes.toLocaleString('es-ES')} km`);
				if (e.proximaFecha) partes.push(`toca el ${fechaLarga(e.proximaFecha)}`);
				alertas.push({
					clave: `mant:${veh.id}:${plan.id}`,
					tipo: 'mantenimiento',
					vehiculoId: veh.id,
					vehiculo: veh.alias,
					matricula: veh.matricula,
					titulo: plan.codigo ? `${plan.codigo} · ${plan.nombre}` : plan.nombre,
					detalle: partes.join(' · '),
					nivel: e.nivel,
					dias: e.diasRestantes,
					kmRestantes: e.kmRestantes,
					avisosDias: [plan.avisoDias, Math.min(7, plan.avisoDias), 1],
					ciclo: String(ultima!.id),
					planId
				});
			}
		}
	}

	// Averías y trabajos por reparar: la prioridad decide el nivel
	const pends = await db
		.select()
		.from(schema.pendientes)
		.where(and(eq(schema.pendientes.estado, 'pendiente'), inArray(schema.pendientes.vehiculoId, ids)));
	const NIVEL_PRIORIDAD: Record<string, Nivel> = { alta: 'urgente', media: 'pronto', baja: 'ok' };
	for (const p of pends) {
		const veh = porId.get(p.vehiculoId)!;
		alertas.push({
			clave: `pend:${p.id}`,
			tipo: 'pendiente',
			vehiculoId: veh.id,
			vehiculo: veh.alias,
			matricula: veh.matricula,
			titulo: p.titulo,
			detalle: `Por reparar · visto el ${fechaLarga(p.fechaDetectado)}${p.kmDetectado != null ? ` a ${p.kmDetectado.toLocaleString('es-ES')} km` : ''}`,
			nivel: NIVEL_PRIORIDAD[p.prioridad] ?? 'pronto',
			dias: null,
			kmRestantes: null,
			avisosDias: [],
			ciclo: String(p.id)
		});
	}

	return alertas
		.filter((a) => opts.incluirOk || a.nivel !== 'ok')
		.sort((a, b) => compararNivel(a.nivel, b.nivel) || (a.dias ?? 1e9) - (b.dias ?? 1e9));
}
