// Operaciones de escritura compartidas por varias páginas (ficha, captura rápida, restauración…).
import { sumarMeses } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { CLASES_ENTRADA, type ClaseEntrada } from '@novaz/core/schema';
import { and, eq } from 'drizzle-orm';
import { borrarAdjuntosDe } from './adjuntos';
import { registrarKm } from './datos';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

export async function guardarEntrada(locals: Locals, vehiculoId: number, fd: FormData) {
	const { db, hoy } = locals;
	const f = leer(fd);
	const id = f.idOpcional('id');
	const fecha = f.fecha('fecha') ?? hoy;
	const km = f.entero('km');
	const planId = f.idOpcional('planId');
	const faseId = f.idOpcional('faseId');
	let restauracionId = f.idOpcional('restauracionId');
	if (faseId && !restauracionId) {
		const fase = await db.select().from(s.fases).where(eq(s.fases.id, faseId)).get();
		restauracionId = fase?.restauracionId ?? null;
	}
	const claseCruda = f.texto('clase') ?? (planId ? 'mantenimiento' : restauracionId ? 'diario' : 'nota');
	const clase = (CLASES_ENTRADA.includes(claseCruda as ClaseEntrada) ? claseCruda : 'nota') as ClaseEntrada;

	let titulo = f.texto('titulo');
	if (!titulo && planId) titulo = (await db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.id, planId)).get())?.nombre ?? null;
	if (!titulo) {
		const texto = f.texto('texto');
		titulo = texto ? texto.split('\n')[0].slice(0, 80) : null;
	}
	if (!titulo) throw new ErrorFormulario('Escribe un título o una descripción');

	const valores = { vehiculoId, clase, fecha, km, titulo, texto: f.texto('texto'), horas: f.decimal('horas'), planId, restauracionId, faseId };

	let entradaId: number;
	if (id) {
		await db.update(s.entradas).set(valores).where(and(eq(s.entradas.id, id), eq(s.entradas.vehiculoId, vehiculoId)));
		entradaId = id;
	} else {
		const [e] = await db.insert(s.entradas).values(valores).returning({ id: s.entradas.id });
		entradaId = e.id;
	}
	await registrarKm(db, vehiculoId, fecha, km, 'entrada');

	const importe = f.euros('importe');
	if (importe && !id) {
		await db.insert(s.movimientos).values({
			fecha,
			tipo: 'gasto',
			importeCent: importe,
			categoriaId: f.idOpcional('categoriaId'),
			concepto: titulo,
			proveedor: f.texto('proveedor'),
			vehiculoId,
			entradaId,
			restauracionId
		});
	}
	return { entradaId, nueva: !id };
}

export async function borrarEntrada(locals: Locals, bucket: R2Bucket, id: number) {
	await borrarAdjuntosDe(locals.db, bucket, 'entrada', id);
	await locals.db.delete(s.movimientos).where(eq(s.movimientos.entradaId, id));
	await locals.db.delete(s.entradas).where(eq(s.entradas.id, id));
}

export async function guardarMovimiento(locals: Locals, fd: FormData, fijo: { vehiculoId?: number | null; restauracionId?: number | null } = {}) {
	const f = leer(fd);
	const id = f.idOpcional('id');
	const importe = f.euros('importe');
	if (importe == null || importe === 0) throw new ErrorFormulario('Indica un importe');
	const tipo = f.texto('tipo') === 'ingreso' ? 'ingreso' : 'gasto';
	const valores = {
		fecha: f.fecha('fecha') ?? locals.hoy,
		tipo: tipo as 'gasto' | 'ingreso',
		importeCent: Math.abs(importe),
		categoriaId: f.idOpcional('categoriaId'),
		concepto: f.obligatorio('concepto', 'concepto'),
		proveedor: f.texto('proveedor'),
		notas: f.texto('notas'),
		vehiculoId: fijo.vehiculoId !== undefined ? fijo.vehiculoId : f.idOpcional('vehiculoId'),
		restauracionId: fijo.restauracionId !== undefined ? fijo.restauracionId : f.idOpcional('restauracionId')
	};
	if (id) {
		await locals.db.update(s.movimientos).set(valores).where(eq(s.movimientos.id, id));
		return id;
	}
	const [m] = await locals.db.insert(s.movimientos).values(valores).returning({ id: s.movimientos.id });
	return m.id;
}

