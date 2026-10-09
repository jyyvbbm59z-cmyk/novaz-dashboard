// Motor contable (PGC PYMES simplificado). Lógica pura: sin base de datos.
//
// Los asientos de movimientos, amortizaciones y liquidaciones de IVA se DERIVAN de los datos
// cada vez (nunca se descuadran al editar o borrar). Solo los asientos manuales se guardan.
import { diasEntre, sumarDias, sumarMeses } from './fechas';
import type { FormaPago } from './schema';

// ─── Cuentas clave ───────────────────────────────────────────────────────────

export const CUENTA_PAGO: Record<FormaPago, string> = { banco: '572', caja: '570', socio: '551' };
export const ETIQUETA_PAGO: Record<FormaPago, string> = { banco: 'Banco', caja: 'Caja', socio: 'Bolsillo del socio' };
export const CUENTA_GASTO_DEFECTO = '629';
export const CUENTA_INGRESO_DEFECTO = '759';
export const IVA_SOPORTADO = '472';
export const IVA_REPERCUTIDO = '477';
export const HP_ACREEDORA_IVA = '4750';
export const HP_DEUDORA_IVA = '4700';
export const TIPOS_IVA = [0, 4, 10, 21] as const;

export const CUENTAS_INMOVILIZADO = [
	['206', 'Aplicaciones informáticas'],
	['213', 'Maquinaria'],
	['214', 'Utillaje'],
	['215', 'Otras instalaciones'],
	['216', 'Mobiliario'],
	['217', 'Equipos informáticos'],
	['218', 'Elementos de transporte']
] as const;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Apunte {
	cuenta: string;
	debe: number;
	haber: number;
}

export type OrigenAsiento = 'manual' | 'movimiento' | 'amortizacion' | 'iva';

export interface Asiento {
	clave: string;
	fecha: string;
	concepto: string;
	origen: OrigenAsiento;
	refId: number | null;
	apuntes: Apunte[];
	/** Información de IVA para los libros registro (solo movimientos con IVA). */
	iva?: { tipo: 'soportado' | 'repercutido'; base: number; cuota: number; pct: number };
	/** Número correlativo dentro del ejercicio (lo asigna `numerar`). */
	numero?: number;
}

export interface MovimientoContable {
	id: number;
	fecha: string;
	tipo: 'gasto' | 'ingreso';
	importeCent: number;
	ivaPct: number;
	pago: FormaPago;
	concepto: string;
	cuentaContable: string | null;
}

