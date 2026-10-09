import { diasEntre, sumarDias, sumarMeses } from './fechas';

export type Nivel = 'vencido' | 'urgente' | 'pronto' | 'ok';

const GRAVEDAD: Record<Nivel, number> = { vencido: 0, urgente: 1, pronto: 2, ok: 3 };

export function peorNivel(...niveles: Nivel[]): Nivel {
	return niveles.reduce((a, b) => (GRAVEDAD[b] < GRAVEDAD[a] ? b : a), 'ok');
}

export function compararNivel(a: Nivel, b: Nivel): number {
	return GRAVEDAD[a] - GRAVEDAD[b];
}

export function nivelPorDias(dias: number, avisoDias: number, urgenteDias: number): Nivel {
	if (dias < 0) return 'vencido';
	if (dias <= urgenteDias) return 'urgente';
	if (dias <= avisoDias) return 'pronto';
	return 'ok';
}

// ─── Vencimientos (ITV, seguro, impuestos…) ──────────────────────────────────

export function estadoVencimiento(
	fechaVence: string,
	hoy: string,
	avisosDias: number[],
	urgenteDias = 7
): { dias: number; nivel: Nivel } {
	const dias = diasEntre(hoy, fechaVence);
	const avisoDias = avisosDias.length ? Math.max(...avisosDias) : 30;
	return { dias, nivel: nivelPorDias(dias, avisoDias, urgenteDias) };
}

// ─── Kilómetros ──────────────────────────────────────────────────────────────

export interface Lectura {
	fecha: string;
	km: number;
}

export function kmActual(lecturas: Lectura[]): number | null {
	return lecturas.length ? Math.max(...lecturas.map((l) => l.km)) : null;
}

/**
 * Ritmo de uso en km/día. Usa el último año si cubre al menos 30 días; si no, todo el historial.
 * Devuelve null si no hay datos suficientes (menos de 7 días de margen o sin avance).
 */
export function ritmoKmDia(lecturas: Lectura[], hoy: string, ventanaDias = 365): number | null {
	if (lecturas.length < 2) return null;
	const orden = [...lecturas].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.km - b.km);
	const desde = sumarDias(hoy, -ventanaDias);
	const recientes = orden.filter((l) => l.fecha >= desde);

	const calcular = (ls: Lectura[]) => {
		if (ls.length < 2) return null;
		const primera = ls[0];
		const ultima = ls[ls.length - 1];
		const dias = diasEntre(primera.fecha, ultima.fecha);
		const km = ultima.km - primera.km;
		return { dias, km };
	};

	let tramo = calcular(recientes);
	if (!tramo || tramo.dias < 30) tramo = calcular(orden);
	if (!tramo || tramo.dias < 7 || tramo.km <= 0) return null;
	return tramo.km / tramo.dias;
}

// ─── Mantenimiento periódico ─────────────────────────────────────────────────

export interface Plan {
	cadaKm: number | null;
	cadaMeses: number | null;
	avisoKm: number;
	avisoDias: number;
}

export interface EstadoMantenimiento {
	sinHistorial: boolean;
	proximaFecha: string | null;
	proximoKm: number | null;
	kmRestantes: number | null;
	/** Días hasta el próximo, tomando lo que llegue antes (fecha o km estimados). */
	diasRestantes: number | null;
	motivo: 'fecha' | 'km' | null;
	nivel: Nivel;
}

export function estadoMantenimiento(
	plan: Plan,
	ultima: { fecha: string; km: number | null } | null,
	opts: { hoy: string; kmActual: number | null; ritmo: number | null; urgenteDias?: number }
): EstadoMantenimiento {
	const urgenteDias = opts.urgenteDias ?? 7;
	if (!ultima) {
		return { sinHistorial: true, proximaFecha: null, proximoKm: null, kmRestantes: null, diasRestantes: null, motivo: null, nivel: 'ok' };
	}

	const proximaFecha = plan.cadaMeses ? sumarMeses(ultima.fecha, plan.cadaMeses) : null;
	const diasFecha = proximaFecha ? diasEntre(opts.hoy, proximaFecha) : null;
	const nivelFecha = diasFecha != null ? nivelPorDias(diasFecha, plan.avisoDias, urgenteDias) : 'ok';

	const proximoKm = plan.cadaKm && ultima.km != null ? ultima.km + plan.cadaKm : null;
	const kmRestantes = proximoKm != null && opts.kmActual != null ? proximoKm - opts.kmActual : null;
	const diasKm = kmRestantes != null && opts.ritmo ? Math.floor(Math.max(kmRestantes, -1) / opts.ritmo) : null;

	let nivelKm: Nivel = 'ok';
	if (kmRestantes != null) {
		if (kmRestantes < 0) nivelKm = 'vencido';
		else if (kmRestantes <= plan.avisoKm / 2) nivelKm = 'urgente';
		else if (kmRestantes <= plan.avisoKm) nivelKm = 'pronto';
		if (diasKm != null) nivelKm = peorNivel(nivelKm, nivelPorDias(diasKm, plan.avisoDias, urgenteDias));
	}

	const candidatos = [
		diasFecha != null ? { dias: diasFecha, motivo: 'fecha' as const } : null,
		diasKm != null ? { dias: diasKm, motivo: 'km' as const } : null
	].filter((c) => c != null);
	candidatos.sort((a, b) => a.dias - b.dias);

	const nivel = peorNivel(nivelFecha, nivelKm);
	let motivo = candidatos[0]?.motivo ?? (kmRestantes != null ? 'km' : null);
	// Si el km ya está vencido/urgente pero no hay ritmo para estimar días, el motivo es el km.
	if (nivelKm !== 'ok' && compararNivel(nivelKm, nivelFecha) < 0) motivo = 'km';

	return {
		sinHistorial: false,
		proximaFecha,
		proximoKm,
		kmRestantes,
		diasRestantes: candidatos[0]?.dias ?? null,
		motivo,
		nivel
	};
}

export function planAplica(
	plan: { vehiculoId: number | null; tipoVehiculoId: number | null; activo: boolean },
	vehiculo: { id: number; tipoId: number }
): boolean {
	if (!plan.activo) return false;
	if (plan.vehiculoId != null) return plan.vehiculoId === vehiculo.id;
	return plan.tipoVehiculoId == null || plan.tipoVehiculoId === vehiculo.tipoId;
}

export function tipoVencimientoAplica(tipo: { tiposVehiculoIds: number[]; activo: boolean }, tipoVehiculoId: number): boolean {
	return tipo.activo && (tipo.tiposVehiculoIds.length === 0 || tipo.tiposVehiculoIds.includes(tipoVehiculoId));
}

// ─── Avisos (deduplicación) ──────────────────────────────────────────────────

/**
 * Umbral de aviso alcanzado: 'vencido' si ya pasó, o el menor umbral (en días) que se ha cruzado.
 * null si aún no toca avisar.
 */
export function umbralAlcanzado(dias: number, avisosDias: number[]): number | 'vencido' | null {
	if (dias < 0) return 'vencido';
	const cruzados = avisosDias.filter((t) => dias <= t);
	return cruzados.length ? Math.min(...cruzados) : null;
}
