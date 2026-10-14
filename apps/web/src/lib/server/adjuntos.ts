import * as s from '@novaz/core/schema';
import { enTandas, type DB } from '@novaz/core';
import { and, eq, inArray } from 'drizzle-orm';

export async function borrarAdjuntos(db: DB, bucket: R2Bucket, ids: number[]) {
	if (!ids.length) return;
	const filas = await enTandas(ids, (p) => db.select().from(s.adjuntos).where(inArray(s.adjuntos.id, p)));
	if (!filas.length) return;
	await bucket.delete(filas.flatMap((f) => [f.clave, `${f.clave}.mini`]));
	await enTandas(ids, async (p) => void (await db.update(s.vehiculos).set({ portadaId: null }).where(inArray(s.vehiculos.portadaId, p))));
	await enTandas(ids, async (p) => void (await db.delete(s.adjuntos).where(inArray(s.adjuntos.id, p))));
}

/** Adjuntos de varias entidades del mismo tipo, agrupados por id. */
export async function adjuntosDe(db: DB, entidad: s.EntidadAdjunto, ids: number[]) {
	const mapa: Record<number, s.Adjunto[]> = {};
	if (!ids.length) return mapa;
	const filas = (
		await enTandas(ids, (p) =>
			db
				.select()
				.from(s.adjuntos)
				.where(and(eq(s.adjuntos.entidad, entidad), inArray(s.adjuntos.entidadId, p)))
		)
	).sort((a, b) => a.id - b.id);
	for (const f of filas) (mapa[f.entidadId] ??= []).push(f);
	return mapa;
}

/** Borra los adjuntos que cuelgan de una entidad (al borrar la entidad). */
export async function borrarAdjuntosDe(db: DB, bucket: R2Bucket, entidad: s.EntidadAdjunto, entidadId: number) {
	const filas = await db
		.select({ id: s.adjuntos.id })
		.from(s.adjuntos)
		.where(and(eq(s.adjuntos.entidad, entidad), eq(s.adjuntos.entidadId, entidadId)));
	await borrarAdjuntos(db, bucket, filas.map((f) => f.id));
}