export interface BienAmortizable {
	id: number;
	nombre: string;
	cuenta: string;
	fechaAlta: string;
	valorCent: number;
	valorResidualCent: number;
	vidaUtilMeses: number;
	fechaBaja: string | null;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

/** Separa un importe con IVA incluido en base y cuota (la cuota absorbe el redondeo). */
export function desglosarIva(total: number, pct: number): { base: number; cuota: number } {
	if (!pct) return { base: total, cuota: 0 };
	const base = Math.round((total * 100) / (100 + pct));
	return { base, cuota: total - base };
}

export function totales(apuntes: Apunte[]) {
	return apuntes.reduce((t, a) => ({ debe: t.debe + a.debe, haber: t.haber + a.haber }), { debe: 0, haber: 0 });
}

export function cuadra(apuntes: Apunte[]): boolean {
	const t = totales(apuntes);
	return t.debe === t.haber && t.debe > 0;
}

export const ejercicioDe = (fecha: string) => Number(fecha.slice(0, 4));

export function trimestreDe(fecha: string): { ejercicio: number; t: 1 | 2 | 3 | 4 } {
	return { ejercicio: ejercicioDe(fecha), t: (Math.floor((Number(fecha.slice(5, 7)) - 1) / 3) + 1) as 1 | 2 | 3 | 4 };
}

export function finTrimestre(ejercicio: number, t: number): string {
	return sumarDias(sumarMeses(`${ejercicio}-${String((t - 1) * 3 + 1).padStart(2, '0')}-01`, 3), -1);
}

/** Nombre de una cuenta: exacto o el de la cuenta "madre" más larga que coincida (5720001 → 572). */
export function nombreCuenta(codigo: string, plan: Map<string, string>): string {
	for (let n = codigo.length; n > 0; n--) {
		const nombre = plan.get(codigo.slice(0, n));
		if (nombre) return n === codigo.length ? nombre : `${nombre} (${codigo})`;
	}
	return `Cuenta ${codigo}`;
}

// ─── Generación de asientos ──────────────────────────────────────────────────

export function asientoDeMovimiento(m: MovimientoContable, cuentaCategoria: string | null): Asiento {
	const { base, cuota } = desglosarIva(m.importeCent, m.ivaPct);
	const tesoreria = CUENTA_PAGO[m.pago] ?? '572';
	const asiento: Asiento = { clave: `m${m.id}`, fecha: m.fecha, concepto: m.concepto, origen: 'movimiento', refId: m.id, apuntes: [] };
	if (m.tipo === 'gasto') {
		const cuenta = m.cuentaContable || cuentaCategoria || CUENTA_GASTO_DEFECTO;
		asiento.apuntes = [
			{ cuenta, debe: base, haber: 0 },
			...(cuota ? [{ cuenta: IVA_SOPORTADO, debe: cuota, haber: 0 }] : []),
			{ cuenta: tesoreria, debe: 0, haber: m.importeCent }
		];
		if (m.ivaPct) asiento.iva = { tipo: 'soportado', base, cuota, pct: m.ivaPct };
	} else {
		const cuenta = m.cuentaContable || cuentaCategoria || CUENTA_INGRESO_DEFECTO;
		asiento.apuntes = [
			{ cuenta: tesoreria, debe: m.importeCent, haber: 0 },
			{ cuenta, debe: 0, haber: base },
			...(cuota ? [{ cuenta: IVA_REPERCUTIDO, debe: 0, haber: cuota }] : [])
		];
		if (m.ivaPct) asiento.iva = { tipo: 'repercutido', base, cuota, pct: m.ivaPct };
	}
	return asiento;
}

/** Cuentas de gasto y de amortización acumulada para un bien (20x → 680/280, resto → 681/281). */
export function cuentasAmortizacion(cuentaBien: string) {
	return cuentaBien.startsWith('20') ? { gasto: '680', acumulada: '280' } : { gasto: '681', acumulada: '281' };
}

/**
 * Amortización lineal diaria. Un asiento por ejercicio (a 31/12), y el del ejercicio en curso
 * con lo devengado hasta `hoy`. El redondeo se hace sobre el acumulado: la suma cuadra al céntimo.
 */
export function asientosAmortizacion(b: BienAmortizable, hoy: string): Asiento[] {
	const amortizable = b.valorCent - b.valorResidualCent;
	if (amortizable <= 0 || b.vidaUtilMeses <= 0) return [];
	const finVida = sumarMeses(b.fechaAlta, b.vidaUtilMeses); // exclusivo
	const totalDias = diasEntre(b.fechaAlta, finVida);
	const limites = [finVida, sumarDias(hoy, 1)];
	if (b.fechaBaja) limites.push(sumarDias(b.fechaBaja, 1));
	const fin = limites.sort()[0]; // exclusivo
	if (fin <= b.fechaAlta) return [];

	const acumulado = (hasta: string) => Math.round((amortizable * Math.min(Math.max(diasEntre(b.fechaAlta, hasta), 0), totalDias)) / totalDias);
	const { gasto, acumulada } = cuentasAmortizacion(b.cuenta);
	const asientos: Asiento[] = [];
	for (let y = ejercicioDe(b.fechaAlta); y <= ejercicioDe(sumarDias(fin, -1)); y++) {
		const inicio = `${y}-01-01` > b.fechaAlta ? `${y}-01-01` : b.fechaAlta;
		const finAnio = `${y + 1}-01-01` < fin ? `${y + 1}-01-01` : fin;
		const cuota = acumulado(finAnio) - acumulado(inicio);
		if (cuota <= 0) continue;
		asientos.push({
			clave: `a${b.id}-${y}`,
			fecha: sumarDias(finAnio, -1),
			concepto: `Amortización ${b.nombre}`,
			origen: 'amortizacion',
			refId: b.id,
			apuntes: [
				{ cuenta: gasto, debe: cuota, haber: 0 },
				{ cuenta: acumulada, debe: 0, haber: cuota }
			]
		});
	}
	return asientos;
}

const saldoCuentaEn = (asientos: Asiento[], prefijo: string, filtro: (a: Asiento) => boolean) =>
	asientos.filter(filtro).reduce((s, a) => s + a.apuntes.filter((p) => p.cuenta.startsWith(prefijo)).reduce((x, p) => x + p.debe - p.haber, 0), 0);

/**
 * Liquidación trimestral del IVA (modelo 303 simulado) para cada trimestre ya cerrado:
 * salda 472/477 contra Hacienda; si sale a devolver se compensa en trimestres siguientes.
 */
export function asientosLiquidacionIva(asientos: Asiento[], hoy: string): Asiento[] {
	const trimestres = new Set<string>();
	for (const a of asientos) {
		if (a.origen === 'iva') continue;
		if (a.apuntes.some((p) => p.cuenta.startsWith(IVA_SOPORTADO) || p.cuenta.startsWith(IVA_REPERCUTIDO))) {
			const { ejercicio, t } = trimestreDe(a.fecha);
			trimestres.add(`${ejercicio}-${t}`);
		}
	}
	const orden = [...trimestres].sort((a, b) => {
		const [ya, ta] = a.split('-').map(Number);
		const [yb, tb] = b.split('-').map(Number);
		return ya - yb || ta - tb;
	});
	const resultado: Asiento[] = [];
	let aCompensar = 0;
	for (const clave of orden) {
		const [ejercicio, t] = clave.split('-').map(Number);
		const fin = finTrimestre(ejercicio, t);
		if (fin >= hoy) continue; // trimestre en curso: aún no se liquida
		const inicio = `${ejercicio}-${String((t - 1) * 3 + 1).padStart(2, '0')}-01`;
		const enTrimestre = (a: Asiento) => a.origen !== 'iva' && a.fecha >= inicio && a.fecha <= fin;
		const soportado = saldoCuentaEn(asientos, IVA_SOPORTADO, enTrimestre);
		const repercutido = -saldoCuentaEn(asientos, IVA_REPERCUTIDO, enTrimestre);
		const diferencia = repercutido - soportado;
		const apuntes: Apunte[] = [];
		if (repercutido) apuntes.push({ cuenta: IVA_REPERCUTIDO, debe: repercutido, haber: 0 });
		if (soportado) apuntes.push({ cuenta: IVA_SOPORTADO, debe: 0, haber: soportado });
		if (diferencia > 0) {
			const compensa = Math.min(aCompensar, diferencia);
			if (compensa) apuntes.push({ cuenta: HP_DEUDORA_IVA, debe: 0, haber: compensa });
			if (diferencia - compensa) apuntes.push({ cuenta: HP_ACREEDORA_IVA, debe: 0, haber: diferencia - compensa });
			aCompensar -= compensa;
		} else if (diferencia < 0) {
			apuntes.push({ cuenta: HP_DEUDORA_IVA, debe: -diferencia, haber: 0 });
			aCompensar += -diferencia;
		}
		if (!apuntes.length || !cuadra(apuntes)) continue;
		resultado.push({ clave: `iva${ejercicio}-${t}`, fecha: fin, concepto: `Liquidación IVA ${t}T ${ejercicio}`, origen: 'iva', refId: null, apuntes });
	}
	return resultado;
}

const ORDEN_ORIGEN: Record<OrigenAsiento, number> = { manual: 0, movimiento: 1, amortizacion: 2, iva: 3 };

/** Ordena cronológicamente y numera dentro de cada ejercicio. */
export function numerar(asientos: Asiento[]): Asiento[] {
	const orden = [...asientos].sort(
		(a, b) => a.fecha.localeCompare(b.fecha) || ORDEN_ORIGEN[a.origen] - ORDEN_ORIGEN[b.origen] || a.clave.localeCompare(b.clave, 'es', { numeric: true })
	);
	const contador = new Map<number, number>();
	return orden.map((a) => {
		const y = ejercicioDe(a.fecha);
		const n = (contador.get(y) ?? 0) + 1;
		contador.set(y, n);
		return { ...a, numero: n };
	});
}

// ─── Informes ────────────────────────────────────────────────────────────────

export interface SumaCuenta {
	cuenta: string;
	debe: number;
	haber: number;
	saldo: number; // debe - haber
}

export function sumasYSaldos(asientos: Asiento[]): SumaCuenta[] {
	const mapa = new Map<string, SumaCuenta>();
	for (const a of asientos)
		for (const p of a.apuntes) {
			const s = mapa.get(p.cuenta) ?? { cuenta: p.cuenta, debe: 0, haber: 0, saldo: 0 };
			s.debe += p.debe;
			s.haber += p.haber;
			s.saldo = s.debe - s.haber;
			mapa.set(p.cuenta, s);
		}
	return [...mapa.values()].sort((a, b) => a.cuenta.localeCompare(b.cuenta, 'es', { numeric: true }));
}

const empieza = (c: string, ...prefijos: string[]) => prefijos.some((p) => c.startsWith(p));

export interface LineaInforme {
	clave: string;
	etiqueta: string;
	importe: number;
	cuentas: { cuenta: string; importe: number }[];
}

const PYG: { clave: string; etiqueta: string; prefijos: string[]; excluir?: string[] }[] = [
	{ clave: 'cifra', etiqueta: 'Importe neto de la cifra de negocios', prefijos: ['70'] },
	{ clave: 'aprov', etiqueta: 'Aprovisionamientos', prefijos: ['60', '61'] },
	{ clave: 'otrosIngExp', etiqueta: 'Otros ingresos de explotación', prefijos: ['75'] },
	{ clave: 'personal', etiqueta: 'Gastos de personal', prefijos: ['64'] },
	{ clave: 'otrosGasExp', etiqueta: 'Otros gastos de explotación', prefijos: ['62', '63', '65', '69'], excluir: ['630'] },
	{ clave: 'amort', etiqueta: 'Amortización del inmovilizado', prefijos: ['68'] },
	{ clave: 'otros', etiqueta: 'Otros resultados', prefijos: ['67', '77'] },
	{ clave: 'ingFin', etiqueta: 'Ingresos financieros', prefijos: ['76'] },
	{ clave: 'gasFin', etiqueta: 'Gastos financieros', prefijos: ['66'] },
	{ clave: 'impuesto', etiqueta: 'Impuesto sobre beneficios', prefijos: ['630'] }
];

/** Cuenta de pérdidas y ganancias (modelo abreviado). Ingresos en positivo, gastos en negativo. */
export function perdidasYGanancias(sumas: SumaCuenta[]) {
	const lineas: Record<string, LineaInforme> = {};
	for (const def of PYG) {
		const cuentas = sumas
			.filter((s) => empieza(s.cuenta, ...def.prefijos) && !(def.excluir && empieza(s.cuenta, ...def.excluir)))
			.map((s) => ({ cuenta: s.cuenta, importe: -s.saldo }))
			.filter((c) => c.importe !== 0);
		lineas[def.clave] = { clave: def.clave, etiqueta: def.etiqueta, importe: cuentas.reduce((t, c) => t + c.importe, 0), cuentas };
	}
	const suma = (...ks: string[]) => ks.reduce((t, k) => t + lineas[k].importe, 0);
	const explotacion = suma('cifra', 'aprov', 'otrosIngExp', 'personal', 'otrosGasExp', 'amort', 'otros');
	const financiero = suma('ingFin', 'gasFin');
	const antesImpuestos = explotacion + financiero;
	return { lineas, explotacion, financiero, antesImpuestos, resultado: antesImpuestos + lineas.impuesto.importe };
}

/** Resultado (beneficio + / pérdida −) de un conjunto de asientos: grupos 6 y 7. */
export function resultadoDe(asientos: Asiento[]): number {
	let r = 0;
	for (const a of asientos) for (const p of a.apuntes) if (p.cuenta[0] === '6' || p.cuenta[0] === '7') r += p.haber - p.debe;
	return r;
}

export interface Balance {
	activo: { noCorriente: LineaInforme[]; corriente: LineaInforme[]; total: number };
	pnPasivo: { patrimonio: LineaInforme[]; noCorriente: LineaInforme[]; corriente: LineaInforme[]; total: number };
	cuadra: boolean;
}

/**
 * Balance de situación a una fecha. `asientos` = todos hasta esa fecha; `inicioEjercicio` separa
 * el resultado del ejercicio de los de ejercicios anteriores (sin asientos de cierre: se calcula).
 */
export function balanceSituacion(asientos: Asiento[], inicioEjercicio: string): Balance {
	const sumas = sumasYSaldos(asientos).filter((s) => s.saldo !== 0);
	const linea = (clave: string, etiqueta: string, cuentas: { cuenta: string; importe: number }[]): LineaInforme => ({
		clave,
		etiqueta,
		importe: cuentas.reduce((t, c) => t + c.importe, 0),
		cuentas
	});
	// Activo: saldo deudor en positivo. Pasivo/PN: saldo acreedor en positivo.
	const usadas = new Set<string>();
	const act = (f: (c: string) => boolean, signo: 'deudor' | 'acreedor' | 'ambos' = 'ambos') =>
		sumas
			.filter((s) => !usadas.has(s.cuenta) && f(s.cuenta) && (signo === 'ambos' || (signo === 'deudor' ? s.saldo > 0 : s.saldo < 0)))
			.map((s) => (usadas.add(s.cuenta), { cuenta: s.cuenta, importe: s.saldo }));
	const pas = (f: (c: string) => boolean, signo: 'deudor' | 'acreedor' | 'ambos' = 'ambos') => act(f, signo).map((c) => ({ ...c, importe: -c.importe }));
	const resultadoCuenta = (c: string) => c[0] === '6' || c[0] === '7';

	const noCorrienteA = [
		linea('intangible', 'Inmovilizado intangible', act((c) => empieza(c, '20', '280'))),
		linea('material', 'Inmovilizado material', act((c) => empieza(c, '21', '23', '28'))),
		linea('otrasInv', 'Otras inversiones a largo plazo', act((c) => c[0] === '2'))
	];
	const corrienteA = [
		linea('existencias', 'Existencias', act((c) => c[0] === '3')),
		linea('deudores', 'Deudores comerciales y otras cuentas a cobrar', act((c) => empieza(c, '40', '41', '43', '44', '46', '47'), 'deudor')),
		linea('socios', 'Socios', act((c) => empieza(c, '55'), 'deudor')),
		linea('tesoreria', 'Efectivo y otros activos líquidos', act((c) => empieza(c, '57'), 'deudor'))
	];

	const resultadoEjercicio = resultadoDe(asientos.filter((a) => a.fecha >= inicioEjercicio));
	const resultadoAnteriores = resultadoDe(asientos.filter((a) => a.fecha < inicioEjercicio));
	for (const s of sumas) if (resultadoCuenta(s.cuenta)) usadas.add(s.cuenta);
	const patrimonio = [
		linea('capital', 'Capital', pas((c) => empieza(c, '10'))),
		linea('reservas', 'Reservas', pas((c) => empieza(c, '11'))),
		linea('anteriores', 'Resultados de ejercicios anteriores', [
			...pas((c) => empieza(c, '12') && !empieza(c, '129')),
			...(resultadoAnteriores ? [{ cuenta: '120', importe: resultadoAnteriores }] : [])
		]),
		linea('resultado', 'Resultado del ejercicio', [
			...pas((c) => empieza(c, '129')),
			...(resultadoEjercicio ? [{ cuenta: '129', importe: resultadoEjercicio }] : [])
		]),
		linea('otrosPN', 'Otras partidas de patrimonio', pas((c) => empieza(c, '13')))
	];
	const noCorrienteP = [linea('deudasLP', 'Deudas a largo plazo', pas((c) => c[0] === '1'))];
	const corrienteP = [
		linea('deudasCP', 'Deudas a corto plazo', pas((c) => empieza(c, '50', '51', '52'), 'acreedor')),
		linea('acreedores', 'Acreedores comerciales y otras cuentas a pagar', pas((c) => empieza(c, '40', '41', '43', '44', '46', '47'), 'acreedor')),
		linea('sociosP', 'Deudas con socios', pas((c) => empieza(c, '55'), 'acreedor')),
		linea('descubierto', 'Descubiertos bancarios', pas((c) => empieza(c, '57'), 'acreedor'))
	];
	// Lo que no encaja en ninguna partida va a "otros" según su signo: el balance siempre cuadra.
	corrienteA.push(linea('otrosAC', 'Otros activos corrientes', act(() => true, 'deudor')));
	corrienteP.push(linea('otrosPC', 'Otros pasivos corrientes', pas(() => true, 'acreedor')));

	const total = (ls: LineaInforme[]) => ls.reduce((t, l) => t + l.importe, 0);
	const totalActivo = total(noCorrienteA) + total(corrienteA);
	const totalPnPasivo = total(patrimonio) + total(noCorrienteP) + total(corrienteP);
	const limpiar = (ls: LineaInforme[]) => ls.filter((l) => l.cuentas.length);
	return {
		activo: { noCorriente: limpiar(noCorrienteA), corriente: limpiar(corrienteA), total: totalActivo },
		pnPasivo: { patrimonio: limpiar(patrimonio), noCorriente: limpiar(noCorrienteP), corriente: limpiar(corrienteP), total: totalPnPasivo },
		cuadra: totalActivo === totalPnPasivo
	};
}

export interface ResumenIva {
	ejercicio: number;
	t: number;
	repercutido: { base: number; cuota: number };
	soportado: { base: number; cuota: number };
	resultado: number;
	cerrado: boolean;
}

/** Libro registro resumido por trimestre (a partir de los movimientos con IVA). */
export function resumenIva(asientos: Asiento[], ejercicio: number, hoy: string): ResumenIva[] {
	return [1, 2, 3, 4].map((t) => {
		const r: ResumenIva = { ejercicio, t, repercutido: { base: 0, cuota: 0 }, soportado: { base: 0, cuota: 0 }, resultado: 0, cerrado: finTrimestre(ejercicio, t) < hoy };
		for (const a of asientos) {
			if (!a.iva) continue;
			const q = trimestreDe(a.fecha);
			if (q.ejercicio !== ejercicio || q.t !== t) continue;
			const destino = a.iva.tipo === 'repercutido' ? r.repercutido : r.soportado;
			destino.base += a.iva.base;
			destino.cuota += a.iva.cuota;
		}
		r.resultado = r.repercutido.cuota - r.soportado.cuota;
		return r;
	});
}