export async function guardarVencimiento(locals: Locals, vehiculoId: number, fd: FormData) {
	const f = leer(fd);
	const id = f.idOpcional('id');
	const tipoId = f.id('tipoId');
	const tipo = await locals.db.select().from(s.tiposVencimiento).where(eq(s.tiposVencimiento.id, tipoId)).get();
	if (!tipo) throw new ErrorFormulario('Tipo no válido');
	const fechaInicio = f.fecha('fechaInicio');
	let fechaVence = f.fecha('fechaVence');
	if (!fechaVence && fechaInicio && tipo.mesesValidez) fechaVence = sumarMeses(fechaInicio, tipo.mesesValidez);
	if (!fechaVence) throw new ErrorFormulario('Indica la fecha de vencimiento');

	const valores = {
		vehiculoId,
		tipoId,
		fechaInicio,
		fechaVence,
		proveedor: f.texto('proveedor'),
		referencia: f.texto('referencia'),
		importeCent: f.euros('importe'),
		notas: f.texto('notas')
	};
	if (id) {
		await locals.db.update(s.vencimientos).set(valores).where(and(eq(s.vencimientos.id, id), eq(s.vencimientos.vehiculoId, vehiculoId)));
		return id;
	}
	// Un vencimiento nuevo sustituye al vigente del mismo tipo
	await locals.db
		.update(s.vencimientos)
		.set({ estado: 'renovado' })
		.where(and(eq(s.vencimientos.vehiculoId, vehiculoId), eq(s.vencimientos.tipoId, tipoId), eq(s.vencimientos.estado, 'vigente')));
	const [v] = await locals.db.insert(s.vencimientos).values(valores).returning({ id: s.vencimientos.id });
	if (valores.importeCent && f.bool('registrarGasto')) {
		await locals.db.insert(s.movimientos).values({
			fecha: fechaInicio ?? locals.hoy,
			tipo: 'gasto',
			importeCent: valores.importeCent,
			categoriaId: tipo.categoriaId,
			concepto: `${tipo.nombre}${valores.proveedor ? ` · ${valores.proveedor}` : ''}`,
			proveedor: valores.proveedor,
			vehiculoId,
			vencimientoId: v.id
		});
	}
	return v.id;
}

export async function borrarVencimiento(locals: Locals, bucket: R2Bucket, id: number) {
	await borrarAdjuntosDe(locals.db, bucket, 'vencimiento', id);
	await locals.db.update(s.movimientos).set({ vencimientoId: null }).where(eq(s.movimientos.vencimientoId, id));
	await locals.db.delete(s.vencimientos).where(eq(s.vencimientos.id, id));
}

/** Marca una tarea; si con ello la fase queda completa, devuelve el momento correspondiente. */
export async function marcarTarea(locals: Locals, tareaId: number, hecha: boolean) {
	const { db, hoy } = locals;
	await db.update(s.tareas).set({ hecha, fechaHecha: hecha ? hoy : null }).where(eq(s.tareas.id, tareaId));
	const t = await db.select({ faseId: s.tareas.faseId }).from(s.tareas).where(eq(s.tareas.id, tareaId)).get();
	if (!t) return 'tareaHecha' as const;
	const tareasFase = await db.select({ hecha: s.tareas.hecha }).from(s.tareas).where(eq(s.tareas.faseId, t.faseId));
	const completa = tareasFase.length > 0 && tareasFase.every((x) => x.hecha);
	await db.update(s.fases).set({ fechaFin: completa ? hoy : null }).where(eq(s.fases.id, t.faseId));
	if (!hecha) return null;
	return completa ? ('faseCompletada' as const) : ('tareaHecha' as const);
}

export async function crearRestauracion(locals: Locals, vehiculoId: number, fd: FormData) {
	const f = leer(fd);
	const { db, hoy } = locals;
	const [r] = await db
		.insert(s.restauraciones)
		.values({
			vehiculoId,
			nombre: f.obligatorio('nombre', 'nombre'),
			descripcion: f.texto('descripcion'),
			fechaInicio: f.fecha('fechaInicio') ?? hoy,
			presupuestoCent: f.euros('presupuesto'),
			estado: 'en_curso'
		})
		.returning({ id: s.restauraciones.id });

	const plantillaId = f.idOpcional('plantillaId');
	if (plantillaId) {
		const p = await db.select().from(s.plantillasFases).where(eq(s.plantillasFases.id, plantillaId)).get();
		for (const [i, fase] of (p?.fases ?? []).entries()) {
			const [fa] = await db.insert(s.fases).values({ restauracionId: r.id, nombre: fase.nombre, orden: i }).returning({ id: s.fases.id });
			if (fase.tareas.length) await db.insert(s.tareas).values(fase.tareas.map((t, j) => ({ faseId: fa.id, titulo: t, orden: j })));
		}
	}
	const estadoId = f.idOpcional('estadoId');
	if (estadoId) await db.update(s.vehiculos).set({ estadoId }).where(eq(s.vehiculos.id, vehiculoId));
	return r.id;
}
