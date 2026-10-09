import { kmActual, lecturasPorVehiculo, lecturasValidas } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, asc, eq, inArray, max } from 'drizzle-orm';
import { guardarEntrada, guardarMovimiento, guardarPendiente, marcarTarea } from '$lib/server/acciones';
import { comprobarLectura, registrarKm } from '$lib/server/datos';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals }) => {
	const { db } = locals;
	const [actividad, restas] = await db.batch([
		db.select({ id: s.entradas.vehiculoId, ultima: max(s.entradas.creado) }).from(s.entradas).groupBy(s.entradas.vehiculoId),
		db
			.select({ id: s.restauraciones.id, vehiculoId: s.restauraciones.vehiculoId, nombre: s.restauraciones.nombre })
			.from(s.restauraciones)
			.where(eq(s.restauraciones.estado, 'en_curso'))
	]);
	const rids = restas.map((r) => r.id);
	const fases = rids.length
		? await db.select().from(s.fases).where(inArray(s.fases.restauracionId, rids)).orderBy(asc(s.fases.orden))
		: [];
	const tareas = fases.length
		? await db
				.select()
				.from(s.tareas)
				.where(and(inArray(s.tareas.faseId, fases.map((f) => f.id)), eq(s.tareas.hecha, false)))
				.orderBy(asc(s.tareas.orden))
		: [];
	const lecturas = await lecturasPorVehiculo(db, (await db.select({ id: s.vehiculos.id }).from(s.vehiculos)).map((v) => v.id));

	return {
		actividad: Object.fromEntries(actividad.map((a) => [a.id, a.ultima ?? ''])),
		km: Object.fromEntries([...lecturas].map(([id, ls]) => [id, kmActual(lecturasValidas(ls))])),
		obras: restas.map((r) => {
			const fs = fases.filter((f) => f.restauracionId === r.id);
			return {
				...r,
				fases: fs.map((f) => ({ id: f.id, nombre: f.nombre })),
				tareas: tareas.filter((t) => fs.some((f) => f.id === t.faseId)).map((t) => ({ ...t, fase: fs.find((f) => f.id === t.faseId)!.nombre }))
			};
		})
	};
};

export const actions = {
	entrada: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const r = await guardarEntrada(locals, leer(fd).id('vehiculoId'), fd);
		return { mensaje: 'Registrado', momento: 'entradaCreada', entradaId: r.entradaId };
	}),
	gasto: accion(async ({ request, locals }) => {
		await guardarMovimiento(locals, await request.formData());
		return { mensaje: 'Gasto registrado' };
	}),
	km: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const km = f.entero('km');
		if (km == null) throw new ErrorFormulario('Indica los km');
		const fecha = f.fecha('fecha') ?? locals.hoy;
		await comprobarLectura(locals.db, f.id('vehiculoId'), fecha, km);
		await registrarKm(locals.db, f.id('vehiculoId'), fecha, km);
		return { mensaje: 'Km guardados' };
	}),
	pendiente: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		await guardarPendiente(locals, leer(fd).id('vehiculoId'), fd);
		return { mensaje: 'Apuntado en «Por reparar»' };
	}),
	tarea: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const momento = await marcarTarea(locals, f.id('id'), true);
		return { momento: momento ?? undefined, mensaje: 'Tarea hecha' };
	})
};
