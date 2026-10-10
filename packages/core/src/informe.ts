// Informe diario (Telegram, HTML): vencimientos, mantenimiento, taller, finanzas y coste de la flota.
import { and, eq, gte, inArray } from 'drizzle-orm';
import type { Ajustes } from './ajustes';
import { lecturasValidas, ritmoKmDia } from './alertas';
import { combustibleDe, costeUsoMensual, type PreciosCombustible } from './combustible';
import { cargarAlertas, lecturasPorVehiculo, vehiculosActivos, type Alerta, type DB } from './consultas';
import { euros } from './dinero';
import { diasEntre, sumarDias } from './fechas';
import { cargarContabilidad } from './libros';
import * as s from './schema';
import { estadoTaller } from './taller';

export interface DatosInforme {
	taller: string;
	hoy: string;
	app?: string;
	alertas: Alerta[];
	/** Claves de alertas que cruzan hoy un umbral nuevo. */
	nuevas: Set<string>;
	local: { titulo: string; zona: string | null; fechaLimite: string | null; prioridad: string }[];
	compras: number;
	listaCompra: { texto: string; para: string }[];
	fueraDeSitio: number;
	finanzas: { tesoreria: number; gastoMes: number; gastoAnio: number; ingresosAnio: number; diasCuadre: number | null } | null;
	flota: { alias: string; mensual: number; porKm: number | null; completo: boolean }[];
	/** Vehículos en uso sin lectura de km reciente. */
	kmSinActualizar: { alias: string; ultima: string | null }[];
	/** Solo los lunes. */
	obras?: { nombre: string; avance: number }[];
}

const DIAS_KM_ANTIGUO = 45;
const HORIZONTE_VENCIMIENTOS = 90;

