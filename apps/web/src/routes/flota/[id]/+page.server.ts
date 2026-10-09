import {
	estadoMantenimiento,
	estadoVencimiento,
	kmActual,
	planAplica,
	ritmoKmDia,
	tipoVencimientoAplica
} from '@novaz/core';
import * as s from '@novaz/core/schema';
import { error, redirect } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import {
	borrarEntrada,
	borrarMovimiento,
	borrarVencimiento,
	crearRestauracion,
	guardarEntrada,
	guardarMovimiento,
	guardarVencimiento
} from '$lib/server/acciones';
import { borrarAdjuntos } from '$lib/server/adjuntos';
import { avanceRestauraciones, registrarKm } from '$lib/server/datos';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ params, locals }) => {
	const id = Number(params.id);
	const { db, hoy, ajustes } = locals;
	const v = await db.select().from(s.vehiculos).where(eq(s.vehiculos.id, id)).get();
	if (!v) error(404, 'Vehículo no encontrado');

	const [lecturas, entradas, vencs, movs, adjuntos, restas, planes] = await Promise.all([
		db.select().from(s.lecturasKm).where(eq(s.lecturasKm.vehiculoId, id)).orderBy(desc(s.lecturasKm.fecha), desc(s.lecturasKm.km)),
		db
			.select({ e: s.entradas, fase: s.fases.nombre, plan: s.planesMantenimiento.nombre })
			.from(s.entradas)
			.leftJoin(s.fases, eq(s.entradas.faseId, s.fases.id))
			.leftJoin(s.planesMantenimiento, eq(s.entradas.planId, s.planesMantenimiento.id))
			.where(eq(s.entradas.vehiculoId, id))
			.orderBy(desc(s.entradas.fecha), desc(s.entradas.id)),
		db
			.select({ v: s.vencimientos, tipo: s.tiposVencimiento })
			.from(s.vencimientos)
			.innerJoin(s.tiposVencimiento, eq(s.vencimientos.tipoId, s.tiposVencimiento.id))
			.where(eq(s.vencimientos.vehiculoId, id))
			.orderBy(asc(s.tiposVencimiento.orden), desc(s.vencimientos.fechaVence)),
		db
			.select({ m: s.movimientos, categoria: s.categorias })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			.where(eq(s.movimientos.vehiculoId, id))
			.orderBy(desc(s.movimientos.fecha), desc(s.movimientos.id)),
		db.select().from(s.adjuntos).where(eq(s.adjuntos.vehiculoId, id)).orderBy(desc(s.adjuntos.creado)),
		db.select().from(s.restauraciones).where(eq(s.restauraciones.vehiculoId, id)).orderBy(desc(s.restauraciones.fechaInicio)),
		db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.activo, true)).orderBy(asc(s.planesMantenimiento.nombre))
	]);

	const km = kmActual(lecturas);
	const ritmo = ritmoKmDia(lecturas, hoy);

	// Mantenimiento: estado de cada plan aplicable
	const mantenimiento = planes
		.filter((p) => planAplica(p, v))
		.map((p) => {
			const ultima = entradas.find((x) => x.e.planId === p.id)?.e ?? null;
			return {
				plan: p,
				ultima: ultima ? { fecha: ultima.fecha, km: ultima.km } : null,
				estado: estadoMantenimiento(p, ultima, { hoy, kmActual: km, ritmo, urgenteDias: ajustes.urgenteDias })
			};
		});

	// Vencimientos: vigentes con estado + tipos aplicables sin registrar
	const vencimientos = vencs.map(({ v: x, tipo }) => ({
		...x,
		tipo,
		estadoCalc: x.estado === 'vigente' ? estadoVencimiento(x.fechaVence, hoy, tipo.avisosDias, ajustes.urgenteDias) : null
	}));
	const tiposVenc = await db.select().from(s.tiposVencimiento).orderBy(asc(s.tiposVencimiento.orden));
	const sinRegistrar = tiposVenc.filter((t) => tipoVencimientoAplica(t, v.tipoId) && !vencs.some((x) => x.v.tipoId === t.id));

	// Fases de restauraciones abiertas (para enlazar entradas del diario)
	const abiertas = restas.filter((r) => r.estado !== 'terminada');
	const fasesAbiertas = abiertas.length
		? await db
				.select({ id: s.fases.id, nombre: s.fases.nombre, restauracionId: s.fases.restauracionId })
				.from(s.fases)
				.innerJoin(s.restauraciones, eq(s.fases.restauracionId, s.restauraciones.id))
				.where(eq(s.restauraciones.vehiculoId, id))
				.orderBy(asc(s.fases.orden))
		: [];
	const avances = await avanceRestauraciones(db, restas.map((r) => r.id));

	const anio = hoy.slice(0, 4);
	const gastos = movs.filter((x) => x.m.tipo === 'gasto');
	return {
		vehiculo: v,
		km,
		ritmo,
		lecturas: lecturas.slice(0, 20),
		entradas: entradas.map((x) => ({
			...x.e,
			fase: x.fase,
			plan: x.plan,
			importe: movs.filter((m) => m.m.entradaId === x.e.id).reduce((a, m) => a + m.m.importeCent, 0),
			adjuntos: adjuntos.filter((a) => a.entidad === 'entrada' && a.entidadId === x.e.id)
		})),
		vencimientos,
		sinRegistrar,
		mantenimiento,
		movimientos: movs.map((x) => ({ ...x.m, categoria: x.categoria })),
		totales: {
			gasto: gastos.reduce((a, x) => a + x.m.importeCent, 0),
			gastoAnio: gastos.filter((x) => x.m.fecha.startsWith(anio)).reduce((a, x) => a + x.m.importeCent, 0),
			ingreso: movs.filter((x) => x.m.tipo === 'ingreso').reduce((a, x) => a + x.m.importeCent, 0)
		},
		adjuntos,
		restauraciones: restas.map((r) => {
			const a = avances.get(r.id);
			return { ...r, avance: a && a.total ? a.hechas / a.total : 0, tareas: a?.total ?? 0 };
		}),
		fasesAbiertas: fasesAbiertas.filter((f) => abiertas.some((r) => r.id === f.restauracionId))
	};
};

