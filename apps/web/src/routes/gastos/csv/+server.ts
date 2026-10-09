import * as s from '@novaz/core/schema';
import { asc, eq } from 'drizzle-orm';
import { filtroMovimientos } from '../filtro';

const celda = (v: unknown) => {
	const t = v == null ? '' : String(v);
	return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// CSV con separador ";" y coma decimal: abre bien en Excel/LibreOffice en español.
export const GET = async ({ locals, url }) => {
	const { where, filtros } = filtroMovimientos(url, locals.hoy);
	const filas = await locals.db
		.select({ m: s.movimientos, categoria: s.categorias.nombre, vehiculo: s.vehiculos.alias, matricula: s.vehiculos.matricula })
		.from(s.movimientos)
		.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
		.leftJoin(s.vehiculos, eq(s.movimientos.vehiculoId, s.vehiculos.id))
		.where(where)
		.orderBy(asc(s.movimientos.fecha), asc(s.movimientos.id));
	const cab = ['fecha', 'tipo', 'importe', 'categoria', 'concepto', 'proveedor', 'vehiculo', 'matricula', 'notas'];
	const lineas = filas.map(({ m, categoria, vehiculo, matricula }) =>
		[m.fecha, m.tipo, ((m.tipo === 'gasto' ? -1 : 1) * m.importeCent / 100).toFixed(2).replace('.', ','), categoria, m.concepto, m.proveedor, vehiculo, matricula, m.notas]
			.map(celda)
			.join(';')
	);
	const nombre = `novaz-movimientos-${filtros.anio}${filtros.mes ? `-${filtros.mes}` : ''}.csv`;
	return new Response('﻿' + [cab.join(';'), ...lineas].join('\r\n'), {
		headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${nombre}"` }
	});
};
