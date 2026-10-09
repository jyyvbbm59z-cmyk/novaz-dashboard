import { nombreCuenta, perdidasYGanancias, sumasYSaldos } from '@novaz/core';
import { delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos, plan } = await libros(locals);
	const actual = perdidasYGanancias(sumasYSaldos(delEjercicio(asientos, ejercicio)));
	const anterior = perdidasYGanancias(sumasYSaldos(delEjercicio(asientos, ejercicio - 1)));
	const nombres: Record<string, string> = {};
	for (const l of [...Object.values(actual.lineas), ...Object.values(anterior.lineas)]) for (const c of l.cuentas) nombres[c.cuenta] = nombreCuenta(c.cuenta, plan);
	return {
		actual,
		anterior,
		nombres,
		impuestoEstimado: Math.round((Math.max(actual.antesImpuestos, 0) * locals.ajustes.tipoImpuestoSociedades) / 100)
	};
};
