import * as s from '@novaz/core/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { guardarMovimiento } from '$lib/server/acciones';
import { accion, leer } from '$lib/server/form';
import { filtroMovimientos } from './filtro';

export const load = async ({ locals, url }) => {
	const { db, hoy } = locals;
	const { where, filtros } = filtroMovimientos(url, hoy);
	const [movs, anios, porMes] = await db.batch([
		db
			.select({ m: s.movimientos, categoria: s.categorias, vehiculo: s.vehiculos.alias })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			.leftJoin(s.vehiculos, eq(s.movimientos.vehiculoId, s.vehiculos.id))
			.where(where)
			.orderBy(desc(s.movimientos.fecha), desc(s.movimientos.id))
			.limit(500),
		db.selectDistinct({ anio: sql<string>`substr(${s.movimientos.fecha}, 1, 4)` }).from(s.movimientos),
		db
			.select({
				mes: sql<string>`substr(${s.movimientos.fecha}, 6, 2)`,
				tipo: s.movimientos.tipo,
				total: sql<number>`sum(${s.movimientos.importeCent})`
			})
			.from(s.movimientos)
			.where(sql`substr(${s.movimientos.fecha}, 1, 4) = ${filtros.anio}`)
			.groupBy(sql`1`, s.movimientos.tipo)
	]);

	const meses = Array.from({ length: 12 }, (_, i) => {
		const m = String(i + 1).padStart(2, '0');
		return {
			mes: m,
			gasto: Number(porMes.find((x) => x.mes === m && x.tipo === 'gasto')?.total ?? 0),
			ingreso: Number(porMes.find((x) => x.mes === m && x.tipo === 'ingreso')?.total ?? 0)
		};
	});
	const lista = movs.map((x) => ({ ...x.m, categoria: x.categoria, vehiculo: x.vehiculo }));
	return {
		movimientos: lista,
		filtros,
		anios: [...new Set([hoy.slice(0, 4), ...anios.map((a) => a.anio)])].sort().reverse(),
		meses,
		totales: {
			gasto: lista.filter((m) => m.tipo === 'gasto').reduce((a, m) => a + m.importeCent, 0),
			ingreso: lista.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.importeCent, 0)
		}
	};
};

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		await guardarMovimiento(locals, fd);
		return { mensaje: nuevo ? 'Movimiento registrado' : 'Movimiento actualizado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.movimientos).where(eq(s.movimientos.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Movimiento borrado' };
	})
};