/** Reúne todo lo que necesita el informe. */
export async function datosInforme(
	db: DB,
	o: { hoy: string; ajustes: Ajustes; precios: PreciosCombustible | null; nuevas: Set<string>; app?: string; conObras: boolean; alertas?: Alerta[] }
): Promise<DatosInforme> {
	const { hoy, ajustes } = o;
	const alertas = o.alertas ?? (await cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true }));
	const t = await estadoTaller(db, hoy, alertas);

	// Finanzas: tesorería (cuentas 57) y gasto/ingreso del mes y del año
	let finanzas: DatosInforme['finanzas'] = null;
	try {
		const { asientos } = await cargarContabilidad(db, hoy);
		const tesoreria = asientos.filter((a) => a.fecha <= hoy).reduce((tot, a) => tot + a.apuntes.filter((p) => p.cuenta.startsWith('57')).reduce((x, p) => x + p.debe - p.haber, 0), 0);
		const movs = await db
			.select({ fecha: s.movimientos.fecha, tipo: s.movimientos.tipo, importe: s.movimientos.importeCent, cuadre: s.movimientos.cuadreSaldoCent })
			.from(s.movimientos)
			.where(gte(s.movimientos.fecha, `${hoy.slice(0, 4)}-01-01`));
		const reales = movs.filter((m) => m.cuadre == null && m.fecha <= hoy);
		const suma = (xs: typeof reales) => xs.reduce((tot, m) => tot + m.importe, 0);
		finanzas = {
			tesoreria,
			gastoMes: suma(reales.filter((m) => m.tipo === 'gasto' && m.fecha.startsWith(hoy.slice(0, 7)))),
			gastoAnio: suma(reales.filter((m) => m.tipo === 'gasto')),
			ingresosAnio: suma(reales.filter((m) => m.tipo === 'ingreso')),
			diasCuadre: ajustes.ultimoCuadre ? diasEntre(ajustes.ultimoCuadre, hoy) : null
		};
	} catch (e) {
		console.warn('Informe: finanzas no disponibles:', (e as Error).message);
	}

	// Flota: coste de uso al mes de cada vehículo en uso y lecturas de km antiguas
	const estados = await db.select().from(s.estados);
	// Solo los de Novaz (los de clientes no son coste tuyo) y que no estén en restauración
	const enUso = (await vehiculosActivos(db)).filter((v) => v.propietario === 'novaz' && !/restaur/i.test(estados.find((e) => e.id === v.estadoId)?.nombre ?? ''));
	const ids = enUso.map((v) => v.id);
	const [lecturas, gastos, vencs, tipos] = ids.length
		? await Promise.all([
				lecturasPorVehiculo(db, ids),
				db
					.select({ vehiculoId: s.movimientos.vehiculoId, fecha: s.movimientos.fecha, importe: s.movimientos.importeCent, categoria: s.categorias.nombre, vencimientoId: s.movimientos.vencimientoId })
					.from(s.movimientos)
					.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
					.where(and(eq(s.movimientos.tipo, 'gasto'), inArray(s.movimientos.vehiculoId, ids))),
				db
					.select({ v: s.vencimientos, tipo: s.tiposVencimiento.nombre })
					.from(s.vencimientos)
					.innerJoin(s.tiposVencimiento, eq(s.vencimientos.tipoId, s.tiposVencimiento.id))
					.where(and(eq(s.vencimientos.estado, 'vigente'), inArray(s.vencimientos.vehiculoId, ids))),
				db.select().from(s.tiposVehiculo)
			])
		: [new Map(), [], [], []];
	const flota: DatosInforme['flota'] = [];
	const kmSinActualizar: DatosInforme['kmSinActualizar'] = [];
	for (const v of enUso) {
		const ls = lecturasValidas(lecturas.get(v.id) ?? []);
		const ultima = ls.map((l) => l.fecha).sort().at(-1) ?? null;
		if (!ultima || diasEntre(ultima, hoy) > DIAS_KM_ANTIGUO) kmSinActualizar.push({ alias: v.alias, ultima });
		const esMoto = /moto/i.test(tipos.find((x) => x.id === v.tipoId)?.nombre ?? '');
		const comb = combustibleDe(v.campos.combustible) ?? (esMoto ? 'gasolina' : null);
		const ritmo = ritmoKmDia(ls, hoy);
		const c = costeUsoMensual({
			hoy,
			kmMes: ritmo != null ? Math.round(ritmo * 30.44) : null,
			consumo: Number(v.campos.consumo) || null,
			precioLitro: comb && o.precios?.[comb] ? o.precios[comb]!.media : null,
			vencimientos: vencs.filter((x) => x.v.vehiculoId === v.id).map((x) => ({ id: x.v.id, tipo: x.tipo, importeCent: x.v.importeCent, fechaInicio: x.v.fechaInicio, fechaVence: x.v.fechaVence })),
			gastos: gastos.filter((g) => g.vehiculoId === v.id).map((g) => ({ fecha: g.fecha, importeCent: g.importe, categoria: g.categoria, vencimientoId: g.vencimientoId }))
		});
		if (c.total) flota.push({ alias: v.alias, mensual: c.total, porKm: c.porKm, completo: c.completo });
	}

	return {
		taller: ajustes.nombreTaller,
		hoy,
		app: o.app,
		alertas,
		nuevas: o.nuevas,
		local: t.local,
		compras: t.compras,
		listaCompra: t.listaCompra,
		fueraDeSitio: t.fueraDeSitio,
		finanzas,
		flota: flota.sort((a, b) => b.mensual - a.mensual),
		kmSinActualizar,
		obras: o.conObras ? t.obras : undefined
	};
}

