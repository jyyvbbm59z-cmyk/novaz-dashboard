import * as s from '@novaz/core/schema';
import { sql } from 'drizzle-orm';
import { ejercicioDeUrl } from '$lib/server/contabilidad';

export const load = async ({ locals, url }) => {
	const { db, hoy } = locals;
	const [m, a, i] = await db.batch([
		db.selectDistinct({ y: sql<string>`substr(${s.movimientos.fecha}, 1, 4)` }).from(s.movimientos),
		db.selectDistinct({ y: sql<string>`substr(${s.asientos.fecha}, 1, 4)` }).from(s.asientos),
		db.selectDistinct({ y: sql<string>`substr(${s.inmovilizado.fechaAlta}, 1, 4)` }).from(s.inmovilizado)
	]);
	const actual = Number(hoy.slice(0, 4));
	const desde = Math.min(actual, ...[...m, ...a, ...i].map((x) => Number(x.y)).filter(Boolean));
	return {
		ejercicio: ejercicioDeUrl(url, hoy),
		ejercicios: Array.from({ length: actual - desde + 1 }, (_, k) => actual - k)
	};
};
