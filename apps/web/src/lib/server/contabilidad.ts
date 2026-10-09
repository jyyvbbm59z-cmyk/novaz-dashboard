import { cargarContabilidad, ejercicioDe, type Asiento } from '@novaz/core';

/** Todos los libros (asientos manuales + derivados) para la petición en curso. */
export function libros(locals: App.Locals) {
	return cargarContabilidad(locals.db, locals.hoy);
}

export const delEjercicio = (asientos: Asiento[], ejercicio: number) => asientos.filter((a) => ejercicioDe(a.fecha) === ejercicio);

/** Fecha de corte de un ejercicio: el 31/12 o hoy si está en curso. */
export function corte(ejercicio: number, hoy: string) {
	const fin = `${ejercicio}-12-31`;
	return fin < hoy ? fin : hoy;
}

export function ejercicioDeUrl(url: URL, hoy: string) {
	const e = Number(url.searchParams.get('ejercicio'));
	return Number.isInteger(e) && e > 1900 ? e : Number(hoy.slice(0, 4));
}