const vid = (p: { id: string }) => Number(p.id);

export const actions = {
	km: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		const km = f.entero('km');
		if (km == null) throw new ErrorFormulario('Indica los km');
		await registrarKm(locals.db, vid(params), f.fecha('fecha') ?? locals.hoy, km);
		return { mensaje: 'Kilómetros actualizados' };
	}),

	entrada: accion(async ({ request, params, locals }) => {
		const r = await guardarEntrada(locals, vid(params), await request.formData());
		return { mensaje: r.nueva ? 'Entrada registrada' : 'Entrada actualizada', momento: r.nueva ? 'entradaCreada' : undefined, entradaId: r.entradaId };
	}),

	borrarEntrada: accion(async ({ request, locals, platform }) => {
		await borrarEntrada(locals, platform!.env.ARCHIVOS, leer(await request.formData()).id('id'));
		return { mensaje: 'Entrada borrada' };
	}),

	/** Marca un mantenimiento como hecho hoy (o en la fecha dada). */
	hecho: accion(async ({ request, params, locals }) => {
		const fd = await request.formData();
		fd.set('clase', 'mantenimiento');
		const r = await guardarEntrada(locals, vid(params), fd);
		return { mensaje: 'Mantenimiento registrado', momento: 'entradaCreada', entradaId: r.entradaId };
	}),

	vencimiento: accion(async ({ request, params, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		const id = await guardarVencimiento(locals, vid(params), fd);
		return { mensaje: nuevo ? 'Vencimiento guardado' : 'Vencimiento actualizado', momento: nuevo ? 'vencimientoRenovado' : undefined, vencimientoId: id };
	}),

	borrarVencimiento: accion(async ({ request, locals, platform }) => {
		await borrarVencimiento(locals, platform!.env.ARCHIVOS, leer(await request.formData()).id('id'));
		return { mensaje: 'Vencimiento borrado' };
	}),

	gasto: accion(async ({ request, params, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		await guardarMovimiento(locals, fd, { vehiculoId: vid(params) });
		return { mensaje: nuevo ? 'Movimiento registrado' : 'Movimiento actualizado' };
	}),

	borrarGasto: accion(async ({ request, locals }) => {
		await borrarMovimiento(locals, leer(await request.formData()).id('id'));
		return { mensaje: 'Movimiento borrado' };
	}),

	estado: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		await locals.db.update(s.vehiculos).set({ estadoId: f.idOpcional('estadoId') }).where(eq(s.vehiculos.id, vid(params)));
		return { mensaje: 'Estado cambiado' };
	}),

	portada: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		await locals.db.update(s.vehiculos).set({ portadaId: f.id('id') }).where(eq(s.vehiculos.id, vid(params)));
		return { mensaje: 'Portada actualizada' };
	}),

	borrarAdjunto: accion(async ({ request, locals, platform }) => {
		await borrarAdjuntos(locals.db, platform!.env.ARCHIVOS, [leer(await request.formData()).id('id')]);
		return { mensaje: 'Archivo borrado' };
	}),

	restauracion: accion(async ({ request, params, locals }) => {
		const id = await crearRestauracion(locals, vid(params), await request.formData());
		redirect(303, `/restauraciones/${id}`);
	})
};
