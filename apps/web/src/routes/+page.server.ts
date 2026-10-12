import * as s from '@novaz/core/schema';
import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { avanceRestauraciones } from '$lib/server/datos';
import { cargarAlertas, diasEntre, estadoTaller, sesionesRecomendadas, textoDias, type Nivel, type Permiso } from '@novaz/core';
import { libros } from '$lib/server/contabilidad';
import { soloVisibles } from '$lib/server/usuarios';

/** Una cosa que hacer, venga de donde venga (papeles, revisiones, averías, el local, la compra). */
export interface Asunto {
	clave: string;
	nivel: Nivel | 'normal';
	titulo: string;
	contexto: string;
	cuando: string;
	href: string;
	/** Tarea del local: se puede tachar desde el inicio. */
	tareaLocalId?: number;
	/** Para ordenar dentro del mismo nivel (días hasta la fecha; sin fecha, al final). */
	orden: number;
}

const PESO: Record<Asunto['nivel'], number> = { vencido: 0, urgente: 1, pronto: 2, normal: 3, ok: 4 };

export const load = async ({ locals }) => {
	const { db, hoy } = locals;
	const anio = hoy.slice(0, 4);
	// Cada uno ve lo suyo: sin «Dinero» no se calcula nada de dinero
	const ver = (p: Permiso) => locals.permisos.includes(p);

	const [todasAlertas, restas, gastosAnio, { asientos }] = await Promise.all([
		cargarAlertas(db, { hoy, urgenteDias: locals.ajustes.urgenteDias, incluirOk: true }),
		!ver('vehiculos') ? [] : db
			.select({ r: s.restauraciones, vehiculo: s.vehiculos.alias })
			.from(s.restauraciones)
			.innerJoin(s.vehiculos, eq(s.restauraciones.vehiculoId, s.vehiculos.id))
			.where(inArray(s.restauraciones.estado, ['en_curso', 'pausada', 'planificada']))
			.orderBy(desc(s.restauraciones.fechaInicio)),
		!ver('dinero') ? [] : db
			.select({ fecha: s.movimientos.fecha, importe: s.movimientos.importeCent })
			.from(s.movimientos)
			.where(and(eq(s.movimientos.tipo, 'gasto'), gte(s.movimientos.fecha, `${anio}-01-01`), lte(s.movimientos.fecha, hoy), isNull(s.movimientos.cuadreSaldoCent))),
		ver('dinero') ? libros(locals) : { asientos: [] as Awaited<ReturnType<typeof libros>>['asientos'] }
	]);
	const alertas = ver('vehiculos') ? soloVisibles(locals.yo, todasAlertas, (a) => a.vehiculoId) : [];
	const [t, planes] = await Promise.all([estadoTaller(db, hoy, alertas), db.select().from(s.planesMantenimiento).where(eq(s.planesMantenimiento.activo, true))]);

	// Todo lo pendiente en una sola lista, de lo más urgente a lo menos
	const asuntos: Asunto[] = [];
	for (const a of alertas) {
		if (a.nivel === 'ok') continue;
		const pestana = a.tipo === 'vencimiento' ? 'papeles' : a.tipo === 'pendiente' ? 'historial' : 'mantenimiento';
		asuntos.push({
			clave: a.clave,
			nivel: a.nivel,
			titulo: a.titulo,
			contexto: a.tipo === 'pendiente' ? `${a.vehiculo} · ${a.detalle === 'Tras la mejora' ? 'tras la mejora' : 'avería'}` : a.vehiculo,
			cuando: a.tipo === 'vencimiento' && a.dias != null ? textoDias(a.dias) : a.tipo === 'pendiente' ? (a.nivel === 'urgente' ? 'urgente' : a.detalle === 'Tras la mejora' ? 'pendiente' : 'por reparar') : a.detalle,
			href: `/flota/${a.vehiculoId}?pestana=${pestana}`,
			orden: a.dias ?? 999
		});
	}
	for (const tarea of ver('local') ? t.local : []) {
		const dias = tarea.fechaLimite ? diasEntre(hoy, tarea.fechaLimite) : null;
		const nivel: Asunto['nivel'] = dias != null && dias < 0 ? 'vencido' : tarea.prioridad === 'alta' ? 'urgente' : dias != null && dias <= 14 ? 'pronto' : 'normal';
		asuntos.push({
			clave: `local:${tarea.id}`,
			nivel,
			titulo: tarea.titulo,
			contexto: tarea.zona ? `El local · ${tarea.zona}` : 'El local',
			cuando: dias != null ? (dias < 0 ? `venció ${textoDias(dias)}` : textoDias(dias)) : tarea.prioridad === 'alta' ? 'urgente' : 'sin fecha',
			href: '/local',
			tareaLocalId: tarea.id,
			orden: dias ?? 999
		});
	}
	// Sesiones de taller recomendadas: juntar lo que toca con lo que vence pronto
	for (const se of sesionesRecomendadas(alertas, planes, hoy))
		asuntos.push({
			clave: `sesion:${se.vehiculoId}`,
			nivel: 'pronto',
			titulo: se.tocan.length ? `Sesión de taller: ${se.tocan.length + se.adelantar.length} revisiones juntas` : 'Revisión antes de la ITV',
			contexto: `${se.vehiculo} · ${[...se.tocan, ...se.adelantar].map((x) => x.titulo.split(' · ')[0]).join(' + ') || 'luces, neumáticos, frenos…'}`,
			cuando: textoDias(diasEntre(hoy, se.fecha)),
			href: `/flota/${se.vehiculoId}?pestana=mantenimiento#sesion`,
			orden: diasEntre(hoy, se.fecha)
		});
	t.listaCompra = t.listaCompra.filter((c) => c.vehiculoId == null || !locals.yo?.vehiculos || locals.yo.vehiculos.includes(c.vehiculoId));
	if (ver('inventario') && t.listaCompra.length)
		asuntos.push({
			clave: 'compras',
			nivel: 'normal',
			titulo: `Comprar ${t.listaCompra.length} ${t.listaCompra.length === 1 ? 'cosa' : 'cosas'}`,
			contexto: t.listaCompra.slice(0, 3).map((c) => c.texto).join(', ') + (t.listaCompra.length > 3 ? '…' : ''),
			cuando: '',
			href: '/compras',
			orden: 1000
		});
	if (ver('inventario') && t.fueraDeSitio)
		asuntos.push({
			clave: 'herramientas',
			nivel: 'pronto',
			titulo: `${t.fueraDeSitio} ${t.fueraDeSitio === 1 ? 'herramienta sin localizar' : 'herramientas sin localizar'}`,
			contexto: 'Inventario',
			cuando: '',
			href: '/inventario',
			orden: 1000
		});
	asuntos.sort((a, b) => PESO[a.nivel] - PESO[b.nivel] || a.orden - b.orden);

	// El próximo papel que vence, aunque falte mucho (si no está ya en la lista)
	const prox = alertas.filter((a) => a.tipo === 'vencimiento' && a.dias != null && a.dias >= 0).sort((a, b) => a.dias! - b.dias!)[0];
	const proximoTramite = prox && prox.nivel === 'ok' ? { titulo: prox.titulo, vehiculo: prox.vehiculo, cuando: textoDias(prox.dias!), detalle: prox.detalle, href: `/flota/${prox.vehiculoId}?pestana=papeles` } : null;

	// Dinero: lo que hay y lo que va de gasto
	const saldo = (pref: string) => asientos.filter((a) => a.fecha <= hoy).reduce((tot, a) => tot + a.apuntes.filter((p) => p.cuenta.startsWith(pref)).reduce((x, p) => x + p.debe - p.haber, 0), 0);
	const dinero = !ver('dinero') ? null : {
		disponible: saldo('57'),
		diasCuadre: locals.ajustes.ultimoCuadre ? diasEntre(locals.ajustes.ultimoCuadre, hoy) : null,
		gastoMes: gastosAnio.filter((g) => g.fecha.startsWith(hoy.slice(0, 7))).reduce((tot, g) => tot + g.importe, 0),
		gastoAnio: gastosAnio.reduce((tot, g) => tot + g.importe, 0)
	};

	const obrasVisibles = soloVisibles(locals.yo, restas, (x) => x.r.vehiculoId);
	const avances = await avanceRestauraciones(db, obrasVisibles.map((x) => x.r.id));
	return {
		asuntos,
		proximoTramite,
		dinero,
		obras: obrasVisibles.map((x) => {
			const a = avances.get(x.r.id);
			return { id: x.r.id, nombre: x.r.nombre, estado: x.r.estado, vehiculo: x.vehiculo, avance: a && a.total ? a.hechas / a.total : 0 };
		})
	};
};
