import { diasEntre } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, max, or } from 'drizzle-orm';
import { borrarEntrada, borrarMovimiento, guardarEntrada, guardarMovimiento, marcarTarea } from '$lib/server/acciones';
import { cargarInventario } from '$lib/server/inventario';
import { adjuntosDe, borrarAdjuntos, borrarAdjuntosDe } from '$lib/server/adjuntos';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ params, locals }) => {
	const id = Number(params.id);
	const { db, hoy } = locals;
	const r = await db.select().from(s.restauraciones).where(eq(s.restauraciones.id, id)).get();
	if (!r) error(404, 'Restauración no encontrada');

	const [vehiculo, fases, entradas, movs] = await Promise.all([
		db.select().from(s.vehiculos).where(eq(s.vehiculos.id, r.vehiculoId)),
		db.select().from(s.fases).where(eq(s.fases.restauracionId, id)).orderBy(asc(s.fases.orden), asc(s.fases.id)),
		db
			.select({ e: s.entradas, fase: s.fases.nombre })
			.from(s.entradas)
			.leftJoin(s.fases, eq(s.entradas.faseId, s.fases.id))
			.where(eq(s.entradas.restauracionId, id))
			.orderBy(desc(s.entradas.fecha), desc(s.entradas.id)),
		db
			.select({ m: s.movimientos, categoria: s.categorias })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			.where(eq(s.movimientos.restauracionId, id))
			.orderBy(desc(s.movimientos.fecha), desc(s.movimientos.id))
	]);

	const faseIds = fases.map((f) => f.id);
	const entradaIds = entradas.map((x) => x.e.id);
	const [tareas, adjuntos] = await Promise.all([
		db
			.select()
			.from(s.tareas)
			.where(inArray(s.tareas.faseId, faseIds.length ? faseIds : [-1]))
			.orderBy(asc(s.tareas.orden), asc(s.tareas.id)),
		db
			.select()
			.from(s.adjuntos)
			.where(
				or(
					and(eq(s.adjuntos.entidad, 'restauracion'), eq(s.adjuntos.entidadId, id)),
					and(eq(s.adjuntos.entidad, 'entrada'), inArray(s.adjuntos.entidadId, entradaIds.length ? entradaIds : [-1]))
				)
			)
			.orderBy(asc(s.adjuntos.creado), asc(s.adjuntos.id))
	]);

	// Compra del vehículo (cuenta 600), para saber cuánto llevas metido en total
	const comprasVeh = await db
		.select({ importe: s.movimientos.importeCent, cuenta: s.movimientos.cuentaContable, catCuenta: s.categorias.cuentaContable })
		.from(s.movimientos)
		.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
		.where(and(eq(s.movimientos.vehiculoId, r.vehiculoId), eq(s.movimientos.tipo, 'gasto')));
	const compraVehiculo = comprasVeh.filter((m) => (m.cuenta ?? m.catCuenta ?? '').startsWith('600')).reduce((t, m) => t + m.importe, 0);
	const total = tareas.length;
	const hechas = tareas.filter((t) => t.hecha).length;
	const gasto = movs.filter((x) => x.m.tipo === 'gasto').reduce((a, x) => a + x.m.importeCent, 0);
	const fotos = adjuntos.filter((a) => a.mime.startsWith('image/'));

	return {
		restauracion: r,
		vehiculo: vehiculo[0],
		fases: fases.map((f) => {
			const ts = tareas.filter((t) => t.faseId === f.id);
			return { ...f, tareas: ts, hechas: ts.filter((t) => t.hecha).length };
		}),
		entradas: entradas.map((x) => ({ ...x.e, fase: x.fase, adjuntos: adjuntos.filter((a) => a.entidad === 'entrada' && a.entidadId === x.e.id) })),
		movimientos: movs.map((x) => ({ ...x.m, categoria: x.categoria })),
		adjuntosMov: await adjuntosDe(db, 'movimiento', movs.map((x) => x.m.id)),
		inventario: (await cargarInventario(db))
			.filter((a) => a.tipo !== 'herramienta' && (!a.vehiculoIds.length || a.vehiculoIds.includes(r.vehiculoId)))
			.map((a) => ({ id: a.id, nombre: a.nombre, unidad: a.unidad, cantidad: a.cantidad })),
		usos: entradaIds.length
			? (await db.select({ entradaId: s.stock.entradaId, articuloId: s.stock.articuloId, cantidad: s.stock.cantidad }).from(s.stock).where(and(inArray(s.stock.entradaId, entradaIds), eq(s.stock.motivo, 'uso')))).map((u) => ({ ...u, cantidad: -u.cantidad }))
			: [],
		adjuntos,
		antesDespues: fotos.length >= 2 ? { antes: fotos[0], despues: fotos[fotos.length - 1] } : null,
		resumen: {
			avance: total ? hechas / total : 0,
			total,
			hechas,
			horas: entradas.reduce((a, x) => a + (x.e.horas ?? 0), 0),
			gasto,
			dias: r.fechaInicio ? diasEntre(r.fechaInicio, r.fechaFin ?? hoy) : null,
			compraVehiculo
		}
	};
};

