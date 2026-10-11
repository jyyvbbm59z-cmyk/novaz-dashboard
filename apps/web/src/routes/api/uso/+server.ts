import * as s from '@novaz/core/schema';

/** Recibe lotes de eventos de uso del navegador (máximo 100 por lote). */
export const POST = async ({ request, locals }) => {
	let lote: unknown;
	try {
		lote = await request.json();
	} catch {
		return new Response(null, { status: 400 });
	}
	if (!Array.isArray(lote)) return new Response(null, { status: 400 });
	const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : null);
	const filas = lote.slice(0, 100).flatMap((e) => {
		if (!e || typeof e !== 'object' || typeof e.evento !== 'string') return [];
		return [
			{
				momento: txt(e.momento, 19) ?? undefined,
				sesion: txt(e.sesion, 40),
				ruta: txt(e.ruta, 120),
				evento: e.evento.slice(0, 30),
				nombre: txt(e.nombre, 120),
				duracionMs: Number.isFinite(e.duracionMs) ? Math.round(Math.min(e.duracionMs, 86_400_000)) : null,
				datos: e.datos && typeof e.datos === 'object' ? e.datos : null,
				movil: e.movil === true
			}
		];
	});
	// De 10 en 10: D1 admite 100 variables por sentencia y cada fila lleva 9
	for (let i = 0; i < filas.length; i += 10) await locals.db.insert(s.uso).values(filas.slice(i, i + 10));
	return new Response(null, { status: 204 });
};