// ─── Formato ─────────────────────────────────────────────────────────────────

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const ddmmaa = (iso: string) => `${ddmm(iso)}/${iso.slice(2, 4)}`;
const ajustar = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}.` : t.padEnd(n));
const CORTO: Record<string, string> = { 'impuesto de circulación': 'Impuesto' };
const corto = (t: string) => CORTO[t.toLowerCase()] ?? t;
const NIVEL: Record<string, string> = { vencido: 'VENCIDO', urgente: 'URGENTE', pronto: 'próximo' };

export function mensajeInforme(d: DatosInforme): string {
	const dia = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d.hoy}T12:00:00Z`));
	const fechaDe = (a: Alerta) => sumarDias(d.hoy, a.dias ?? 0);
	const nuevo = (a: Alerta) => (d.nuevas.has(a.clave) ? ' <i>(nuevo)</i>' : '');
	const bloques: string[] = [`<b>${esc(d.taller.toUpperCase())} · INFORME DIARIO</b>\n<i>${esc(dia.charAt(0).toUpperCase() + dia.slice(1))}</i>`];

	const vencs = d.alertas.filter((a) => a.tipo === 'vencimiento' && a.dias != null).sort((a, b) => a.dias! - b.dias!);
	const vencidos = vencs.filter((a) => a.dias! < 0);
	const proximos = vencs.filter((a) => a.dias! >= 0);
	const mant = d.alertas.filter((a) => a.tipo === 'mantenimiento' && a.nivel !== 'ok');
	const averias = d.alertas.filter((a) => a.tipo === 'pendiente');
	const localVencidas = d.local.filter((t) => t.fechaLimite && t.fechaLimite < d.hoy).length;

	// Resumen: lo esencial en cuatro líneas
	const resumen: string[] = [];
	const atencion = vencidos.length + mant.filter((a) => a.nivel === 'vencido' || a.nivel === 'urgente').length + averias.filter((a) => a.nivel === 'urgente').length + localVencidas;
	resumen.push(atencion ? `<b>${atencion} ${atencion === 1 ? 'asunto requiere' : 'asuntos requieren'} atención hoy.</b>` : 'Sin asuntos urgentes.');
	if (proximos[0]) resumen.push(`Próximo trámite: ${esc(corto(proximos[0].titulo))} de ${esc(proximos[0].vehiculo)}, ${ddmmaa(fechaDe(proximos[0]))} (${proximos[0].dias === 0 ? 'hoy' : `${proximos[0].dias} días`}).`);
	if (d.finanzas) resumen.push(`Tesorería: ${euros(d.finanzas.tesoreria)}.`);
	const totalFlota = d.flota.reduce((t, f) => t + f.mensual, 0);
	if (totalFlota) resumen.push(`Coste de la flota: ${euros(totalFlota, { redondo: true })}/mes.`);
	bloques.push(`<b>Resumen</b>\n${resumen.join('\n')}`);

	// Vencimientos: los vencidos y los de los próximos 90 días (al menos el siguiente)
	const enHorizonte = proximos.filter((a) => a.dias! <= HORIZONTE_VENCIMIENTOS);
	const listaVenc = [...vencidos, ...(enHorizonte.length ? enHorizonte : proximos.slice(0, 1))];
	if (listaVenc.length) {
		const filas = listaVenc.map((a) => `${ddmm(fechaDe(a))}  ${ajustar(corto(a.titulo), 9)} ${ajustar(a.vehiculo, 9)} ${a.dias! < 0 ? 'vencido' : `${String(a.dias).padStart(3)} d`}`);
		const nuevosVenc = listaVenc.filter((a) => d.nuevas.has(a.clave));
		bloques.push(
			`<b>Vencimientos</b>${enHorizonte.length ? ` · próximos ${HORIZONTE_VENCIMIENTOS} días` : ''}\n<pre>${esc(filas.join('\n'))}</pre>` +
				(nuevosVenc.length ? `\n<i>Entra hoy en aviso: ${nuevosVenc.map((a) => esc(`${corto(a.titulo)} ${a.vehiculo}`)).join(', ')}.</i>` : '')
		);
	}

	// Mantenimiento: solo lo que toca o está cerca
	if (mant.length)
		bloques.push(`<b>Mantenimiento</b>\n${mant.map((a) => `${esc(a.vehiculo)} · ${esc(a.titulo)}: ${esc(a.detalle)} [${NIVEL[a.nivel]}]${nuevo(a)}`).join('\n')}`);

	// Taller
	const taller: string[] = [];
	if (averias.length) taller.push(`Averías abiertas (${averias.length}): ${averias.map((a) => `${esc(a.titulo)} (${esc(a.vehiculo)}${a.nivel === 'urgente' ? ', urgente' : ''})`).join('; ')}.`);
	if (d.local.length) {
		const top = d.local.slice(0, 3).map((t) => `${esc(t.titulo)}${t.fechaLimite ? ` (${t.fechaLimite < d.hoy ? 'vencida' : `antes del ${ddmm(t.fechaLimite)}`})` : ''}`);
		taller.push(`El local: ${d.local.length} ${d.local.length === 1 ? 'tarea abierta' : 'tareas abiertas'}${localVencidas ? `, ${localVencidas} fuera de plazo` : ''}. ${top.join('; ')}${d.local.length > 3 ? '…' : '.'}`);
	}
	if (d.fueraDeSitio) taller.push(`Herramientas sin localizar o prestadas: ${d.fueraDeSitio}.`);
	if (d.obras?.length) taller.push(`Obras: ${d.obras.map((o) => `${esc(o.nombre)} ${Math.round(o.avance * 100)} %`).join('; ')}.`);
	if (taller.length) bloques.push(`<b>Taller</b>\n${taller.join('\n')}`);

	// Lista de la compra, entera (hasta 15 líneas)
	if (d.listaCompra.length) {
		const max = 15;
		const lineas = d.listaCompra.slice(0, max).map((c) => `• ${esc(c.texto)} — <i>${esc(c.para)}</i>`);
		if (d.listaCompra.length > max) lineas.push(`…y ${d.listaCompra.length - max} más`);
		bloques.push(`<b>Lista de la compra</b> (${d.listaCompra.length})\n${lineas.join('\n')}`);
	}

	// Finanzas
	if (d.finanzas) {
		const f = d.finanzas;
		const lineas = [
			`<pre>${esc(
				[
					`Tesorería       ${euros(f.tesoreria).padStart(12)}`,
					`Gasto del mes   ${euros(f.gastoMes, { redondo: true }).padStart(12)}`,
					`Gasto del año   ${euros(f.gastoAnio, { redondo: true }).padStart(12)}`,
					...(f.ingresosAnio ? [`Ingresos año    ${euros(f.ingresosAnio, { redondo: true }).padStart(12)}`] : [])
				].join('\n')
			)}</pre>`
		];
		if (f.diasCuadre == null || f.diasCuadre > 30) lineas.push(`<i>${f.diasCuadre == null ? 'Nunca se ha cuadrado con el banco.' : `Último cuadre con el banco hace ${f.diasCuadre} días.`} Conviene cuadrar.</i>`);
		bloques.push(`<b>Finanzas</b>\n${lineas.join('\n')}`);
	}

	// Flota: coste de uso
	if (d.flota.length) {
		const filas = d.flota.map((f) => `${ajustar(f.alias, 10)} ${euros(f.mensual, { redondo: true }).padStart(7)}/mes${f.porKm != null ? `  ${(f.porKm / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/km` : ''}`);
		const incompletos = d.flota.filter((f) => !f.completo).map((f) => f.alias);
		bloques.push(
			`<b>Coste de uso de la flota</b>\n<pre>${esc(filas.join('\n'))}</pre>` + (incompletos.length ? `\n<i>Faltan datos en ${esc(incompletos.join(', '))}: el coste real será algo mayor.</i>` : '')
		);
	}
	if (d.kmSinActualizar.length)
		bloques.push(
			`<i>Km sin actualizar: ${d.kmSinActualizar.map((k) => esc(`${k.alias} (${k.ultima ? `última lectura ${ddmmaa(k.ultima)}` : 'sin lecturas'})`)).join(', ')}. Las revisiones por km pierden precisión.</i>`
		);

	if (d.app) bloques.push(`<a href="${d.app}">Abrir el panel</a>`);
	return bloques.join('\n\n');
}
