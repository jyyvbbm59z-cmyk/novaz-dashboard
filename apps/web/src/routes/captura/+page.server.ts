import { combustibleDe, kmActual, lecturasPorVehiculo, lecturasValidas } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, asc, eq, inArray, max } from 'drizzle-orm';
import { guardarEntrada, guardarMovimiento, guardarPendiente, marcarTarea } from '$lib/server/acciones';
import { comprobarLectura, registrarKm } from '$lib/server/datos';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { guardarRepostaje } from '$lib/server/repostajes';

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
	// Para el repostaje: gasolineras ya usadas y el combustible de cada vehículo (precio de referencia)
	const [gasolineras, vehs, tipos] = await Promise.all([
		db.selectDistinct({ g: s.repostajes.gasolinera }).from(s.repostajes),
		db.select({ id: s.vehiculos.id, campos: s.vehiculos.campos, tipoId: s.vehiculos.tipoId }).from(s.vehiculos),
		db.select({ id: s.tiposVehiculo.id, nombre: s.tiposVehiculo.nombre }).from(s.tiposVehiculo)
	]);
	const precios = locals.ajustes.precioCombustible;
	const precioHoy = Object.fromEntries(
		vehs.map((v) => {
			const tipo = combustibleDe(v.campos.combustible) ?? (/moto/i.test(tipos.find((t) => t.id === v.tipoId)?.nombre ?? '') ? 'gasolina' : null);
			return [v.id, tipo && precios?.[tipo] ? precios[tipo]!.media : null];
		})
	);
	const lecturas = await lecturasPorVehiculo(db, (await db.select({ id: s.vehiculos.id }).from(s.vehiculos)).map((v) => v.id));

	return {
		gasolineras: gasolineras.map((x) => x.g).filter((g): g is string => Boolean(g)).sort(),
		precioHoy,
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
	entrada: accion(async ({ request, locals, platform }) => {
		const fd = await request.formData();
		const r = await guardarEntrada(locals, leer(fd).id('vehiculoId'), fd, platform!.env.ARCHIVOS);
		return { mensaje: 'Registrado', momento: 'entradaCreada', entradaId: r.entradaId };
	}),
	gasto: accion(async ({ request, locals }) => {
		const movimientoId = await guardarMovimiento(locals, await request.formData());
		return { mensaje: 'Gasto registrado', movimientoId };
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
	repostaje: accion(async ({ request, locals }) => {
		const r = await guardarRepostaje(locals, await request.formData());
		return { mensaje: `Repostaje guardado (${(r.importe / 100).toFixed(2).replace('.', ',')} €)`, movimientoId: r.movimientoId };
	}),
	pendiente: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const pendienteId = await guardarPendiente(locals, leer(fd).id('vehiculoId'), fd);
		return { mensaje: 'Apuntado en «Por reparar»', pendienteId };
	}),
	tarea: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const momento = await marcarTarea(locals, f.id('id'), true);
		return { momento: momento ?? undefined, mensaje: 'Tarea hecha' };
	})
};
