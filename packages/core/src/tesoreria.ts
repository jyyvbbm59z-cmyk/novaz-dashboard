// Tesorería: flujo de caja real (de los asientos) y previsión (de las operaciones recurrentes).
import type { Asiento } from './contabilidad';
import { sumarMeses } from './fechas';
import type { TipoMovimiento } from './schema';

export const esTesoreria = (c: string) => c.startsWith('57');

export type ClaseFlujo = 'cobros' | 'pagos' | 'financiacion' | 'impuestos' | 'socio' | 'traspasos';

export const ETIQUETA_FLUJO: Record<ClaseFlujo, string> = {
	cobros: 'Cobros de clientes y ventas',
	pagos: 'Pagos a proveedores y gastos',
	financiacion: 'Aportaciones y préstamos',
	impuestos: 'Hacienda',
	socio: 'Socio (reembolsos)',
	traspasos: 'Traspasos banco ↔ caja'
};

/** Clasifica el movimiento de caja de un asiento según su contrapartida. */
export function claseFlujo(a: Asiento): ClaseFlujo {
	const otras = a.apuntes.filter((p) => !esTesoreria(p.cuenta)).map((p) => p.cuenta);
	if (!otras.length) return 'traspasos';
	if (otras.some((c) => c[0] === '7')) return 'cobros';
	if (otras.some((c) => c[0] === '6' || c[0] === '2' || c[0] === '3' || c.startsWith('40') || c.startsWith('41'))) return 'pagos';
	if (otras.some((c) => c.startsWith('47'))) return 'impuestos';
	if (otras.some((c) => c.startsWith('55'))) return 'socio';
	return 'financiacion';
}

export interface MesFlujo {
	mes: number; // 1-12
	entradas: number;
	salidas: number;
	neto: number;
	saldoFinal: number;
	porClase: Partial<Record<ClaseFlujo, number>>;
}

/** Flujo de caja mensual de un ejercicio (cuentas 57x), con el saldo arrastrado del anterior. */
export function flujoDeCaja(asientos: Asiento[], ejercicio: number) {
	const inicio = `${ejercicio}-01-01`;
	let saldo = 0;
	for (const a of asientos) if (a.fecha < inicio) for (const p of a.apuntes) if (esTesoreria(p.cuenta)) saldo += p.debe - p.haber;
	const saldoInicial = saldo;
	const meses: MesFlujo[] = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, entradas: 0, salidas: 0, neto: 0, saldoFinal: 0, porClase: {} }));
	for (const a of asientos) {
		if (!a.fecha.startsWith(String(ejercicio))) continue;
		const delta = a.apuntes.filter((p) => esTesoreria(p.cuenta)).reduce((t, p) => t + p.debe - p.haber, 0);
		const bruto = a.apuntes.filter((p) => esTesoreria(p.cuenta));
		if (!bruto.length) continue;
		const m = meses[Number(a.fecha.slice(5, 7)) - 1];
		const clase = claseFlujo(a);
		if (clase !== 'traspasos') {
			if (delta > 0) m.entradas += delta;
			else m.salidas += -delta;
		}
		m.porClase[clase] = (m.porClase[clase] ?? 0) + delta;
	}
	for (const m of meses) {
		m.neto = m.entradas - m.salidas;
		saldo += m.neto;
		m.saldoFinal = saldo;
	}
	return { saldoInicial, meses };
}

// ─── Recurrentes ─────────────────────────────────────────────────────────────

export interface ReglaRecurrente {
	dia: number;
	desde: string;
	hasta: string | null;
	ultimaGenerada: string | null;
	activo: boolean;
}

/** Fechas de una regla mensual entre (excluido) `despuesDe` y (incluido) `hasta`. */
export function fechasRecurrente(r: ReglaRecurrente, hasta: string, despuesDe: string | null = r.ultimaGenerada): string[] {
	if (!r.activo) return [];
	const fin = r.hasta && r.hasta < hasta ? r.hasta : hasta;
	const fechas: string[] = [];
	let mes = `${r.desde.slice(0, 7)}-01`;
	while (mes <= fin) {
		const ultimo = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate();
		const f = `${mes.slice(0, 8)}${String(Math.min(Math.max(r.dia, 1), ultimo)).padStart(2, '0')}`;
		if (f >= r.desde && f <= fin && (!despuesDe || f > despuesDe)) fechas.push(f);
		mes = sumarMeses(mes, 1);
	}
	return fechas;
}

