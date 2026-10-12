import { cargarAlertas, eventosAgenda, sesionesRecomendadas } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq, inArray } from 'drizzle-orm';
import { soloVisibles } from './usuarios';

/** Agenda de los próximos 12 meses: papeles, revisiones (con fecha estimada por tu ritmo de km), el local y lo que se repite. */
export async function cargarAgenda(locals: App.Locals) {
	const { db, hoy, ajustes } = locals;
	const [todas, vencs, planes, tareas, recurrentes] = await Promise.all([
		cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true }),
		db.select({ id: s.vencimientos.id, importe: s.vencimientos.importeCent }).from(s.vencimientos).where(eq(s.vencimientos.estado, 'vigente')),
		db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.activo, true)),
		db.select().from(s.tareasLocal).where(inArray(s.tareasLocal.estado, ['pendiente', 'en_curso'])),
		db.select().from(s.recurrentes).where(eq(s.recurrentes.activo, true))
	]);
	const alertas = soloVisibles(locals.yo, todas, (a) => a.vehiculoId);
	// Cada uno ve lo suyo: sin «Dinero», ni gastos fijos ni importes; sin «El local», ni sus tareas
	const dinero = locals.permisos.includes('dinero');
	const eventos = eventosAgenda({
		hoy,
		alertas,
		importesPapel: new Map(vencs.map((v) => [v.id, dinero ? v.importe : null])),
		planes,
		tareasLocal: locals.permisos.includes('local') ? tareas : [],
		recurrentes: dinero ? recurrentes : []
	});
	return {
		eventos: dinero ? eventos : eventos.map((e) => ({ ...e, importeCent: null })),
		sesiones: sesionesRecomendadas(alertas, planes, hoy)
	};
}
