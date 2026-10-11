// Bot de Telegram en las dos direcciones: lo que entiende se confirma con un botón, se apunta en la app y se puede deshacer.
import {
	buscarArticulos,
	cargarAlertas,
	datosInforme,
	describirUbicacion,
	euros,
	estadoTaller,
	mensajeInforme,
	planAplica,
	resumenIntencion,
	separarPrecio,
	tienePlanesPropios,
	type Intencion,
	type VehiculoBot
} from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, desc, eq, gte, isNull, ne } from 'drizzle-orm';
import { borrarEntrada, borrarMovimiento, guardarEntrada, guardarMovimiento, guardarPendiente } from './acciones';
import { cargarAgenda } from './agenda';
import { precioCombustibleHoy } from './combustible';
import { comprobarLectura } from './datos';
import { borrarRepostaje, guardarRepostaje } from './repostajes';
import { cargarPlano } from './ubicaciones';
import { descargarTelegram } from './telegram';

type Locals = App.Locals;
export type EnvBot = { TELEGRAM_TOKEN?: string; TELEGRAM_API?: string; ARCHIVOS?: R2Bucket };

/** Lo que el bot va a apuntar: la intención más lo que se resuelve antes de confirmar. */
export interface Orden {
	i: Intencion;
	/** Foto del ticket (file_id de Telegram), para guardarla con el gasto. */
	foto?: string | null;
	fecha?: string | null;
	notas?: string | null;
	ivaPct?: number | null;
	/** Lo que se ha dicho por voz, para enseñarlo. */
	voz?: string | null;
	/** Resuelto al preparar: categoría del gasto y revisiones que renueva. */
	categoria?: { id: number; nombre: string } | null;
	planes?: { id: number; nombre: string }[];
}

const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'cambio', 'cambiar', 'cambiado', 'nuevo', 'nueva']);
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function vehiculosBot(db: Locals['db']): Promise<VehiculoBot[]> {
	return db.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, marca: s.vehiculos.marca, modelo: s.vehiculos.modelo, matricula: s.vehiculos.matricula }).from(s.vehiculos);
}

// ─── Preparar: categoría y revisiones, para enseñarlas antes de confirmar ────

const PISTAS: [RegExp, RegExp][] = [
	[/combust|gasolin|gasoil|diesel|repost/, /combust/],
	[/reforma|obra/, /reforma/],
	[/local|taller|nave/, /mantenimiento del local|local/],
	[/herramient/, /herramient/],
	[/recambio|repuesto|pieza|aceite|filtro|neumatic|pastilla/, /recambio|repuesto|material/],
	[/consumible|lija|pintura|trapo|guante|limpi/, /consumible|material/],
	[/seguro/, /seguro/],
	[/itv|impuesto|ivtm|tasa|tributo/, /tribut|impuesto|itv/],
	[/luz|agua|gas\b|suministro/, /suministro/],
	[/envio|transporte|mensajer/, /transporte/]
];

async function categoriaGasto(db: Locals['db'], pista: string, local: boolean, reforma: boolean) {
	const cats = await db.select({ id: s.categorias.id, nombre: s.categorias.nombre }).from(s.categorias).where(eq(s.categorias.tipo, 'gasto'));
	const p = norm(`${reforma ? 'reforma ' : ''}${pista}${local ? ' local' : ''}`);
	const directa = cats.find((c) => p.includes(norm(c.nombre)) || (pista && norm(c.nombre).includes(norm(pista))));
	if (directa) return directa;
	for (const [re, cat] of PISTAS) if (re.test(p)) {
		const c = cats.find((x) => cat.test(norm(x.nombre)));
		if (c) return c;
	}
	return null;
}

