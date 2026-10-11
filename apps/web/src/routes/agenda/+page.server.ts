import { cargarAlertas, eventosAgenda, sesionesRecomendadas } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq, inArray } from 'drizzle-orm';

/** Agenda de los próximos 12 meses: papeles, revisiones (con fecha estimada por tu ritmo de km), el local y lo que se repite. */
export const load = async ({ locals }) => {
	const { db, hoy, ajustes } = locals;
	const [alertas, vencs, planes, tareas, recurrentes] = await Promise.all([
		cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true }),
		db.select({ id: s.vencimientos.id, importe: s.vencimientos.importeCent }).from(s.vencimientos).where(eq(s.vencimientos.estado, 'vigente')),
		db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.activo, true)),
		db.select().from(s.tareasLocal).where(inArray(s.tareasLocal.estado, ['pendiente', 'en_curso'])),
		db.select().from(s.recurrentes).where(eq(s.recurrentes.activo, true))
	]);
	return {
		eventos: eventosAgenda({ hoy, alertas, importesPapel: new Map(vencs.map((v) => [v.id, v.importe])), planes, tareasLocal: tareas, recurrentes }),
		sesiones: sesionesRecomendadas(alertas, planes, hoy)
	};
};
