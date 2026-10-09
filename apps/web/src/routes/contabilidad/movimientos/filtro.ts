import * as s from '@novaz/core/schema';
import { TIPOS_MOVIMIENTO, type TipoMovimiento } from '@novaz/core/schema';
import { and, eq, isNull, like, type SQL } from 'drizzle-orm';

export function filtroMovimientos(url: URL, hoy: string) {
	const anio = url.searchParams.get('ejercicio') ?? hoy.slice(0, 4);
	const mes = url.searchParams.get('mes');
	const categoria = Number(url.searchParams.get('categoria')) || null;
	const vehiculo = url.searchParams.get('vehiculo');
	const tipo = url.searchParams.get('tipo');
	const conds: SQL[] = [like(s.movimientos.fecha, `${anio}${mes ? `-${mes.padStart(2, '0')}` : ''}%`)];
	if (categoria) conds.push(eq(s.movimientos.categoriaId, categoria));
	if (vehiculo === 'general') conds.push(isNull(s.movimientos.vehiculoId));
	else if (vehiculo) conds.push(eq(s.movimientos.vehiculoId, Number(vehiculo)));
	if (TIPOS_MOVIMIENTO.includes(tipo as TipoMovimiento)) conds.push(eq(s.movimientos.tipo, tipo as TipoMovimiento));
	return { where: and(...conds), filtros: { anio, mes, categoria, vehiculo, tipo } };
}