/** Revisiones del vehículo que renueva un mantenimiento («aceite», «C2», «filtro de aire»). */
async function planesQueRenueva(db: Locals['db'], vehiculoId: number, claves: string[], titulo: string) {
	const [veh, planes] = await Promise.all([
		db.select({ id: s.vehiculos.id, tipoId: s.vehiculos.tipoId }).from(s.vehiculos).where(eq(s.vehiculos.id, vehiculoId)).get(),
		db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.activo, true))
	]);
	if (!veh) return [];
	const propios = tienePlanesPropios(planes, veh.id);
	const suyos = planes.filter((p) => planAplica(p, veh, propios));
	// Cada palabra clave renueva las revisiones cuyo nombre la contiene («filtro de aire» → «Filtros de aire y gasoil»);
	// solo si ninguna la nombra, se busca en sus tareas
	const palabras = (x: string) => norm(x).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !VACIAS.has(w)).map((w) => w.replace(/(es|s)$/, ''));
	const elegidos = new Set<number>();
	for (const c of claves.length ? claves : [titulo]) {
		const ps = palabras(c);
		if (!ps.length) continue;
		const porCodigo = suyos.filter((p) => p.codigo && norm(p.codigo) === norm(c).trim());
		const porNombre = suyos.filter((p) => ps.every((w) => palabras(p.nombre).includes(w)));
		const porTarea = claves.length ? suyos.filter((p) => p.tareas.some((x) => ps.every((w) => palabras(x).includes(w)))) : [];
		for (const p of porCodigo.length ? porCodigo : porNombre.length ? porNombre : porTarea.slice(0, 1)) elegidos.add(p.id);
	}
	return suyos.filter((p) => elegidos.has(p.id)).map((p) => ({ id: p.id, nombre: p.codigo ? `${p.codigo} · ${p.nombre}` : p.nombre }));
}

export async function prepararOrden(locals: Locals, o: Orden): Promise<Orden> {
	const i = o.i;
	if (i.tipo === 'gasto') return { ...o, categoria: await categoriaGasto(locals.db, `${i.categoria ?? ''} ${i.concepto}`, i.local, /reforma|obra/i.test(i.categoria ?? '')) };
	if ((i.tipo === 'mantenimiento' || i.tipo === 'reparacion') && i.vehiculoId) {
		const planes = i.tipo === 'mantenimiento' ? await planesQueRenueva(locals.db, i.vehiculoId, i.revisiones, i.titulo) : [];
		const categoria = i.importeCent ? await categoriaGasto(locals.db, 'recambio', false, false) : null;
		return { ...o, planes, categoria };
	}
	return o;
}

/** El texto de confirmación: lo entendido + lo resuelto (categoría, revisiones). */
export function textoOrden(o: Orden, vehiculos: VehiculoBot[]) {
	let t = resumenIntencion(o.i, vehiculos, { fecha: o.fecha, notas: o.notas });
	if (o.planes?.length) t += `\nRenueva: ${o.planes.map((p) => esc(p.nombre)).join(', ')}`;
	else if (o.i.tipo === 'mantenimiento') t += '\n<i>No lo cuadro con ninguna revisión del plan: se apunta como entrada suelta.</i>';
	if (o.categoria && (o.i.tipo === 'gasto' || o.i.tipo === 'mantenimiento' || o.i.tipo === 'reparacion')) t += `\nCategoría: ${esc(o.categoria.nombre)}`;
	if (o.foto) t += '\n📎 Guardo la foto del ticket';
	return o.voz ? `🎙 <i>«${esc(o.voz)}»</i>\n\n${t}` : t;
}

// ─── Apuntar ─────────────────────────────────────────────────────────────────

const euroForm = (c: number) => (c / 100).toFixed(2).replace('.', ',');

async function guardarFoto(locals: Locals, env: EnvBot, fileId: string, movimientoId: number, vehiculoId: number | null) {
	if (!env.ARCHIVOS) return;
	const { bytes, ruta } = await descargarTelegram(env, fileId);
	const ext = ruta.split('.').pop()?.toLowerCase() || 'jpg';
	const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
	const clave = `movimiento/${movimientoId}/${crypto.randomUUID()}.${ext}`;
	await env.ARCHIVOS.put(clave, bytes, { httpMetadata: { contentType: mime } });
	await locals.db.insert(s.adjuntos).values({ clave, nombre: `ticket.${ext}`, mime, bytes: bytes.byteLength, entidad: 'movimiento', entidadId: movimientoId, vehiculoId, pie: 'Ticket (Telegram)' });
}

