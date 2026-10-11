// Agenda de los próximos meses y sesiones de taller recomendadas (juntar revisiones que vencen cerca).
import type { Nivel } from './alertas';
import type { Alerta } from './consultas';
import { sumarDias, sumarMeses } from './fechas';
import { piezasDeTareas } from './inventario';
import { expandirIncluidos } from './revisiones';
import { fechasRecurrente, type ReglaRecurrente } from './tesoreria';
import type { TipoMovimiento } from './schema';

export interface EventoAgenda {
	clave: string;
	fecha: string;
	tipo: 'papel' | 'revision' | 'local' | 'recurrente';
	titulo: string;
	contexto: string;
	/** Céntimos; negativo = sale dinero, positivo = entra. null = sin importe conocido. */
	importeCent: number | null;
	/** Fecha calculada (revisiones por km con tu ritmo) o importe aproximado. */
	estimado: boolean;
	nivel: Nivel | null;
	href: string;
}

/** Planes rutinarios (cada pocos días o cada mes) no van a la agenda: la llenarían de ruido. */
const esRutinario = (p: { cadaDias: number | null; cadaMeses: number | null; cadaKm: number | null }) => p.cadaDias != null || (p.cadaMeses != null && p.cadaMeses <= 1 && !p.cadaKm);

export function eventosAgenda(o: {
	hoy: string;
	meses?: number;
	alertas: Alerta[];
	/** Importe de cada papel vigente (para prever lo que costará renovarlo). */
	importesPapel: Map<number, number | null>;
	planes: { id: number; cadaDias: number | null; cadaMeses: number | null; cadaKm: number | null }[];
	tareasLocal: { id: number; titulo: string; zona: string | null; fechaLimite: string | null }[];
	recurrentes: (ReglaRecurrente & { id: number; concepto: string; tipo: TipoMovimiento; importeCent: number })[];
}): EventoAgenda[] {
	const hasta = sumarMeses(o.hoy, o.meses ?? 12);
	const ev: EventoAgenda[] = [];
	for (const a of o.alertas) {
		if (a.dias == null) continue;
		const fecha = sumarDias(o.hoy, a.dias);
		if (fecha > hasta) continue;
		if (a.tipo === 'vencimiento') {
			const id = Number(a.clave.split(':')[1]);
			const importe = o.importesPapel.get(id) ?? null;
			ev.push({ clave: a.clave, fecha, tipo: 'papel', titulo: a.titulo, contexto: a.vehiculo, importeCent: importe != null ? -importe : null, estimado: importe != null, nivel: a.nivel, href: `/flota/${a.vehiculoId}?pestana=papeles` });
		} else if (a.tipo === 'mantenimiento') {
			const plan = o.planes.find((p) => p.id === a.planId);
			if (plan && esRutinario(plan)) continue;
			ev.push({ clave: a.clave, fecha, tipo: 'revision', titulo: a.titulo, contexto: a.vehiculo, importeCent: null, estimado: a.kmRestantes != null, nivel: a.nivel, href: `/flota/${a.vehiculoId}?pestana=mantenimiento` });
		}
	}
	for (const t of o.tareasLocal) {
		if (!t.fechaLimite || t.fechaLimite > hasta) continue;
		ev.push({ clave: `local:${t.id}`, fecha: t.fechaLimite, tipo: 'local', titulo: t.titulo, contexto: t.zona ? `El local · ${t.zona}` : 'El local', importeCent: null, estimado: false, nivel: t.fechaLimite < o.hoy ? 'vencido' : null, href: '/local' });
	}
	for (const r of o.recurrentes) {
		for (const f of fechasRecurrente(r, hasta, o.hoy)) {
			const entra = r.tipo === 'ingreso' || r.tipo === 'aportacion';
			ev.push({ clave: `rec:${r.id}:${f}`, fecha: f, tipo: 'recurrente', titulo: r.concepto, contexto: 'Cada mes', importeCent: entra ? r.importeCent : -r.importeCent, estimado: false, nivel: null, href: '/contabilidad/tesoreria' });
		}
	}
	return ev.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo));
}

// ─── Sesiones de taller recomendadas ─────────────────────────────────────────

