// Inventario, lista de la compra automática, costes por vehículo y tareas del local.
import { diasEntre, sumarMeses } from './fechas';
import type { Nivel } from './alertas';

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Palabras clave con plural simplificado (bujías → bujia, latiguillos → latiguillo)
const palabras = (t: string) =>
	normalizar(t)
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length >= 4)
		.map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));

/** Cantidad de cada artículo = suma de sus movimientos de stock. */
export function existencias(movs: { articuloId: number; cantidad: number }[]): Map<number, number> {
	const m = new Map<number, number>();
	for (const x of movs) m.set(x.articuloId, Math.round(((m.get(x.articuloId) ?? 0) + x.cantidad) * 1000) / 1000);
	return m;
}

export const bajoMinimo = (a: { stockMinimo: number | null }, cantidad: number) => a.stockMinimo != null && cantidad <= a.stockMinimo;

/** Piezas que pide una revisión: «Cambiar filtro de aceite (nota)» → «Filtro de aceite». */
export function piezasDeTareas(tareas: string[]): string[] {
	const piezas: string[] = [];
	for (const t of tareas) {
		const m = /^(?:cambiar|sustituir|reponer|comprar)\s+(.+)$/i.exec(t.trim());
		if (!m) continue;
		const pieza = m[1].replace(/\s*\(.*\)\s*$/, '').trim();
		if (pieza) piezas.push(pieza[0].toUpperCase() + pieza.slice(1));
	}
	return piezas;
}

/** ¿Es este artículo la pieza? La primera palabra clave debe coincidir y al menos la mitad del resto. */
export function articuloCoincide(pieza: string, articulo: { nombre: string; referencia?: string | null }): boolean {
	const p = palabras(pieza);
	if (!p.length) return false;
	const a = new Set(palabras(`${articulo.nombre} ${articulo.referencia ?? ''}`));
	if (!a.has(p[0])) return false;
	return p.filter((w) => a.has(w)).length >= Math.ceil(p.length / 2);
}

export interface ArticuloConStock {
	id: number;
	tipo: string;
	nombre: string;
	referencia: string | null;
	unidad: string;
	stockMinimo: number | null;
	vehiculoIds: number[];
	cantidad: number;
}

export interface ItemCompraAuto {
	clave: string;
	texto: string;
	motivo: 'stock' | 'revision';
	detalle: string;
	articuloId: number | null;
	vehiculoId: number | null;
	cantidad: number | null;
	unidad: string | null;
}

/**
 * Lista de la compra automática:
 * - artículos de reserva por debajo de su mínimo;
 * - piezas de las revisiones que se acercan (o están vencidas) que no tienes en el inventario.
 */
export function listaCompraAutomatica(
	articulos: ArticuloConStock[],
	revisiones: { vehiculoId: number; vehiculo: string; codigo: string | null; nombre: string; tareas: string[]; nivel: Nivel; dias: number | null }[],
	diasAntelacion = 30
): ItemCompraAuto[] {
	const items: ItemCompraAuto[] = [];
	for (const a of articulos) {
		if (a.tipo === 'herramienta' || !bajoMinimo(a, a.cantidad)) continue;
		items.push({
			clave: `stock:${a.id}`,
			texto: a.nombre,
			motivo: 'stock',
			detalle: `Quedan ${a.cantidad.toLocaleString('es-ES')} ${a.unidad} (mínimo ${a.stockMinimo!.toLocaleString('es-ES')})`,
			articuloId: a.id,
			vehiculoId: null,
			cantidad: null,
			unidad: a.unidad
		});
	}
	const vistos = new Set<string>();
	for (const r of revisiones) {
		const pronto = r.nivel !== 'ok' || (r.dias != null && r.dias <= diasAntelacion);
		if (!pronto) continue;
		for (const pieza of piezasDeTareas(r.tareas)) {
			const sirve = articulos.filter((a) => a.tipo !== 'herramienta' && (!a.vehiculoIds.length || a.vehiculoIds.includes(r.vehiculoId)) && articuloCoincide(pieza, a));
			if (sirve.some((a) => a.cantidad > 0)) continue; // ya la tienes
			const clave = `rev:${r.vehiculoId}:${normalizar(pieza)}`;
			if (vistos.has(clave)) continue;
			vistos.add(clave);
			items.push({
				clave,
				texto: pieza,
				motivo: 'revision',
				detalle: `${r.codigo ? `${r.codigo} · ` : ''}${r.nombre} de ${r.vehiculo}`,
				articuloId: sirve[0]?.id ?? null,
				vehiculoId: r.vehiculoId,
				cantidad: null,
				unidad: null
			});
		}
	}
	return items;
}