/** Apunta la orden en la app. Devuelve lo creado (para deshacer) y adónde mirarlo. */
export async function ejecutarOrden(locals: Locals, env: EnvBot, o: Orden): Promise<{ hecho: s.HechoBot[]; href: string }> {
	const { db, hoy } = locals;
	const i = o.i;
	const fecha = o.fecha ?? hoy;
	const veh = 'vehiculoId' in i ? i.vehiculoId : null;
	const enFlota = (p: string) => `/flota/${veh}?pestana=${p}`;
	switch (i.tipo) {
		case 'repostaje': {
			const fd = new FormData();
			fd.set('vehiculoId', String(veh));
			fd.set('fecha', fecha);
			fd.set('litros', String(i.litros).replace('.', ','));
			fd.set('importe', euroForm(i.importeCent!));
			if (i.km) fd.set('km', String(i.km));
			if (i.gasolinera) fd.set('gasolinera', i.gasolinera);
			if (i.lleno) fd.set('lleno', 'on');
			if (o.notas) fd.set('notas', o.notas);
			const r = await guardarRepostaje(locals, fd);
			if (o.foto) await guardarFoto(locals, env, o.foto, r.movimientoId, veh);
			return { hecho: [{ t: 'repostaje', id: r.repostajeId }], href: enFlota('historial') };
		}
		case 'km': {
			await comprobarLectura(db, veh!, fecha, i.km);
			const ya = await db.select({ id: s.lecturasKm.id }).from(s.lecturasKm).where(and(eq(s.lecturasKm.vehiculoId, veh!), eq(s.lecturasKm.fecha, fecha), eq(s.lecturasKm.km, i.km))).get();
			if (ya) return { hecho: [], href: `/flota/${veh}` };
			const [l] = await db.insert(s.lecturasKm).values({ vehiculoId: veh!, fecha, km: i.km, origen: 'manual' }).returning({ id: s.lecturasKm.id });
			return { hecho: [{ t: 'km', id: l.id }], href: `/flota/${veh}` };
		}
		case 'gasto': {
			const fd = new FormData();
			fd.set('tipo', 'gasto');
			fd.set('importe', euroForm(i.importeCent));
			fd.set('fecha', fecha);
			fd.set('concepto', i.concepto);
			if (o.categoria) fd.set('categoriaId', String(o.categoria.id));
			if (i.proveedor) fd.set('proveedor', i.proveedor);
			if (o.notas) fd.set('notas', o.notas);
			if (o.ivaPct != null) fd.set('ivaPct', String(o.ivaPct));
			const id = await guardarMovimiento(locals, fd, { vehiculoId: i.local ? null : veh });
			if (o.foto) await guardarFoto(locals, env, o.foto, id, i.local ? null : veh);
			return { hecho: [{ t: 'movimiento', id }], href: '/contabilidad/movimientos' };
		}
		case 'mantenimiento':
		case 'reparacion': {
			const fd = new FormData();
			fd.set('clase', i.tipo);
			fd.set('titulo', i.titulo);
			fd.set('fecha', fecha);
			if (i.km) fd.set('km', String(i.km));
			for (const p of o.planes ?? []) fd.append('planIds', String(p.id));
			if (i.importeCent) {
				fd.set('importe', euroForm(i.importeCent));
				if (o.categoria) fd.set('categoriaId', String(o.categoria.id));
			}
			const r = await guardarEntrada(locals, veh!, fd, env.ARCHIVOS);
			return { hecho: [{ t: 'entrada', id: r.entradaId }], href: enFlota(i.tipo === 'mantenimiento' ? 'mantenimiento' : 'historial') };
		}
		case 'averia':
		case 'mejora': {
			const fd = new FormData();
			fd.set('titulo', i.titulo);
			fd.set('tipo', i.tipo);
			fd.set('prioridad', i.urgente ? 'alta' : 'media');
			const id = await guardarPendiente(locals, veh!, fd);
			return { hecho: [{ t: 'pendiente', id }], href: enFlota('historial') };
		}
		case 'tarea_local': {
			const [t] = await db
				.insert(s.tareasLocal)
				.values({ titulo: i.titulo, zona: i.zona, tipo: i.reforma ? 'reforma' : 'mantenimiento' })
				.returning({ id: s.tareasLocal.id });
			return { hecho: [{ t: 'tarea_local', id: t.id }], href: '/local' };
		}
		case 'compra': {
			const filas = await db
				.insert(s.listaCompra)
				.values(i.items.map((x) => {
					const { texto, precioCent } = separarPrecio(x);
					return { texto, precioEstimadoCent: precioCent, vehiculoId: veh };
				}))
				.returning({ id: s.listaCompra.id });
			return { hecho: filas.map((f) => ({ t: 'compra' as const, id: f.id })), href: '/compras' };
		}
		default:
			throw new Error('Esto no se puede apuntar');
	}
}

