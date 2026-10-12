import { SECCIONES_FICHA } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

/** Todo lo que cuenta la historia del vehículo, para el dossier (vender, enseñar, archivar). */
export const load = async ({ params, locals, url }) => {
	const id = Number(params.id);
	const { db } = locals;
	const fila = await db
		.select({ v: s.vehiculos, tipo: s.tiposVehiculo.nombre })
		.from(s.vehiculos)
		.innerJoin(s.tiposVehiculo, eq(s.vehiculos.tipoId, s.tiposVehiculo.id))
		.where(eq(s.vehiculos.id, id))
		.get();
	if (!fila) error(404, 'Vehículo no encontrado');
	const v = fila.v;
	const conCostes = url.searchParams.has('costes') && locals.permisos.includes('dinero');

	const [lectura, entradas, planesHechos, vencs, restas, datos, fotos, movs] = await Promise.all([
		db.select({ km: s.lecturasKm.km, fecha: s.lecturasKm.fecha }).from(s.lecturasKm).where(eq(s.lecturasKm.vehiculoId, id)).orderBy(desc(s.lecturasKm.km)).get(),
		db
			.select()
			.from(s.entradas)
			.where(and(eq(s.entradas.vehiculoId, id), inArray(s.entradas.clase, ['mantenimiento', 'reparacion', 'mejora'])))
			.orderBy(desc(s.entradas.fecha), desc(s.entradas.id)),
		db
			.select({ entradaId: s.entradasPlanes.entradaId, nombre: s.planesMantenimiento.nombre, codigo: s.planesMantenimiento.codigo })
			.from(s.entradasPlanes)
			.innerJoin(s.planesMantenimiento, eq(s.entradasPlanes.planId, s.planesMantenimiento.id))
			.innerJoin(s.entradas, eq(s.entradasPlanes.entradaId, s.entradas.id))
			.where(eq(s.entradas.vehiculoId, id)),
		db
			.select({ tipo: s.tiposVencimiento.nombre, vence: s.vencimientos.fechaVence })
			.from(s.vencimientos)
			.innerJoin(s.tiposVencimiento, eq(s.vencimientos.tipoId, s.tiposVencimiento.id))
			.where(and(eq(s.vencimientos.vehiculoId, id), eq(s.vencimientos.estado, 'vigente'))),
		db.select().from(s.restauraciones).where(eq(s.restauraciones.vehiculoId, id)).orderBy(asc(s.restauraciones.fechaInicio)),
		db.select().from(s.datosTecnicos).where(and(eq(s.datosTecnicos.vehiculoId, id), eq(s.datosTecnicos.verificado, true))),
		db.select({ id: s.adjuntos.id, clave: s.adjuntos.clave, mime: s.adjuntos.mime, pie: s.adjuntos.pie, creado: s.adjuntos.creado }).from(s.adjuntos).where(eq(s.adjuntos.vehiculoId, id)).orderBy(asc(s.adjuntos.creado)),
		conCostes
			? db
					.select({ importe: s.movimientos.importeCent, categoria: s.categorias.nombre })
					.from(s.movimientos)
					.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
					.where(and(eq(s.movimientos.vehiculoId, id), eq(s.movimientos.tipo, 'gasto')))
			: Promise.resolve([] as { importe: number; categoria: string | null }[])
	]);

	// Restauraciones: fases y horas
	const fases = restas.length ? await db.select().from(s.fases).where(inArray(s.fases.restauracionId, restas.map((r) => r.id))).orderBy(asc(s.fases.orden)) : [];
	const horas = (rid: number) => entradas.filter((e) => e.restauracionId === rid).reduce((t, e) => t + (e.horas ?? 0), 0);

	// Fotos: la primera y la última (antes/después) y hasta 6 más repartidas por el tiempo
	const imagenes = fotos.filter((f) => /^image\/(jpe?g|png|webp)/.test(f.mime));
	const portada = imagenes.find((f) => f.id === v.portadaId) ?? imagenes[imagenes.length - 1] ?? null;
	const reparto = imagenes.length <= 8 ? imagenes : Array.from({ length: 8 }, (_, i) => imagenes[Math.round((i * (imagenes.length - 1)) / 7)]);

	const porCategoria = new Map<string, number>();
	for (const m of movs) porCategoria.set(m.categoria ?? 'Otros', (porCategoria.get(m.categoria ?? 'Otros') ?? 0) + m.importe);

	return {
		dossier: {
			alias: v.alias,
			marca: v.marca,
			modelo: v.modelo,
			anio: v.anio,
			matricula: v.matricula,
			bastidor: v.bastidor,
			tipo: fila.tipo,
			km: lectura?.km ?? null,
			kmFecha: lectura?.fecha ?? null,
			portada: portada?.clave ?? null,
			papeles: vencs.sort((a, b) => a.vence.localeCompare(b.vence)),
			historial: entradas.map((e) => ({
				fecha: e.fecha,
				km: e.km,
				clase: e.clase,
				titulo: e.titulo,
				revisiones: planesHechos.filter((p) => p.entradaId === e.id).map((p) => (p.codigo ? `${p.codigo} ${p.nombre}` : p.nombre))
			})),
			restauraciones: restas.map((r) => ({
				nombre: r.nombre,
				estado: r.estado,
				desde: r.fechaInicio,
				hasta: r.fechaFin,
				horas: horas(r.id),
				fases: fases.filter((f) => f.restauracionId === r.id).map((f) => f.nombre)
			})),
			ficha: SECCIONES_FICHA.map((sec) => ({ seccion: sec.nombre, datos: datos.filter((d) => d.seccion === sec.clave).map((d) => ({ nombre: d.nombre, valor: `${d.valor}${d.unidad ? ` ${d.unidad}` : ''}`, detalle: d.detalle })) })).filter((x) => x.datos.length),
			fotos: reparto.map((f) => ({ clave: f.clave, pie: f.pie })),
			costes: conCostes ? { total: movs.reduce((t, m) => t + m.importe, 0), porCategoria: [...porCategoria.entries()].sort((a, b) => b[1] - a[1]) } : null
		}
	};
};
