import {
	estadoMantenimiento,
	estadoVencimiento,
	kmActual,
	lecturasSospechosas,
	metricasKm,
	costesVehiculo,
	costeUsoMensual,
	analizarMejora,
	planesCubiertos,
	sesionesRecomendadas,
	cargarAlertas,
	consumoReal,
	combustibleDe,
	planAplica,
	plantillaSugerida,
	plantillasPara,
	tienePlanesPropios,
	ritmoKmDia,
	tipoVencimientoAplica,
	ordenPendientes,
	resumenLibreta
} from '@novaz/core';
import * as s from '@novaz/core/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
	borrarEntrada,
	borrarMovimiento,
	borrarVencimiento,
	crearRestauracion,
	guardarEntrada,
	guardarPendiente,
	resolverPendiente,
	guardarMovimiento,
	guardarVencimiento
} from '$lib/server/acciones';
import { adjuntosDe, borrarAdjuntos } from '$lib/server/adjuntos';
import { crearFactura } from '$lib/server/facturas';
import { aplicarPlantilla } from '$lib/server/revisiones';
import { cargarInventario, cerrarCompras } from '$lib/server/inventario';
import { precioCombustibleHoy } from '$lib/server/combustible';
import { borrarRepostaje, guardarRepostaje } from '$lib/server/repostajes';
import { avanceRestauraciones, comprobarLectura, registrarKm } from '$lib/server/datos';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { borrarGastoSimple, guardarGastoSimple } from '$lib/server/libreta';
import { esAjeno } from '$lib/server/usuarios';
import { borradorConIa, cargarFicha, fijarDato, guardarDato, guardarProcedimiento, importarFicha } from '$lib/server/ficha';

