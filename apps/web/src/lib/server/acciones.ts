// Operaciones de escritura compartidas por varias páginas (ficha, captura rápida, restauración…).
import { desglosarIva, sumarMeses } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { CLASES_ENTRADA, FORMAS_PAGO, PRIORIDADES, TIPOS_MOVIMIENTO, type ClaseEntrada, type FormaPago, type Prioridad, type TipoMovimiento } from '@novaz/core/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { borrarAdjuntosDe } from './adjuntos';
import { registrarKm } from './datos';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

/** IVA y forma de pago: lo indicado en el formulario o, si no, los defectos (categoría / ajustes). */
async function datosContables(locals: Locals, categoriaId: number | null, f: ReturnType<typeof leer>) {
	let ivaPct = f.entero('ivaPct');
	if (ivaPct == null) {
		const cat = categoriaId ? await locals.db.select({ iva: s.categorias.ivaPct }).from(s.categorias).where(eq(s.categorias.id, categoriaId)).get() : null;
		ivaPct = cat?.iva ?? 21;
	}
	const pago = f.texto('pago');
	return {
		ivaPct: Math.min(Math.max(ivaPct, 0), 100),
		pago: (FORMAS_PAGO.includes(pago as FormaPago) ? pago : locals.ajustes.pagoPorDefecto) as FormaPago
	};
}

export async function guardarEntrada(locals: Locals, vehiculoId: number, fd: FormData, bucket?: R2Bucket) {
	const { db, hoy } = locals;
	const f = leer(fd);
	const id = f.idOpcional('id');
	const fecha = f.fecha('fecha') ?? hoy;
	const km = f.entero('km');
	// Planes que renueva (casillas); se acepta también el antiguo `planId`
	const planIds = [...new Set([...f.lista('planIds'), ...(f.texto('planId') ? [f.texto('planId')!] : [])].map(Number).filter(Number.isInteger))];
	const faseId = f.idOpcional('faseId');
	let restauracionId = f.idOpcional('restauracionId');
	if (faseId && !restauracionId) {
		const fase = await db.select().from(s.fases).where(eq(s.fases.id, faseId)).get();
		restauracionId = fase?.restauracionId ?? null;
	}
	const claseCruda = f.texto('clase') ?? (planIds.length ? 'mantenimiento' : restauracionId ? 'diario' : 'nota');
	const clase = (CLASES_ENTRADA.includes(claseCruda as ClaseEntrada) ? claseCruda : 'nota') as ClaseEntrada;

	let titulo = f.texto('titulo');
	if (!titulo && planIds.length) {
		const planes = await db.select({ nombre: s.planesMantenimiento.nombre }).from(s.planesMantenimiento).where(inArray(s.planesMantenimiento.id, planIds));
		titulo = planes.map((p) => p.nombre).join(' + ') || null;
	}
	if (!titulo) {
		const texto = f.texto('texto');
		titulo = texto ? texto.split('\n')[0].slice(0, 80) : null;
	}
	if (!titulo) throw new ErrorFormulario('Escribe un título o una descripción');

	const valores = { vehiculoId, clase, fecha, km, titulo, texto: f.texto('texto'), horas: f.decimal('horas'), restauracionId, faseId };

	let entradaId: number;
	if (id) {
		await db.update(s.entradas).set(valores).where(and(eq(s.entradas.id, id), eq(s.entradas.vehiculoId, vehiculoId)));
		entradaId = id;
	} else {
		const [e] = await db.insert(s.entradas).values(valores).returning({ id: s.entradas.id });
		entradaId = e.id;
	}
	await registrarKm(db, vehiculoId, fecha, km, 'entrada');

	// Planes renovados: solo los de mantenimiento; al editar se sustituyen
	if (clase === 'mantenimiento' || id) {
		await db.delete(s.entradasPlanes).where(eq(s.entradasPlanes.entradaId, entradaId));
		if (clase === 'mantenimiento' && planIds.length) await db.insert(s.entradasPlanes).values(planIds.map((planId) => ({ entradaId, planId })));
	}

	// Gastos: varias líneas (filtro, aceite…) con proveedor y forma de pago comunes.
	// Al editar (`sincronizarGastos`), la lista enviada es la verdad: las líneas con id se
	// actualizan, las que ya no vienen se borran y las nuevas se crean. Nunca se duplica.
	// Compatibilidad: un único `importe` + `categoriaId` se trata como una línea nueva.
	type Linea = { id: number | null; concepto: string; importeCent: number; categoriaId: number | null };
	let lineas: Linea[] = [];
	const json = f.texto('gastos');
	if (json) {
		try {
			const crudo = JSON.parse(json);
			if (Array.isArray(crudo))
				lineas = crudo
					.map((l) => ({
						id: Number.isInteger(Number(l?.id)) && Number(l?.id) > 0 ? Number(l.id) : null,
						concepto: String(l?.concepto ?? '').trim(),
						importeCent: Math.round(Number(l?.importeCent) || 0),
						categoriaId: Number.isInteger(Number(l?.categoriaId)) && Number(l?.categoriaId) > 0 ? Number(l.categoriaId) : null
					}))
					.filter((l) => l.importeCent > 0);
		} catch {
			throw new ErrorFormulario('Gastos mal formados');
		}
	} else {
		const importe = f.euros('importe');
		if (importe && !id) lineas = [{ id: null, concepto: titulo, importeCent: importe, categoriaId: f.idOpcional('categoriaId') }];
	}
	const proveedor = f.texto('proveedor');
	const pago = f.texto('pago');

	if (id && f.bool('sincronizarGastos')) {
		const existentes = await db
			.select()
			.from(s.movimientos)
			.where(and(eq(s.movimientos.entradaId, entradaId), eq(s.movimientos.tipo, 'gasto')));
		const quedan = new Set(lineas.map((l) => l.id).filter((x): x is number => x != null));
		for (const m of existentes) if (!quedan.has(m.id)) await borrarMovimiento(locals, m.id, bucket);
		for (const l of lineas) {
			const m = l.id != null ? existentes.find((x) => x.id === l.id) : undefined;
			if (!m) continue;
			const cambios: Partial<typeof s.movimientos.$inferInsert> = {
				concepto: l.concepto || titulo,
				importeCent: l.importeCent,
				fecha,
				vehiculoId,
				restauracionId
			};
			if (l.categoriaId !== m.categoriaId) {
				cambios.categoriaId = l.categoriaId;
				const cat = l.categoriaId ? await db.select({ iva: s.categorias.ivaPct }).from(s.categorias).where(eq(s.categorias.id, l.categoriaId)).get() : null;
				if (cat) cambios.ivaPct = cat.iva;
			}
			if (proveedor) cambios.proveedor = proveedor;
			if (pago && FORMAS_PAGO.includes(pago as FormaPago)) cambios.pago = pago as FormaPago;
			await db.update(s.movimientos).set(cambios).where(eq(s.movimientos.id, m.id));
		}
		lineas = lineas.filter((l) => l.id == null || !existentes.some((x) => x.id === l.id));
	} else {
		lineas = lineas.filter((l) => l.id == null);
	}

	for (const l of lineas) {
		const datos = new FormData();
		datos.set('tipo', 'gasto');
		datos.set('importe', (l.importeCent / 100).toFixed(2).replace('.', ','));
		datos.set('fecha', fecha);
		datos.set('concepto', l.concepto || titulo);
		if (l.categoriaId) datos.set('categoriaId', String(l.categoriaId));
		if (proveedor) datos.set('proveedor', proveedor);
		if (pago) datos.set('pago', pago);
		const movId = await guardarMovimiento(locals, datos, { vehiculoId, restauracionId });
		await db.update(s.movimientos).set({ entradaId }).where(eq(s.movimientos.id, movId));
	}
	return { entradaId, nueva: !id };
}

