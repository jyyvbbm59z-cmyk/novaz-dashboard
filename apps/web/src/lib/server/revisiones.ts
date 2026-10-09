import { planAplica, PLANTILLAS_REVISION } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { ErrorFormulario } from './form';

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Crea las revisiones de una plantilla como planes propios del vehículo (sustituyen a los del tipo)
 * y les traspasa el historial de los planes antiguos equivalentes (aceite → I2, cadena → I1…).
 */
export async function aplicarPlantilla(locals: App.Locals, vehiculoId: number, plantillaId: string) {
	const { db } = locals;
	const plantilla = PLANTILLAS_REVISION.find((p) => p.id === plantillaId);
	if (!plantilla) throw new ErrorFormulario('Plantilla desconocida');
	const v = await db.select().from(s.vehiculos).where(eq(s.vehiculos.id, vehiculoId)).get();
	if (!v) throw new ErrorFormulario('Vehículo no encontrado');

	const todos = await db.select().from(s.planesMantenimiento);
	if (todos.some((p) => p.vehiculoId === vehiculoId && p.activo))
		throw new ErrorFormulario('Este vehículo ya tiene revisiones propias. Edítalas o bórralas en Ajustes → Mantenimiento.');
	const antiguos = todos.filter((p) => planAplica(p, v));

	// Crear los niveles
	const porCodigo = new Map<string, number>();
	for (const [orden, n] of plantilla.niveles.entries()) {
		const [p] = await db
			.insert(s.planesMantenimiento)
			.values({
				codigo: n.codigo,
				nombre: n.nombre,
				cadaKm: n.cadaKm,
				cadaMeses: n.cadaMeses,
				cadaDias: n.cadaDias,
				avisoKm: n.avisoKm,
				avisoDias: n.avisoDias,
				tareas: n.tareas,
				vehiculoId,
				orden,
				notas: n.notas ?? null
			})
			.returning({ id: s.planesMantenimiento.id });
		porCodigo.set(n.codigo, p.id);
	}
	for (const n of plantilla.niveles)
		if (n.incluye.length)
			await db
				.update(s.planesMantenimiento)
				.set({ incluye: n.incluye.map((c) => porCodigo.get(c)!).filter(Boolean) })
				.where(eq(s.planesMantenimiento.id, porCodigo.get(n.codigo)!));

	// Heredar historial: las entradas del vehículo que renovaron un plan antiguo equivalente
	const entradasVeh = (await db.select({ id: s.entradas.id }).from(s.entradas).where(eq(s.entradas.vehiculoId, vehiculoId))).map((e) => e.id);
	let heredadas = 0;
	if (entradasVeh.length) {
		for (const n of plantilla.niveles) {
			const fuentes = antiguos.filter((p) => n.heredaDe.some((k) => normalizar(p.nombre).includes(k))).map((p) => p.id);
			if (!fuentes.length) continue;
			const enlaces = await db
				.select({ entradaId: s.entradasPlanes.entradaId })
				.from(s.entradasPlanes)
				.where(and(inArray(s.entradasPlanes.planId, fuentes), inArray(s.entradasPlanes.entradaId, entradasVeh)));
			const nuevos = [...new Set(enlaces.map((e) => e.entradaId))].map((entradaId) => ({ entradaId, planId: porCodigo.get(n.codigo)! }));
			if (nuevos.length) {
				await db.insert(s.entradasPlanes).values(nuevos).onConflictDoNothing();
				heredadas += nuevos.length;
			}
		}
	}
	return { niveles: plantilla.niveles.length, heredadas };
}