export const load = async ({ params, locals }) => {
	const id = Number(params.id);
	const { db, hoy, ajustes } = locals;
	const v = await db.select().from(s.vehiculos).where(eq(s.vehiculos.id, id)).get();
	if (!v) error(404, 'Vehículo no encontrado');

	const [lecturas, entradas, vencs, movs, adjuntos, restas, planes, porReparar] = await Promise.all([
		db.select().from(s.lecturasKm).where(eq(s.lecturasKm.vehiculoId, id)).orderBy(desc(s.lecturasKm.fecha), desc(s.lecturasKm.km)),
		db
			.select({ e: s.entradas, fase: s.fases.nombre })
			.from(s.entradas)
			.leftJoin(s.fases, eq(s.entradas.faseId, s.fases.id))
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
		db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.activo, true)).orderBy(asc(s.planesMantenimiento.nombre)),
		db
			.select()
			.from(s.pendientes)
			.where(and(eq(s.pendientes.vehiculoId, id), eq(s.pendientes.estado, 'pendiente')))
			.orderBy(asc(s.pendientes.fechaDetectado))
	]);
	// Lo que hay que arreglar va antes que las mejoras
	porReparar.sort(ordenPendientes);

	// Planes renovados por cada entrada
	const enlaces = entradas.length
		? await db
				.select({ entradaId: s.entradasPlanes.entradaId, planId: s.entradasPlanes.planId, nombre: s.planesMantenimiento.nombre })
				.from(s.entradasPlanes)
				.innerJoin(s.planesMantenimiento, eq(s.entradasPlanes.planId, s.planesMantenimiento.id))
				.where(inArray(s.entradasPlanes.entradaId, entradas.map((x) => x.e.id)))
		: [];
	const planesDe = (entradaId: number) => enlaces.filter((l) => l.entradaId === entradaId);

	const malas = lecturasSospechosas(lecturas);
	const validas = lecturas.filter((_, i) => !malas.has(i));
	const km = kmActual(validas);
	const ritmo = ritmoKmDia(validas, hoy);

	// Mantenimiento: estado de cada plan aplicable (los propios del vehículo sustituyen a los del tipo)
	const propios = tienePlanesPropios(planes, v.id);
	const mantenimiento = planes
		.filter((p) => planAplica(p, v, propios))
		.sort((a, b) => a.orden - b.orden || (a.codigo ?? a.nombre).localeCompare(b.codigo ?? b.nombre))
		.map((p) => {
			const ultima = entradas.find((x) => planesDe(x.e.id).some((l) => l.planId === p.id))?.e ?? null;
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
	const metricas = metricasKm(validas, hoy);
	const costes = costesVehiculo({
		movimientos: movs.map((x) => ({
			tipo: x.m.tipo,
			importeCent: x.m.importeCent,
			cuenta: x.m.cuentaContable ?? x.categoria?.cuentaContable ?? null,
			categoria: x.categoria?.nombre ?? null,
			color: x.categoria?.color ?? null
		})),
		kmRecorridos: metricas.recorridos,
		desde: v.fechaAlta ?? metricas.desde,
		hoy,
		horas: entradas.reduce((t, x) => t + (x.e.horas ?? 0), 0),
		tarifaHoraCent: ajustes.tarifaHoraCent,
		valorEstimadoCent: v.valorEstimadoCent
	});
	const gastos = movs.filter((x) => x.m.tipo === 'gasto');

	// Coste de uso al mes: combustible con el precio de hoy + papeles anualizados + mantenimiento repartido
	// Mejoras: qué implican (normativa, revisiones nuevas, tareas) y qué planes del vehículo dejan hechos
	const planesDelVeh = planes.filter((p) => planAplica(p, v, propios) || (p.vehiculoId === v.id && p.activo));
	const mejoras = Object.fromEntries(
		porReparar
			.filter((p) => p.tipo === 'mejora')
			.map((p) => {
				const texto = `${p.titulo} ${p.detalle ?? ''}`;
				return [p.id, { ...analizarMejora(texto, v), cubiertos: planesCubiertos(texto, planesDelVeh) }];
			})
	);
	// Sesión de taller recomendada: juntar lo que toca con lo que vence pronto
	const sesion =
		sesionesRecomendadas(await cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, vehiculoId: v.id, incluirOk: true }), planes, hoy).find((x) => x.vehiculoId === v.id) ?? null;

	const tipoVeh = await db.select({ nombre: s.tiposVehiculo.nombre }).from(s.tiposVehiculo).where(eq(s.tiposVehiculo.id, v.tipoId)).get();
	// Las motos no tienen campo «Combustible»: si no se dice otra cosa, gasolina
	const tipoComb = combustibleDe(v.campos.combustible) ?? (/moto/i.test(tipoVeh?.nombre ?? '') ? 'gasolina' : null);
	const precios = tipoComb ? await precioCombustibleHoy(locals) : null;
	const precio = tipoComb && precios ? precios[tipoComb] : null;
	// Consumo: el real de los repostajes (de lleno a lleno) si lo hay; si no, el que pusiste en la ficha
	const [repostajes, gasolinerasUsadas] = await Promise.all([
		db.select().from(s.repostajes).where(eq(s.repostajes.vehiculoId, id)).orderBy(desc(s.repostajes.fecha), desc(s.repostajes.id)),
		db.selectDistinct({ g: s.repostajes.gasolinera }).from(s.repostajes)
	]);
	const real = consumoReal(repostajes);
	const consumo = real.media ?? (Number(v.campos.consumo) || null);
	const usoMes = costeUsoMensual({
		hoy,
		kmMes: ritmo != null ? Math.round(ritmo * 30.44) : null,
		consumo,
		consumoEsReal: real.media != null,
		precioLitro: precio?.media ?? null,
		vencimientos: vencs.filter((x) => x.v.estado === 'vigente').map(({ v: x, tipo }) => ({ id: x.id, tipo: tipo.nombre, importeCent: x.importeCent, fechaInicio: x.fechaInicio, fechaVence: x.fechaVence })),
		gastos: gastos.map((x) => ({ fecha: x.m.fecha, importeCent: x.m.importeCent, categoria: x.categoria?.nombre ?? null, vencimientoId: x.m.vencimientoId }))
	});
	const combustibleInfo = tipoComb ? { tipo: tipoComb, precio, fecha: precios?.fecha ?? null, municipio: precios?.municipio ?? null } : null;
	const plantillasDelTipo = plantillasPara(tipoVeh?.nombre);
	const datos = {
		ficha: await cargarFicha(db, id, tipoVeh?.nombre ?? null),
		vehiculo: v,
		km,
		ritmo,
		lecturas: lecturas.map((l, i) => ({ ...l, sospechosa: malas.has(i) })),
		metricas,
		costes,
		usoMes,
		mejoras,
		sesion,
		combustibleInfo,
		repostajes,
		consumo: { real, ficha: Number(v.campos.consumo) || null },
		gasolineras: gasolinerasUsadas.map((x) => x.g).filter((g): g is string => Boolean(g)).sort(),
		inventario: (await cargarInventario(db))
			.filter((a) => a.tipo !== 'herramienta' && (!a.vehiculoIds.length || a.vehiculoIds.includes(id)))
			.map((a) => ({ id: a.id, nombre: a.nombre, unidad: a.unidad, cantidad: a.cantidad })),
		usos: entradas.length
			? (
					await db
						.select({ entradaId: s.stock.entradaId, articuloId: s.stock.articuloId, cantidad: s.stock.cantidad, nombre: s.articulos.nombre, unidad: s.articulos.unidad, valorCent: s.articulos.valorCent })
						.from(s.stock)
						.innerJoin(s.articulos, eq(s.stock.articuloId, s.articulos.id))
						.where(and(inArray(s.stock.entradaId, entradas.map((x) => x.e.id)), eq(s.stock.motivo, 'uso')))
				).map((u) => ({ ...u, cantidad: -u.cantidad }))
			: [],
		entradas: entradas.map((x) => ({
			...x.e,
			fase: x.fase,
			planes: planesDe(x.e.id).map((l) => ({ id: l.planId, nombre: l.nombre })),
			importe: movs.filter((m) => m.m.entradaId === x.e.id).reduce((a, m) => a + m.m.importeCent, 0),
			adjuntos: adjuntos.filter((a) => a.entidad === 'entrada' && a.entidadId === x.e.id)
		})),
		vencimientos,
		sinRegistrar,
		mantenimiento,
		movimientos: movs.map((x) => ({ ...x.m, categoria: x.categoria })),
		adjuntosMov: await adjuntosDe(db, 'movimiento', movs.map((x) => x.m.id)),
		facturas: await db.select().from(s.facturas).where(eq(s.facturas.vehiculoId, id)).orderBy(desc(s.facturas.fecha), desc(s.facturas.id)),
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
		fasesAbiertas: fasesAbiertas.filter((f) => abiertas.some((r) => r.id === f.restauracionId)),
		porReparar,
		plantillaSugerida: propios ? null : (plantillasDelTipo.find((p) => p.id === plantillaSugerida(v)?.id)?.id ?? null),
		plantillas: propios ? [] : plantillasDelTipo.map((p) => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, fuente: p.fuente, niveles: p.niveles.map((n) => ({ codigo: n.codigo, nombre: n.nombre, cadaDias: n.cadaDias, cadaMeses: n.cadaMeses, cadaKm: n.cadaKm, tareas: n.tareas, notas: n.notas ?? null })) })),
		adjuntosPend: await adjuntosDe(db, 'pendiente', porReparar.map((p) => p.id)),
		comprasPend: porReparar.length
			? await db.select().from(s.listaCompra).where(inArray(s.listaCompra.pendienteId, porReparar.map((p) => p.id))).orderBy(asc(s.listaCompra.id))
			: []
	};
	// La libreta de gastos del dueño (solo la ve él)
	const dueno = v.usuarioId != null && v.usuarioId === locals.yo?.id;
	// Privado: de quién es (si es de otro, solo lectura)
	const privadoDe = v.usuarioId != null ? ((await db.select({ nombre: s.usuarios.nombre }).from(s.usuarios).where(eq(s.usuarios.id, v.usuarioId)).get())?.nombre ?? 'otro usuario') : null;
	const libreta = dueno
		? await db.select().from(s.gastosPersonales).where(and(eq(s.gastosPersonales.vehiculoId, id), eq(s.gastosPersonales.usuarioId, locals.yo!.id))).orderBy(desc(s.gastosPersonales.fecha), desc(s.gastosPersonales.id))
		: [];
	const extra = { esDueno: dueno, soloLectura: esAjeno(locals.yo, id), privadoDe, libreta, resumenLibreta: dueno ? resumenLibreta(libreta, lecturas, hoy) : null };
	if (locals.permisos.includes('dinero')) return { ...datos, ...extra, verDinero: true as const };
	// Sin permiso de «Dinero»: fuera gastos, costes, importes, presupuestos y facturas (no llegan al navegador)
	return {
		...datos,
		...extra,
		verDinero: false as const,
		vehiculo: { ...datos.vehiculo, valorEstimadoCent: null },
		costes: null,
		usoMes: null,
		movimientos: [],
		adjuntosMov: {} as typeof datos.adjuntosMov,
		facturas: [],
		repostajes: [],
		totales: { gasto: 0, gastoAnio: 0, ingreso: 0 },
		vencimientos: datos.vencimientos.map((x) => ({ ...x, importeCent: null })),
		porReparar: datos.porReparar.map((p) => ({ ...p, presupuestoCent: null })),
		entradas: datos.entradas.map((e) => ({ ...e, importe: 0 })),
		usos: datos.usos.map((u) => ({ ...u, valorCent: null })),
		comprasPend: datos.comprasPend.map((c) => ({ ...c, precioEstimadoCent: null }))
	};
};

