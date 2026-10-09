import { balanceSituacion, nombreCuenta, sumasYSaldos } from '@novaz/core';
import { corte, delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos, plan } = await libros(locals);
	const fecha = corte(ejercicio, locals.hoy);
	const balance = balanceSituacion(
		asientos.filter((a) => a.fecha <= fecha),
		`${ejercicio}-01-01`
	);
	const sumas = sumasYSaldos(delEjercicio(asientos, ejercicio)).map((s) => ({ ...s, nombre: nombreCuenta(s.cuenta, plan) }));
	const nombres: Record<string, string> = {};
	for (const grupo of [balance.activo.noCorriente, balance.activo.corriente, balance.pnPasivo.patrimonio, balance.pnPasivo.noCorriente, balance.pnPasivo.corriente])
		for (const l of grupo) for (const c of l.cuentas) nombres[c.cuenta] = nombreCuenta(c.cuenta, plan);
	return { balance, sumas, nombres, fecha };
};