const rid = (p: { id: string }) => Number(p.id);

async function vehiculoDe(locals: App.Locals, restauracionId: number) {
	const r = await locals.db.select({ v: s.restauraciones.vehiculoId }).from(s.restauraciones).where(eq(s.restauraciones.id, restauracionId)).get();
	if (!r) throw new ErrorFormulario('Restauración no encontrada');
	return r.v;
}

export const actions = {
	tarea: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const momento = await marcarTarea(locals, f.id('id'), f.bool('hecha'));
		return { momento: momento ?? undefined };
	}),

	nuevaTarea: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const faseId = f.id('faseId');
		const titulos = (f.obligatorio('titulo', 'tarea') ?? '')
			.split('\n')
			.map((t) => t.trim())
			.filter(Boolean);
		const ultimo = await locals.db.select({ m: max(s.tareas.orden) }).from(s.tareas).where(eq(s.tareas.faseId, faseId)).get();
		const base = (ultimo?.m ?? -1) + 1;
		await locals.db.insert(s.tareas).values(titulos.map((titulo, i) => ({ faseId, titulo, orden: base + i, horasEstimadas: f.decimal('horas') })));
		await locals.db.update(s.fases).set({ fechaFin: null }).where(eq(s.fases.id, faseId));
		return {};
	}),

	editarTarea: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		await locals.db.update(s.tareas).set({ titulo: f.obligatorio('titulo', 'tarea') }).where(eq(s.tareas.id, f.id('id')));
		return {};
	}),

	borrarTarea: accion(async ({ request, locals }) => {
		await locals.db.delete(s.tareas).where(eq(s.tareas.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Tarea borrada' };
	}),

	nuevaFase: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		const ultimo = await locals.db.select({ m: max(s.fases.orden) }).from(s.fases).where(eq(s.fases.restauracionId, rid(params))).get();
		await locals.db.insert(s.fases).values({ restauracionId: rid(params), nombre: f.obligatorio('nombre', 'fase'), orden: (ultimo?.m ?? -1) + 1 });
		return { mensaje: 'Fase añadida' };
	}),

	editarFase: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		await locals.db.update(s.fases).set({ nombre: f.obligatorio('nombre', 'fase') }).where(eq(s.fases.id, f.id('id')));
		return {};
	}),

	moverFase: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		const id = f.id('id');
		const dir = f.texto('dir') === 'arriba' ? -1 : 1;
		const fases = await locals.db.select().from(s.fases).where(eq(s.fases.restauracionId, rid(params))).orderBy(asc(s.fases.orden), asc(s.fases.id));
		const i = fases.findIndex((x) => x.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= fases.length) return {};
		[fases[i], fases[j]] = [fases[j], fases[i]];
		await locals.db.batch(fases.map((x, k) => locals.db.update(s.fases).set({ orden: k }).where(eq(s.fases.id, x.id))) as [never]);
		return {};
	}),

	borrarFase: accion(async ({ request, locals }) => {
		await locals.db.delete(s.fases).where(eq(s.fases.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Fase borrada' };
	}),

	entrada: accion(async ({ request, params, locals, platform }) => {
		const fd = await request.formData();
		fd.set('restauracionId', String(rid(params)));
		const r = await guardarEntrada(locals, await vehiculoDe(locals, rid(params)), fd, platform!.env.ARCHIVOS);
		return { mensaje: r.nueva ? 'Entrada en el diario' : 'Entrada actualizada', momento: r.nueva ? 'entradaCreada' : undefined, entradaId: r.entradaId };
	}),

	borrarEntrada: accion(async ({ request, locals, platform }) => {
		await borrarEntrada(locals, platform!.env.ARCHIVOS, leer(await request.formData()).id('id'));
		return { mensaje: 'Entrada borrada' };
	}),

	gasto: accion(async ({ request, params, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		await guardarMovimiento(locals, fd, { vehiculoId: await vehiculoDe(locals, rid(params)), restauracionId: rid(params) });
		return { mensaje: nuevo ? 'Gasto registrado' : 'Gasto actualizado' };
	}),

	borrarGasto: accion(async ({ request, locals, platform }) => {
		await borrarMovimiento(locals, leer(await request.formData()).id('id'), platform!.env.ARCHIVOS);
		return { mensaje: 'Gasto borrado' };
	}),

	datos: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		await locals.db
			.update(s.restauraciones)
			.set({
				nombre: f.obligatorio('nombre', 'nombre'),
				descripcion: f.texto('descripcion'),
				fechaInicio: f.fecha('fechaInicio'),
				fechaFin: f.fecha('fechaFin'),
				presupuestoCent: f.euros('presupuesto')
			})
			.where(eq(s.restauraciones.id, rid(params)));
		return { mensaje: 'Guardado' };
	}),

	estado: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		const estado = f.obligatorio('estado') as 'planificada' | 'en_curso' | 'pausada' | 'terminada';
		if (!['planificada', 'en_curso', 'pausada', 'terminada'].includes(estado)) throw new ErrorFormulario('Estado no válido');
		const terminada = estado === 'terminada';
		await locals.db
			.update(s.restauraciones)
			.set({ estado, ...(terminada ? { fechaFin: f.fecha('fechaFin') ?? locals.hoy } : { fechaFin: null }) })
			.where(eq(s.restauraciones.id, rid(params)));
		const estadoVehiculo = f.idOpcional('estadoVehiculoId');
		if (estadoVehiculo) {
			await locals.db.update(s.vehiculos).set({ estadoId: estadoVehiculo }).where(eq(s.vehiculos.id, await vehiculoDe(locals, rid(params))));
		}
		return terminada ? { mensaje: '¡Restauración terminada!', momento: 'restauracionTerminada' } : { mensaje: 'Estado actualizado' };
	}),

	portada: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		await locals.db.update(s.vehiculos).set({ portadaId: f.id('id') }).where(eq(s.vehiculos.id, await vehiculoDe(locals, rid(params))));
		return { mensaje: 'Portada del vehículo actualizada' };
	}),

	borrarAdjunto: accion(async ({ request, locals, platform }) => {
		await borrarAdjuntos(locals.db, platform!.env.ARCHIVOS, [leer(await request.formData()).id('id')]);
		return { mensaje: 'Archivo borrado' };
	}),

	borrar: accion(async ({ params, locals, platform }) => {
		const id = rid(params);
		const vehiculoId = await vehiculoDe(locals, id);
		await borrarAdjuntosDe(locals.db, platform!.env.ARCHIVOS, 'restauracion', id);
		await locals.db.update(s.entradas).set({ restauracionId: null, faseId: null }).where(eq(s.entradas.restauracionId, id));
		await locals.db.update(s.movimientos).set({ restauracionId: null }).where(eq(s.movimientos.restauracionId, id));
		await locals.db.delete(s.restauraciones).where(eq(s.restauraciones.id, id));
		redirect(303, `/flota/${vehiculoId}`);
	})
};