/** Deshace lo que apuntó el bot (en orden inverso). */
export async function deshacer(locals: Locals, env: EnvBot, hecho: s.HechoBot[]) {
	const { db } = locals;
	for (const h of [...hecho].reverse()) {
		if (h.t === 'repostaje') await borrarRepostaje(locals, h.id, env.ARCHIVOS);
		else if (h.t === 'movimiento') await borrarMovimiento(locals, h.id, env.ARCHIVOS);
		else if (h.t === 'entrada') {
			if (env.ARCHIVOS) await borrarEntrada(locals, env.ARCHIVOS, h.id);
			else await db.delete(s.entradas).where(eq(s.entradas.id, h.id));
		} else if (h.t === 'pendiente') await db.delete(s.pendientes).where(eq(s.pendientes.id, h.id));
		else if (h.t === 'tarea_local') await db.delete(s.tareasLocal).where(eq(s.tareasLocal.id, h.id));
		else if (h.t === 'compra') await db.delete(s.listaCompra).where(eq(s.listaCompra.id, h.id));
		else if (h.t === 'km') await db.delete(s.lecturasKm).where(eq(s.lecturasKm.id, h.id));
	}
}

// ─── Consultas ───────────────────────────────────────────────────────────────

const ICONO_NIVEL: Record<string, string> = { vencido: '🔴', urgente: '🟠', pronto: '🟡', ok: '🟢' };

