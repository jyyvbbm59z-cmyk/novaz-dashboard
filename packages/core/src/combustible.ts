// Precio del combustible (Geoportal de Gasolineras del Ministerio) y coste de uso mensual de un vehículo.
import { diasEntre, sumarMeses } from './fechas';

export type Combustible = 'diesel' | 'gasolina';

export interface MunicipioCombustible {
	/** IDMunicipio del Geoportal (Moncada = 7130). */
	id: string;
	nombre: string;
	provinciaId: string;
}

export interface PrecioCarburante {
	/** € por litro: media de las gasolineras. */
	media: number;
	minimo: number;
	estaciones: number;
	/** 'municipio' o 'provincia' (si en el municipio no hay datos). */
	ambito: 'municipio' | 'provincia';
}

export interface PreciosCombustible {
	/** Día en que se consultó (YYYY-MM-DD). */
	fecha: string;
	municipio: string;
	diesel: PrecioCarburante | null;
	gasolina: PrecioCarburante | null;
}

export const URL_CARBURANTES = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres';

const CAMPO: Record<Combustible, string> = { diesel: 'Precio Gasoleo A', gasolina: 'Precio Gasolina 95 E5' };

/** «1,799» → 1.799; vacío → null. */
const numero = (t: unknown) => {
	const n = Number(String(t ?? '').replace(',', '.'));
	return t && Number.isFinite(n) && n > 0 ? n : null;
};

/** Media y mínimo de un carburante en la respuesta del Geoportal. */
export function precioDe(respuesta: { ListaEESSPrecio?: Record<string, unknown>[] }, tipo: Combustible, ambito: PrecioCarburante['ambito']): PrecioCarburante | null {
	const precios = (respuesta.ListaEESSPrecio ?? []).map((e) => numero(e[CAMPO[tipo]])).filter((n): n is number => n != null);
	if (!precios.length) return null;
	const media = precios.reduce((t, p) => t + p, 0) / precios.length;
	return { media: Math.round(media * 1000) / 1000, minimo: Math.min(...precios), estaciones: precios.length, ambito };
}

/** Descarga los precios del municipio (y de la provincia si en el municipio falta algún carburante). */
export async function descargarPrecios(m: MunicipioCombustible, hoy: string, opciones: { fetch?: typeof fetch; timeoutMs?: number } = {}): Promise<PreciosCombustible> {
	const f = opciones.fetch ?? fetch;
	const pedir = async (ruta: string) => {
		const r = await f(`${URL_CARBURANTES}/${ruta}`, { signal: AbortSignal.timeout(opciones.timeoutMs ?? 8000), headers: { accept: 'application/json' } });
		if (!r.ok) throw new Error(`Geoportal: HTTP ${r.status}`);
		return (await r.json()) as { ListaEESSPrecio?: Record<string, unknown>[] };
	};
	const mun = await pedir(`FiltroMunicipio/${m.id}`);
	let diesel = precioDe(mun, 'diesel', 'municipio');
	let gasolina = precioDe(mun, 'gasolina', 'municipio');
	if (!diesel || !gasolina) {
		const prov = await pedir(`FiltroProvincia/${m.provinciaId}`);
		diesel ??= precioDe(prov, 'diesel', 'provincia');
		gasolina ??= precioDe(prov, 'gasolina', 'provincia');
	}
	return { fecha: hoy, municipio: m.nombre, diesel, gasolina };
}

/** Tipo de carburante a partir del campo «Combustible» del vehículo. */
export function combustibleDe(valor: unknown): Combustible | null {
	const t = String(valor ?? '').toLowerCase();
	if (/di[eé]sel|gas[oó]leo|gasoil/.test(t)) return 'diesel';
	if (/gasolina|h[ií]brido/.test(t)) return 'gasolina';
	return null;
}

// ─── Coste de uso mensual ────────────────────────────────────────────────────

export interface ParteCoste {
	clave: 'combustible' | 'seguro' | 'impuesto' | 'itv' | 'mantenimiento';
	concepto: string;
	/** Céntimos al mes (null = falta un dato para calcularlo). */
	mensual: number | null;
	detalle: string;
}

const FIJOS: { clave: 'seguro' | 'impuesto' | 'itv'; concepto: string; tipo: RegExp }[] = [
	{ clave: 'seguro', concepto: 'Seguro', tipo: /segur/i },
	{ clave: 'impuesto', concepto: 'Impuesto de circulación', tipo: /impuesto|circulaci/i },
	{ clave: 'itv', concepto: 'ITV', tipo: /itv/i }
];
/** Categorías que no son mantenimiento: van como fijos, se estiman (combustible) o no son de uso (compra). */
const NO_MANTENIMIENTO = /segur|impuest|tasa|itv|combust|compra|venta/i;