export interface SesionRecomendada {
	vehiculoId: number;
	vehiculo: string;
	/** Cuándo conviene hacerla: lo que antes vence de lo que ya toca. */
	fecha: string;
	/** Revisiones que tocan ya (o están cerca de tocar). */
	tocan: { planId: number; titulo: string }[];
	/** Las que se adelantan para aprovechar la sesión. */
	adelantar: { planId: number; titulo: string; cuando: string }[];
	piezas: string[];
	/** La ITV está cerca: conviene una revisión previa. */
	antesDeItv: string | null;
}

/** Ventana para adelantar: lo que vence en los próximos 60 días o 1.500 km se hace en la misma sesión. */
export const VENTANA_DIAS = 60;
export const VENTANA_KM = 1500;

export const REVISION_PRE_ITV = [
	'Luces: cruce, carretera, posición, freno, intermitentes, matrícula y antiniebla',
	'Neumáticos: dibujo (mín. 1,6 mm), estado y presión',
	'Frenos: que frene recto; freno de mano',
	'Escobillas y líquido limpiaparabrisas',
	'Bocina, cinturones y testigos del cuadro',
	'Fugas de aceite o refrigerante y estado del escape'
];

export function sesionesRecomendadas(
	alertas: Alerta[],
	planes: { id: number; tareas: string[]; incluye: number[]; cadaDias: number | null; cadaMeses: number | null; cadaKm: number | null }[],
	hoy: string
): SesionRecomendada[] {
	const sesiones: SesionRecomendada[] = [];
	const porVehiculo = new Map<number, Alerta[]>();
	for (const a of alertas) if (a.tipo === 'mantenimiento' && a.planId != null) porVehiculo.set(a.vehiculoId, [...(porVehiculo.get(a.vehiculoId) ?? []), a]);
	// También los que solo tienen la ITV cerca (revisión previa aunque no toque ninguna revisión)
	for (const a of alertas) if (a.tipo === 'vencimiento' && /itv/i.test(a.titulo) && !porVehiculo.has(a.vehiculoId)) porVehiculo.set(a.vehiculoId, []);

	for (const [vehiculoId, revs] of porVehiculo) {
		const utiles = revs.filter((a) => {
			const p = planes.find((x) => x.id === a.planId);
			return p && !esRutinario(p);
		});
		const tocan = utiles.filter((a) => a.nivel !== 'ok');
		const itv = alertas.find((a) => a.vehiculoId === vehiculoId && a.tipo === 'vencimiento' && /itv/i.test(a.titulo) && a.dias != null && a.dias >= 0 && a.dias <= 45);
		if (!tocan.length && !itv) continue;
		// Lo que ya queda hecho al hacer lo que toca (la C3 incluye la C2…) no se adelanta aparte
		const cubiertas = new Set(expandirIncluidos(tocan.map((a) => a.planId!), planes));
		const adelantar = utiles.filter(
			(a) => a.nivel === 'ok' && !cubiertas.has(a.planId!) && ((a.dias != null && a.dias <= VENTANA_DIAS) || (a.kmRestantes != null && a.kmRestantes <= VENTANA_KM))
		);
		if (!adelantar.length && tocan.length < 2 && !itv) continue;
		// Cuándo: lo primero que vence de lo que toca; si solo es la ITV, una semana antes de ella
		const fechaMin = tocan.length ? Math.max(0, Math.min(...tocan.map((a) => a.dias ?? 0))) : Math.max(0, itv!.dias! - 7);
		const tareas = [...tocan, ...adelantar].flatMap((a) => planes.find((p) => p.id === a.planId)?.tareas ?? []);
		sesiones.push({
			vehiculoId,
			vehiculo: (tocan[0] ?? itv!).vehiculo,
			fecha: sumarDias(hoy, fechaMin),
			tocan: tocan.map((a) => ({ planId: a.planId!, titulo: a.titulo })),
			adelantar: adelantar.map((a) => ({ planId: a.planId!, titulo: a.titulo, cuando: a.detalle })),
			piezas: piezasDeTareas(tareas),
			antesDeItv: itv ? `La ITV vence ${itv.dias === 0 ? 'hoy' : `en ${itv.dias} días`}: aprovecha para la revisión previa.` : null
		});
	}
	return sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
