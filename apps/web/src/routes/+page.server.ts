import * as s from '@novaz/core/schema';
import { and, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { avanceRestauraciones } from '$lib/server/datos';
import { diasEntre, estadoTaller, flujoDeCaja } from '@novaz/core';
import { libros } from '$lib/server/contabilidad';

export const load = async ({ locals, parent }) => {
	const { db, hoy } = locals;
	const anio = hoy.slice(0, 4);

	const [restas, entradas, porCategoria, { asientos }] = await Promise.all([
		db
			.select({ r: s.restauraciones, vehiculo: s.vehiculos.alias, portada: s.adjuntos.clave })
			.from(s.restauraciones)
			.innerJoin(s.vehiculos, eq(s.restauraciones.vehiculoId, s.vehiculos.id))
			.leftJoin(s.adjuntos, eq(s.vehiculos.portadaId, s.adjuntos.id))
			.where(inArray(s.restauraciones.estado, ['en_curso', 'pausada', 'planificada']))
			.orderBy(desc(s.restauraciones.fechaInicio)),
		db
			.select({ e: s.entradas, vehiculo: s.vehiculos.alias })
			.from(s.entradas)
			.innerJoin(s.vehiculos, eq(s.entradas.vehiculoId, s.vehiculos.id))
			.orderBy(desc(s.entradas.fecha), desc(s.entradas.id))
			.limit(6),
		db
			.select({ nombre: s.categorias.nombre, color: s.categorias.color, total: sql<number>`sum(${s.movimientos.importeCent})` })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			// Los ajustes de cuadre no son gasto del taller
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.fecha, `${anio}-01-01`), lte(s.movimientos.fecha, hoy), isNull(s.movimientos.cuadreSaldoCent)))
			.groupBy(s.movimientos.categoriaId)
			.orderBy(desc(sql`sum(${s.movimientos.importeCent})`))
			.limit(5),
		libros(locals)
	]);

	// Dinero: lo que hay (banco + caja) y lo que entra y sale (cuentas 57)
	const saldo = (pref: string) => asientos.filter((a) => a.fecha <= hoy).reduce((t, a) => t + a.apuntes.filter((p) => p.cuenta.startsWith(pref)).reduce((x, p) => x + p.debe - p.haber, 0), 0);
	const flujo = flujoDeCaja(asientos, Number(anio));
	const mesN = Number(hoy.slice(5, 7));
	const hastaHoy = flujo.meses.filter((m) => m.mes <= mesN);
	const dinero = {
		banco: saldo('572'),
		caja: saldo('570'),
		mes: { entradas: flujo.meses[mesN - 1].entradas, salidas: flujo.meses[mesN - 1].salidas },
		anio: { entradas: hastaHoy.reduce((t, m) => t + m.entradas, 0), salidas: hastaHoy.reduce((t, m) => t + m.salidas, 0) },
		diasCuadre: locals.ajustes.ultimoCuadre ? diasEntre(locals.ajustes.ultimoCuadre, hoy) : null
	};

	const avances = await avanceRestauraciones(db, restas.map((x) => x.r.id));

	// El local, la lista de la compra y las herramientas fuera de su sitio
	const { alertas } = await parent();
	const t = await estadoTaller(db, hoy, alertas);
	const taller = { local: t.local.slice(0, 3), localTotal: t.local.length, compras: t.compras, fueraDeSitio: t.fueraDeSitio };
	return {
		taller,
		restauraciones: restas.map((x) => {
			const a = avances.get(x.r.id);
			return { ...x.r, vehiculo: x.vehiculo, portada: x.portada, avance: a && a.total ? a.hechas / a.total : 0 };
		}),
		entradas: entradas.map((x) => ({ ...x.e, vehiculo: x.vehiculo })),
		dinero,
		gasto: {
			categorias: porCategoria.map((c) => ({ nombre: c.nombre ?? 'Sin categoría', color: c.color ?? '#6c727c', total: Number(c.total) }))
		}
	};
};