export interface DatosCosteUso {
	hoy: string;
	kmMes: number | null;
	/** L/100 km. */
	consumo: number | null;
	/** € por litro. */
	precioLitro: number | null;
	/** Papeles vigentes del vehículo. */
	vencimientos: { id: number; tipo: string; importeCent: number | null; fechaInicio: string | null; fechaVence: string }[];
	/** Gastos del vehículo. */
	gastos: { fecha: string; importeCent: number; categoria: string | null; vencimientoId: number | null }[];
}

export function costeUsoMensual(d: DatosCosteUso) {
	const partes: ParteCoste[] = [];
	const n = (x: number, dec = 0) => x.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });

	// Combustible: lo que se recorre al mes × consumo × precio de hoy
	const combustible = d.kmMes != null && d.consumo && d.precioLitro ? Math.round((d.kmMes * d.consumo * d.precioLitro) / 100 * 100) : null;
	partes.push({
		clave: 'combustible',
		concepto: 'Combustible',
		mensual: combustible,
		detalle:
			d.kmMes == null
				? 'Faltan lecturas de km para saber cuánto lo usas'
				: !d.consumo
					? 'Pon el consumo medio (L/100 km) en Editar'
					: !d.precioLitro
						? 'Sin precio del combustible'
						: `${n(d.kmMes)} km/mes · ${n(d.consumo, 1)} L/100 km · ${n(d.precioLitro, 3)} €/L`
	});

	// Fijos: lo que cuesta cada papel, repartido entre los meses que cubre
	const usados = new Set<number>();
	for (const fijo of FIJOS) {
		const v = d.vencimientos.find((x) => fijo.tipo.test(x.tipo));
		let anual: number | null = null;
		let detalle = 'Falta el importe';
		if (v?.importeCent) {
			const meses = v.fechaInicio ? Math.max(1, Math.round(diasEntre(v.fechaInicio, v.fechaVence) / 30.44)) : 12;
			anual = Math.round((v.importeCent * 12) / meses);
			detalle = meses === 12 ? `${n(v.importeCent / 100, 2)} € al año` : `${n(v.importeCent / 100, 2)} € cada ${meses} meses`;
		} else {
			// Sin importe en el papel: el último pago de este concepto en los últimos 15 meses
			const desde = sumarMeses(d.hoy, -15);
			const pago = d.gastos
				.filter((g) => g.fecha >= desde && ((v && g.vencimientoId === v.id) || fijo.tipo.test(g.categoria ?? '')))
				.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
			if (pago) {
				anual = fijo.clave === 'itv' && v?.fechaInicio && v.fechaVence ? Math.round((pago.importeCent * 12) / Math.max(1, Math.round(diasEntre(v.fechaInicio, v.fechaVence) / 30.44))) : pago.importeCent;
				detalle = `Último pago: ${n(pago.importeCent / 100, 2)} €`;
			} else if (!v) detalle = 'Sin registrar';
		}
		if (v) usados.add(v.id);
		partes.push({ clave: fijo.clave, concepto: fijo.concepto, mensual: anual != null ? Math.round(anual / 12) : null, detalle });
	}

	// Mantenimiento y reparaciones: media mensual de lo gastado (entre 12 y 36 meses, para repartir lo gordo)
	const mant = d.gastos.filter((g) => !NO_MANTENIMIENTO.test(g.categoria ?? '') && !(g.vencimientoId != null && usados.has(g.vencimientoId)));
	const primero = mant.map((g) => g.fecha).sort()[0];
	const meses = primero ? Math.min(36, Math.max(12, Math.ceil(diasEntre(primero, d.hoy) / 30.44))) : 12;
	const desde = sumarMeses(d.hoy, -meses);
	const totalMant = mant.filter((g) => g.fecha > desde).reduce((t, g) => t + g.importeCent, 0);
	partes.push({
		clave: 'mantenimiento',
		concepto: 'Mantenimiento y reparaciones',
		mensual: Math.round(totalMant / meses),
		detalle: totalMant ? `${n(totalMant / 100)} € en los últimos ${meses} meses` : 'Sin gastos apuntados todavía'
	});

	const total = partes.reduce((t, p) => t + (p.mensual ?? 0), 0);
	return {
		partes,
		/** Céntimos al mes con lo que se sabe. */
		total,
		/** Céntimos por km. */
		porKm: d.kmMes ? total / d.kmMes : null,
		anual: total * 12,
		completo: partes.every((p) => p.mensual != null)
	};
}