export async function borrarEntrada(locals: Locals, bucket: R2Bucket, id: number) {
	await borrarAdjuntosDe(locals.db, bucket, 'entrada', id);
	const movs = await locals.db.select({ id: s.movimientos.id }).from(s.movimientos).where(eq(s.movimientos.entradaId, id));
	for (const m of movs) await borrarMovimiento(locals, m.id, bucket);
	await locals.db.delete(s.entradas).where(eq(s.entradas.id, id));
}

export async function guardarMovimiento(locals: Locals, fd: FormData, fijo: { vehiculoId?: number | null; restauracionId?: number | null } = {}) {
	const f = leer(fd);
	const { db } = locals;
	const id = f.idOpcional('id');
	const importe = f.euros('importe');
	if (importe == null || importe === 0) throw new ErrorFormulario('Indica un importe');
	const tipoCrudo = f.texto('tipo');
	const tipo = (TIPOS_MOVIMIENTO.includes(tipoCrudo as TipoMovimiento) ? tipoCrudo : 'gasto') as TipoMovimiento;
	const financiero = tipo === 'aportacion' || tipo === 'retirada';
	const categoriaId = financiero ? null : f.idOpcional('categoriaId');
	const esInmovilizado = tipo === 'gasto' && f.bool('inmovilizado');
	const cuentaInmov = f.texto('cuentaInmovilizado') ?? '213';
	const cuentaPropia = f.texto('cuentaContable');
	if (cuentaPropia && !/^\d{3,10}$/.test(cuentaPropia)) throw new ErrorFormulario('La cuenta contable debe ser un número (p. ej. 602)');

	const contables = await datosContables(locals, categoriaId, f);
	if (financiero) {
		contables.ivaPct = 0;
		if (contables.pago === 'socio') contables.pago = 'banco';
	}
	const valores = {
		...contables,
		fecha: f.fecha('fecha') ?? locals.hoy,
		tipo,
		importeCent: Math.abs(importe),
		categoriaId,
		concepto: f.obligatorio('concepto', 'concepto'),
		proveedor: f.texto('proveedor'),
		notas: f.texto('notas'),
		cuentaContable: esInmovilizado ? cuentaInmov : cuentaPropia,
		vehiculoId: fijo.vehiculoId !== undefined ? fijo.vehiculoId : f.idOpcional('vehiculoId'),
		restauracionId: fijo.restauracionId !== undefined ? fijo.restauracionId : f.idOpcional('restauracionId')
	};

	let movimientoId: number;
	if (id) {
		await db.update(s.movimientos).set(valores).where(eq(s.movimientos.id, id));
		movimientoId = id;
	} else {
		const [m] = await db.insert(s.movimientos).values(valores).returning({ id: s.movimientos.id });
		movimientoId = m.id;
	}

	// Inmovilizado ligado al movimiento: se da de alta por su base (sin IVA)
	const bien = await db.select().from(s.inmovilizado).where(eq(s.inmovilizado.movimientoId, movimientoId)).get();
	if (esInmovilizado) {
		const { base } = desglosarIva(valores.importeCent, valores.ivaPct);
		const datos = {
			nombre: valores.concepto,
			cuenta: cuentaInmov,
			fechaAlta: valores.fecha,
			valorCent: base,
			vidaUtilMeses: Math.max(1, Math.round((f.decimal('vidaUtilAnios') ?? 10) * 12)),
			movimientoId
		};
		if (bien) await db.update(s.inmovilizado).set(datos).where(eq(s.inmovilizado.id, bien.id));
		else await db.insert(s.inmovilizado).values(datos);
	} else if (bien) {
		await db.delete(s.inmovilizado).where(eq(s.inmovilizado.id, bien.id));
	}
	return movimientoId;
}