// ─── Costes por vehículo ─────────────────────────────────────────────────────

export interface CostesVehiculo {
	compra: number;
	operativo: number;
	ingresos: number;
	inversion: number;
	manoObra: number;
	costeKm: number | null;
	costeMes: number | null;
	meses: number;
	porCategoria: { nombre: string; color: string; total: number }[];
	valorEstimado: number | null;
	margen: number | null;
	margenConHoras: number | null;
}

/** Lo que te cuesta de verdad un vehículo (con IVA: lo que has pagado). La compra va aparte. */
export function costesVehiculo(d: {
	movimientos: { tipo: string; importeCent: number; cuenta: string | null; categoria: string | null; color: string | null }[];
	kmRecorridos: number | null;
	desde: string | null;
	hoy: string;
	horas: number;
	tarifaHoraCent: number;
	valorEstimadoCent: number | null;
}): CostesVehiculo {
	const gastos = d.movimientos.filter((m) => m.tipo === 'gasto');
	const esCompra = (m: { cuenta: string | null }) => m.cuenta?.startsWith('600') ?? false;
	const compra = gastos.filter(esCompra).reduce((t, m) => t + m.importeCent, 0);
	const operativo = gastos.filter((m) => !esCompra(m)).reduce((t, m) => t + m.importeCent, 0);
	const ingresos = d.movimientos.filter((m) => m.tipo === 'ingreso').reduce((t, m) => t + m.importeCent, 0);
	const mapa = new Map<string, { nombre: string; color: string; total: number }>();
	for (const m of gastos) {
		const nombre = m.categoria ?? 'Sin categoría';
		const c = mapa.get(nombre) ?? { nombre, color: m.color ?? '#6c727c', total: 0 };
		c.total += m.importeCent;
		mapa.set(nombre, c);
	}
	const meses = d.desde ? Math.max(diasEntre(d.desde, d.hoy) / 30.44, 1) : 1;
	const inversion = compra + operativo;
	const manoObra = Math.round(d.horas * d.tarifaHoraCent);
	return {
		compra,
		operativo,
		ingresos,
		inversion,
		manoObra,
		costeKm: d.kmRecorridos && d.kmRecorridos > 0 ? operativo / d.kmRecorridos : null,
		costeMes: d.desde ? Math.round(operativo / meses) : null,
		meses: Math.round(meses),
		porCategoria: [...mapa.values()].sort((a, b) => b.total - a.total),
		valorEstimado: d.valorEstimadoCent,
		margen: d.valorEstimadoCent != null ? d.valorEstimadoCent - inversion : null,
		margenConHoras: d.valorEstimadoCent != null ? d.valorEstimadoCent - inversion - manoObra : null
	};
}

// ─── Tareas del local ────────────────────────────────────────────────────────

/** Fecha límite de la siguiente vez para una tarea que se repite. */
export const siguienteTareaLocal = (fechaHecha: string, cadaMeses: number) => sumarMeses(fechaHecha, cadaMeses);

const PESO_PRIORIDAD: Record<string, number> = { alta: 0, media: 1, baja: 2 };

/** Orden de trabajo: vencidas primero, luego por prioridad y fecha límite. */
export function ordenarTareasLocal<T extends { prioridad: string; fechaLimite: string | null; estado: string }>(tareas: T[], hoy: string): T[] {
	const vencida = (t: T) => (t.fechaLimite != null && t.fechaLimite < hoy ? 0 : 1);
	return [...tareas].sort(
		(a, b) =>
			vencida(a) - vencida(b) ||
			(PESO_PRIORIDAD[a.prioridad] ?? 1) - (PESO_PRIORIDAD[b.prioridad] ?? 1) ||
			(a.fechaLimite ?? '9999').localeCompare(b.fechaLimite ?? '9999')
	);
}
