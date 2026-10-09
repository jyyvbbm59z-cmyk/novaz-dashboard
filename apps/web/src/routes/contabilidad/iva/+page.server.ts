import { delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';
import { resumenIva, trimestreDe } from '@novaz/core';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos } = await libros(locals);
	const delEj = delEjercicio(asientos, ejercicio);
	return {
		trimestres: resumenIva(asientos, ejercicio, locals.hoy),
		liquidaciones: delEj.filter((a) => a.origen === 'iva').map((a) => ({ t: trimestreDe(a.fecha).t, apuntes: a.apuntes })),
		registro: delEj
			.filter((a) => a.iva)
			.map((a) => ({ numero: a.numero, fecha: a.fecha, concepto: a.concepto, ...a.iva!, t: trimestreDe(a.fecha).t }))
	};
};