/** Efecto en caja de una operación (positivo = entra dinero). El socio que paga no mueve la caja. */
export function efectoCaja(tipo: TipoMovimiento, importe: number, pago: string): number {
	if (pago === 'socio' && (tipo === 'gasto' || tipo === 'ingreso')) return 0;
	return tipo === 'ingreso' || tipo === 'aportacion' ? importe : -importe;
}

export interface MesPrevision {
	mes: string; // YYYY-MM
	recurrente: number;
	habitual: number;
	saldo: number;
	detalle: { concepto: string; importe: number }[];
}

/**
 * Previsión de tesorería mes a mes: operaciones recurrentes conocidas + el "gasto/ingreso habitual"
 * (media de los últimos meses sin contar recurrentes ni financiación).
 */
export function prevision(
	saldoHoy: number,
	hoy: string,
	recurrentes: (ReglaRecurrente & { concepto: string; tipo: TipoMovimiento; importeCent: number; pago: string })[],
	habitualMensual: number,
	meses = 6
): MesPrevision[] {
	const resultado: MesPrevision[] = [];
	let saldo = saldoHoy;
	for (let i = 0; i < meses; i++) {
		const inicioMes = sumarMeses(`${hoy.slice(0, 7)}-01`, i);
		const finMes = sumarMeses(inicioMes, 1); // exclusivo
		const desde = i === 0 ? hoy : `${inicioMes.slice(0, 7)}-00`; // '-00' < cualquier día del mes
		const detalle: { concepto: string; importe: number }[] = [];
		for (const r of recurrentes) {
			for (const f of fechasRecurrente({ ...r }, finMes, desde)) {
				if (f >= finMes) continue;
				const imp = efectoCaja(r.tipo, r.importeCent, r.pago);
				if (imp) detalle.push({ concepto: r.concepto, importe: imp });
			}
		}
		const recurrente = detalle.reduce((t, d) => t + d.importe, 0);
		// El mes en curso solo cuenta la parte que queda de "habitual"
		const fraccion = i === 0 ? Math.max(0, 1 - (Number(hoy.slice(8, 10)) - 1) / 30) : 1;
		const habitual = Math.round(habitualMensual * fraccion);
		saldo += recurrente + habitual;
		resultado.push({ mes: inicioMes.slice(0, 7), recurrente, habitual, saldo, detalle });
	}
	return resultado;
}

// ─── Cuadre con el banco ─────────────────────────────────────────────────────

export interface CuadreVivo {
	id: number;
	fecha: string;
	/** '572' banco o '570' caja. */
	cuenta: string;
	/** Saldo real que había en la cuenta al final de ese día. */
	saldoCent: number;
}

/**
 * Lo que debe valer cada ajuste de cuadre (con signo: + entra dinero) para que la cuenta tenga ese día
 * exactamente el saldo real. Lo que apuntes después con fecha anterior ya estaba en ese saldo, así que
 * el ajuste se recalcula y el saldo de hoy no se descuadra.
 * `asientos` no debe incluir los propios ajustes.
 */
export function diferenciasCuadre(asientos: Asiento[], cuadres: CuadreVivo[]): Map<number, number> {
	const orden = [...cuadres].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
	const resultado = new Map<number, number>();
	for (const c of orden) {
		let libro = 0;
		for (const a of asientos) if (a.fecha <= c.fecha) for (const p of a.apuntes) if (p.cuenta === c.cuenta) libro += p.debe - p.haber;
		for (const previo of orden) {
			if (previo === c) break;
			if (previo.cuenta === c.cuenta) libro += resultado.get(previo.id)!;
		}
		resultado.set(c.id, c.saldoCent - libro);
	}
	return resultado;
}