export async function responderConsulta(locals: Locals, i: Extract<Intencion, { tipo: 'consulta' }>, app: string): Promise<string> {
	const { db, hoy, ajustes } = locals;
	if (i.tema === 'vehiculo' && i.vehiculoId) {
		const [alertas, v, km] = await Promise.all([
			cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true }),
			db.select({ alias: s.vehiculos.alias }).from(s.vehiculos).where(eq(s.vehiculos.id, i.vehiculoId)).get(),
			db.select({ km: s.lecturasKm.km, fecha: s.lecturasKm.fecha }).from(s.lecturasKm).where(eq(s.lecturasKm.vehiculoId, i.vehiculoId)).orderBy(desc(s.lecturasKm.fecha), desc(s.lecturasKm.km)).get()
		]);
		const suyas = alertas.filter((a) => a.vehiculoId === i.vehiculoId);
		const PESO: Record<string, number> = { vencido: 0, urgente: 1, pronto: 2, ok: 3 };
		const abiertas = suyas.filter((a) => a.nivel !== 'ok').sort((a, b) => PESO[a.nivel] - PESO[b.nivel] || (a.dias ?? 999) - (b.dias ?? 999));
		const proximas = suyas.filter((a) => a.nivel === 'ok' && a.tipo !== 'pendiente').sort((a, b) => (a.dias ?? 9999) - (b.dias ?? 9999)).slice(0, 3);
		const lineas = [`<b>${esc(v?.alias ?? 'Vehículo')}</b>${km ? ` · ${km.km.toLocaleString('es-ES')} km` : ''}`];
		if (abiertas.length) lineas.push('', ...abiertas.map((a) => `${ICONO_NIVEL[a.nivel]} ${esc(a.titulo)}${a.detalle ? ` — ${esc(a.detalle)}` : ''}`));
		else lineas.push('', 'Todo al día.');
		if (proximas.length) lineas.push('', '<b>Lo siguiente</b>', ...proximas.map((a) => `- ${esc(a.titulo)}${a.detalle ? ` — ${esc(a.detalle)}` : ''}`));
		lineas.push('', `<a href="${app}/flota/${i.vehiculoId}">Abrir en la app</a>`);
		return lineas.join('\n');
	}
	if (i.tema === 'donde') {
		if (!i.buscar) return '¿Qué buscas? Por ejemplo: <i>¿Dónde está la dinamométrica?</i>';
		const [articulos, plano] = await Promise.all([db.select().from(s.articulos).where(ne(s.articulos.estado, 'baja')), cargarPlano(db)]);
		const hallados = buscarArticulos(i.buscar, articulos, 5);
		if (!hallados.length) return `No tengo nada parecido a «${esc(i.buscar)}» en el inventario.`;
		return hallados
			.map((a) => {
				const d = describirUbicacion(a, plano.zonas, plano.muebles, plano.contenedores);
				const estado = a.estado === 'prestada' ? ` · <b>prestada${a.prestadaA ? ` a ${esc(a.prestadaA)}` : ''}</b>` : a.estado === 'perdida' ? ' · <b>no la encuentras</b>' : '';
				const donde = d.codigo ? `<b>${d.codigo}</b> — ${esc(d.texto ?? '')}` : a.ubicacion ? `${esc(a.ubicacion)} <i>(sin sitio en el plano)</i>` : '<i>sin ubicar</i>';
				const enlace = d.zonaId ? ` · <a href="${app}/inventario/plano?ver=${a.id}">ver dónde</a>` : '';
				return `📍 ${esc(a.nombre)}\n${donde}${estado}${enlace}`;
			})
			.join('\n\n');
	}
	if (i.tema === 'gasto') {
		const anio = hoy.slice(0, 4);
		const movs = await db
			.select({ fecha: s.movimientos.fecha, importe: s.movimientos.importeCent, cat: s.categorias.nombre })
			.from(s.movimientos)
			.leftJoin(s.categorias, eq(s.movimientos.categoriaId, s.categorias.id))
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.fecha, `${anio}-01-01`), isNull(s.movimientos.cuadreSaldoCent)));
		const reales = movs.filter((m) => m.fecha <= hoy);
		const total = (xs: typeof reales) => xs.reduce((t, m) => t + m.importe, 0);
		const mes = reales.filter((m) => m.fecha.startsWith(hoy.slice(0, 7)));
		const porCat = new Map<string, number>();
		for (const m of reales) porCat.set(m.cat ?? 'Sin categoría', (porCat.get(m.cat ?? 'Sin categoría') ?? 0) + m.importe);
		const top = [...porCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
		return [
			`<b>Gasto</b>`,
			`Este mes: <b>${euros(total(mes))}</b>`,
			`En ${anio}: <b>${euros(total(reales))}</b>`,
			...(top.length ? ['', `<b>Por categoría (${anio})</b>`, ...top.map(([c, t]) => `- ${esc(c)}: ${euros(t, { redondo: true })}`)] : [])
		].join('\n');
	}
	if (i.tema === 'compras') {
		const [manual, alertas] = await Promise.all([
			db.select({ precio: s.listaCompra.precioEstimadoCent }).from(s.listaCompra).where(eq(s.listaCompra.comprado, false)),
			cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias, incluirOk: true })
		]);
		const t = await estadoTaller(db, hoy, alertas);
		if (!t.listaCompra.length) return 'La lista de la compra está vacía.';
		const estimado = manual.reduce((x, m) => x + (m.precio ?? 0), 0);
		return [`<b>Lista de la compra</b> (${t.listaCompra.length})`, ...t.listaCompra.map((c) => `- ${esc(c.texto)} <i>(${esc(c.para)})</i>`), ...(estimado ? ['', `Estimado: ${euros(estimado, { redondo: true })}`] : [])].join('\n');
	}
	if (i.tema === 'agenda') {
		const { eventos, sesiones } = await cargarAgenda(locals);
		const hasta = new Date(Date.parse(`${hoy}T12:00:00Z`) + 30 * 86400000).toISOString().slice(0, 10);
		const proximos = eventos.filter((e) => e.fecha <= hasta);
		const f = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);
		const lineas = ['<b>Próximos 30 días</b>'];
		if (!proximos.length) lineas.push('Nada con fecha.');
		for (const e of proximos) lineas.push(`${e.fecha < hoy ? '🔴' : '-'} ${f(e.fecha)} · ${esc(e.titulo)} <i>(${esc(e.contexto)})</i>${e.importeCent ? ` · ${euros(Math.abs(e.importeCent), { redondo: true })}` : ''}`);
		if (sesiones.length) lineas.push('', '<b>Sesiones de taller recomendadas</b>', ...sesiones.map((x) => `- ${esc(x.vehiculo)}: ${[...x.tocan, ...x.adelantar].map((t) => esc(t.titulo)).join(', ') || esc(x.antesDeItv ?? 'revisión antes de la ITV')}`));
		return lineas.join('\n');
	}
	const precios = await precioCombustibleHoy(locals);
	return mensajeInforme(await datosInforme(db, { hoy, ajustes, precios, nuevas: new Set(), app, conObras: true }));
}