const vid = (p: { id: string }) => Number(p.id);

export const actions = {
	dato: accion(async ({ request, locals, params }) => {
		await guardarDato(locals, vid(params), await request.formData());
		return { mensaje: 'Ficha actualizada' };
	}),
	verificarDato: accion(async ({ request, locals, params }) => {
		const id = leer(await request.formData()).id('id');
		await locals.db.update(s.datosTecnicos).set({ verificado: true }).where(and(eq(s.datosTecnicos.id, id), eq(s.datosTecnicos.vehiculoId, vid(params))));
		return { mensaje: 'Marcado como verificado' };
	}),
	sugerencia: accion(async ({ request, locals, params }) => {
		const f = leer(await request.formData());
		await fijarDato(locals.db, vid(params), { seccion: f.texto('seccion') ?? 'otros', clave: f.obligatorio('clave', 'clave'), nombre: f.obligatorio('nombre', 'nombre'), valor: f.obligatorio('valor', 'valor'), unidad: f.texto('unidad'), fuente: f.texto('fuente'), verificado: true });
		return { mensaje: 'Guardado en la ficha' };
	}),
	importarFicha: accion(async ({ request, locals, params }) => {
		const r = await importarFicha(locals, vid(params), leer(await request.formData()).obligatorio('json', 'el archivo'));
		return { mensaje: `Importado: ${r.nuevos} datos${r.procedimientos ? ` y ${r.procedimientos} procedimientos` : ''}${r.respetados ? ` (${r.respetados} verificados que ya tenías se han respetado)` : ''}` };
	}),
	borradorIA: accion(async ({ locals, params, platform }) => {
		const ai = platform?.env.AI;
		if (!ai) throw new ErrorFormulario('La IA no está disponible en este entorno');
		const n = await borradorConIa(locals, ai, vid(params));
		return { mensaje: n ? `${n} datos propuestos por la IA: compruébalos antes de fiarte` : 'La IA no ha sabido nada con seguridad para los huecos vacíos' };
	}),
	procedimiento: accion(async ({ request, locals, params }) => {
		await guardarProcedimiento(locals, vid(params), await request.formData());
		return { mensaje: 'Procedimiento guardado' };
	}),
	borrarProcedimiento: accion(async ({ request, locals, params }) => {
		await locals.db.delete(s.procedimientos).where(and(eq(s.procedimientos.id, leer(await request.formData()).id('id')), eq(s.procedimientos.vehiculoId, vid(params))));
		return { mensaje: 'Procedimiento borrado' };
	}),
	gastoSimple: accion(async ({ request, locals, params }) => {
		await guardarGastoSimple(locals, vid(params), await request.formData());
		return { mensaje: 'Apuntado en tu libreta' };
	}),
	borrarGastoSimple: accion(async ({ request, locals }) => {
		await borrarGastoSimple(locals, leer(await request.formData()).id('id'));
		return { mensaje: 'Borrado de tu libreta' };
	}),
	km: accion(async ({ request, params, locals }) => {
		const f = leer(await request.formData());
		const km = f.entero('km');
		if (km == null) throw new ErrorFormulario('Indica los km');
		const fecha = f.fecha('fecha') ?? locals.hoy;
		await comprobarLectura(locals.db, vid(params), fecha, km);
		await registrarKm(locals.db, vid(params), fecha, km);
		return { mensaje: 'Kilómetros actualizados' };
	}),

	borrarLectura: accion(async ({ request, params, locals }) => {
		const id = leer(await request.formData()).id('id');
		await locals.db.delete(s.lecturasKm).where(and(eq(s.lecturasKm.id, id), eq(s.lecturasKm.vehiculoId, vid(params))));
		return { mensaje: 'Lectura borrada' };
	}),

	entrada: accion(async ({ request, params, locals, platform }) => {
		const r = await guardarEntrada(locals, vid(params), await request.formData(), platform!.env.ARCHIVOS);
		return { mensaje: r.nueva ? 'Entrada registrada' : 'Entrada actualizada', momento: r.nueva ? 'entradaCreada' : undefined, entradaId: r.entradaId };
	}),

	aplicarPlantilla: accion(async ({ request, params, locals }) => {
		const r = await aplicarPlantilla(locals, vid(params), leer(await request.formData()).obligatorio('plantilla'));
		return { mensaje: `${r.niveles} revisiones creadas${r.heredadas ? ` · ${r.heredadas} registros heredados de tu historial` : ''}` };
	}),

	factura: accion(async ({ request, params, locals }) => {
		const r = await crearFactura(locals, vid(params), await request.formData());
		return { mensaje: `${r.numero} generada`, facturaId: r.id, numero: r.numero };
	}),

	pendiente: accion(async ({ request, params, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		const pendienteId = await guardarPendiente(locals, vid(params), fd);
		return { mensaje: nuevo ? 'Apuntado en «Por reparar»' : 'Guardado', pendienteId };
	}),

	resolver: accion(async ({ request, params, locals, platform }) => {
		const r = await resolverPendiente(locals, vid(params), await request.formData(), platform!.env.ARCHIVOS);
		return { mensaje: 'Reparado. Pasa al historial', momento: 'tareaHecha', entradaId: r.entradaId };
	}),

	descartarPendiente: accion(async ({ request, params, locals }) => {
		const id = leer(await request.formData()).id('id');
		await locals.db
			.update(s.pendientes)
			.set({ estado: 'descartado', fechaCierre: locals.hoy })
			.where(and(eq(s.pendientes.id, id), eq(s.pendientes.vehiculoId, vid(params))));
		await cerrarCompras(locals.db, { pendienteId: id });
		return { mensaje: 'Descartado' };
	}),

	repostaje: accion(async ({ request, params, locals }) => {
		const fd = await request.formData();
		fd.set('vehiculoId', String(vid(params)));
		const r = await guardarRepostaje(locals, fd);
		return { mensaje: `Repostaje guardado (${(r.importe / 100).toFixed(2).replace('.', ',')} €)`, movimientoId: r.movimientoId };
	}),

	borrarRepostaje: accion(async ({ request, locals, platform }) => {
		await borrarRepostaje(locals, leer(await request.formData()).id('id'), platform!.env.ARCHIVOS);
		return { mensaje: 'Repostaje borrado' };
	}),

	borrarEntrada: accion(async ({ request, locals, platform }) => {
		await borrarEntrada(locals, platform!.env.ARCHIVOS, leer(await request.formData()).id('id'));
		return { mensaje: 'Entrada borrada' };
	}),

	/** Marca un mantenimiento como hecho hoy (o en la fecha dada). */
	hecho: accion(async ({ request, params, locals, platform }) => {
		const fd = await request.formData();
		fd.set('clase', 'mantenimiento');
		const r = await guardarEntrada(locals, vid(params), fd, platform!.env.ARCHIVOS);
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
		const movimientoId = await guardarMovimiento(locals, fd, { vehiculoId: vid(params) });
		return { mensaje: nuevo ? 'Movimiento registrado' : 'Movimiento actualizado', movimientoId };
	}),

	borrarGasto: accion(async ({ request, locals, platform }) => {
		await borrarMovimiento(locals, leer(await request.formData()).id('id'), platform!.env.ARCHIVOS);
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
