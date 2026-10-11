import { analizarUso } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { desc, gte } from 'drizzle-orm';

/** Las páginas principales, para saber cuáles no se usan. */
const RUTAS = [
	'/', '/agenda', '/captura', '/flota', '/flota/[id]', '/restauraciones', '/restauraciones/[id]', '/contactos',
	'/local', '/inventario', '/inventario/reserva', '/inventario/recuento', '/compras',
	'/contabilidad', '/contabilidad/tesoreria', '/contabilidad/movimientos', '/contabilidad/facturas', '/contabilidad/nuevo',
	'/contabilidad/diario', '/contabilidad/mayor', '/contabilidad/resultados', '/contabilidad/balance', '/contabilidad/iva',
	'/contabilidad/inmovilizado', '/contabilidad/cuentas', '/ajustes'
];

export const load = async ({ locals, url }) => {
	const dias = [7, 30, 90].includes(Number(url.searchParams.get('dias'))) ? Number(url.searchParams.get('dias')) : 30;
	const desde = new Date(Date.now() - dias * 86_400_000).toISOString().replace('T', ' ').slice(0, 19);
	const eventos = await locals.db
		.select({ momento: s.uso.momento, ruta: s.uso.ruta, evento: s.uso.evento, nombre: s.uso.nombre, duracionMs: s.uso.duracionMs, datos: s.uso.datos, movil: s.uso.movil })
		.from(s.uso)
		.where(gte(s.uso.momento, desde))
		.orderBy(desc(s.uso.momento))
		.limit(20000);
	return { dias, analisis: analizarUso(eventos, RUTAS) };
};
