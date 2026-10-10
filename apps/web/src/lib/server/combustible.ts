import { descargarPrecios, type PreciosCombustible } from '@novaz/core';
import * as s from '@novaz/core/schema';

/** Precio del combustible de hoy: el guardado si es de hoy; si no, lo descarga (rápido) y lo guarda. */
export async function precioCombustibleHoy(locals: App.Locals): Promise<PreciosCombustible | null> {
	const { ajustes, hoy, db } = locals;
	const guardado = ajustes.precioCombustible;
	if (guardado && guardado.fecha === hoy && guardado.municipio === ajustes.municipioCombustible.nombre) return guardado;
	try {
		const precios = await descargarPrecios(ajustes.municipioCombustible, hoy, { timeoutMs: 4000 });
		await db.insert(s.ajustes).values({ clave: 'precioCombustible', valor: precios }).onConflictDoUpdate({ target: s.ajustes.clave, set: { valor: precios } });
		return precios;
	} catch (e) {
		console.warn('Precio del combustible no disponible:', (e as Error).message);
		return guardado; // el último conocido, aunque sea de otro día
	}
}