/** Borra un movimiento, el inmovilizado que generó y sus archivos (factura escaneada…). */
export async function borrarMovimiento(locals: Locals, id: number, bucket?: R2Bucket) {
	if (bucket) await borrarAdjuntosDe(locals.db, bucket, 'movimiento', id);
	await locals.db.delete(s.inmovilizado).where(eq(s.inmovilizado.movimientoId, id));
	await locals.db.delete(s.movimientos).where(eq(s.movimientos.id, id));
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
			...(await datosContables(locals, tipo.categoriaId, f)),
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

// ─── Por reparar ──────────────────────────────────────────────────────────────

export async function guardarPendiente(locals: Locals, vehiculoId: number, fd: FormData) {
	const f = leer(fd);
	const id = f.idOpcional('id');
	const prioridad = f.texto('prioridad');
	const valores = {
		vehiculoId,
		titulo: f.obligatorio('titulo', 'qué hay que reparar'),
		detalle: f.texto('detalle'),
		prioridad: (PRIORIDADES.includes(prioridad as Prioridad) ? prioridad : 'media') as Prioridad,
		fechaDetectado: f.fecha('fechaDetectado') ?? locals.hoy,
		kmDetectado: f.entero('km')
	};
	if (id) {
		await locals.db.update(s.pendientes).set(valores).where(and(eq(s.pendientes.id, id), eq(s.pendientes.vehiculoId, vehiculoId)));
		return id;
	}
	const [p] = await locals.db.insert(s.pendientes).values(valores).returning({ id: s.pendientes.id });
	await registrarKm(locals.db, vehiculoId, valores.fechaDetectado, valores.kmDetectado);
	return p.id;
}

/** Cierra un pendiente creando la entrada de reparación (con su gasto, si lo hay). */
export async function resolverPendiente(locals: Locals, vehiculoId: number, fd: FormData, bucket?: R2Bucket) {
	const pendienteId = leer(fd).id('pendienteId');
	const p = await locals.db.select().from(s.pendientes).where(and(eq(s.pendientes.id, pendienteId), eq(s.pendientes.vehiculoId, vehiculoId))).get();
	if (!p) throw new ErrorFormulario('Pendiente no encontrado');
	if (!fd.get('clase')) fd.set('clase', 'reparacion');
	if (!fd.get('titulo')) fd.set('titulo', p.titulo);
	const r = await guardarEntrada(locals, vehiculoId, fd, bucket);
	const entrada = await locals.db.select({ fecha: s.entradas.fecha }).from(s.entradas).where(eq(s.entradas.id, r.entradaId)).get();
	await locals.db
		.update(s.pendientes)
		.set({ estado: 'hecho', fechaCierre: entrada?.fecha ?? locals.hoy, entradaId: r.entradaId })
		.where(eq(s.pendientes.id, pendienteId));
	return r;
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
