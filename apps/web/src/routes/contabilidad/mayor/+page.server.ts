import { nombreCuenta, sumasYSaldos } from '@novaz/core';
import { corte, delEjercicio, ejercicioDeUrl, libros } from '$lib/server/contabilidad';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	const { asientos, cuentas, plan } = await libros(locals);
	const delEj = delEjercicio(asientos, ejercicio);
	const cuenta = url.searchParams.get('cuenta');
	const inicio = `${ejercicio}-01-01`;

	// Cuentas con actividad (para elegir)
	const activas = sumasYSaldos(asientos.filter((a) => a.fecha <= corte(ejercicio, locals.hoy))).map((s) => ({ ...s, nombre: nombreCuenta(s.cuenta, plan) }));

	if (!cuenta) return { cuenta: null, activas, cuentas };

	const coincide = (c: string) => c === cuenta || c.startsWith(cuenta);
	// Las cuentas de balance (grupos 1-5) arrastran saldo de ejercicios anteriores; las de resultados empiezan de cero.
	const deBalance = Number(cuenta[0]) <= 5;
	const saldoInicial = deBalance
		? asientos.filter((a) => a.fecha < inicio).reduce((t, a) => t + a.apuntes.filter((p) => coincide(p.cuenta)).reduce((s, p) => s + p.debe - p.haber, 0), 0)
		: 0;
	let saldo = saldoInicial;
	const lineas = delEj.flatMap((a) =>
		a.apuntes
			.filter((p) => coincide(p.cuenta))
			.map((p) => {
				saldo += p.debe - p.haber;
				return { numero: a.numero, fecha: a.fecha, concepto: a.concepto, cuenta: p.cuenta, debe: p.debe, haber: p.haber, saldo, origen: a.origen };
			})
	);
	return { cuenta, nombre: nombreCuenta(cuenta, plan), saldoInicial, lineas, activas, cuentas };
};
