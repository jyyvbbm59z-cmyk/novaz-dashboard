// Ficha técnica y procedimientos de cada vehículo: guardar, aprender de los mantenimientos, importar/exportar y borrador con IA.
import { claveDato, extraerJson, leerFichaJSON, plantillaFicha, SECCIONES_FICHA, sugerenciasFicha, type FichaJSON, type SeccionFicha } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;
type DB = Locals['db'];

const SECCIONES = new Set<string>(SECCIONES_FICHA.map((x) => x.clave));

export async function cargarFicha(db: DB, vehiculoId: number, tipoVehiculo: string | null) {
	const plantilla = plantillaFicha(tipoVehiculo);
	const [datos, procs, usos] = await Promise.all([
		db.select().from(s.datosTecnicos).where(eq(s.datosTecnicos.vehiculoId, vehiculoId)).orderBy(asc(s.datosTecnicos.id)),
		db.select().from(s.procedimientos).where(eq(s.procedimientos.vehiculoId, vehiculoId)).orderBy(asc(s.procedimientos.titulo)),
		// Lo que se ha usado en sus mantenimientos (aceite, filtros…), para proponer datos
		db
			.select({ nombre: s.articulos.nombre, marca: s.articulos.marca, referencia: s.articulos.referencia, cantidad: s.stock.cantidad, unidad: s.articulos.unidad, fecha: s.stock.fecha })
			.from(s.stock)
			.innerJoin(s.articulos, eq(s.stock.articuloId, s.articulos.id))
			.innerJoin(s.entradas, eq(s.stock.entradaId, s.entradas.id))
			.where(and(eq(s.entradas.vehiculoId, vehiculoId), eq(s.stock.motivo, 'uso')))
			.orderBy(desc(s.stock.fecha))
			.limit(200)
	]);
	const actuales = Object.fromEntries(datos.map((d) => [d.clave, d.valor]));
	return {
		plantilla,
		datos,
		procedimientos: procs,
		sugerencias: sugerenciasFicha(usos.map((u) => ({ ...u, cantidad: -u.cantidad })), actuales, plantilla)
	};
}

/** Guarda un dato (por su clave: si ya existe, lo actualiza). */
export async function fijarDato(db: DB, vehiculoId: number, d: { seccion: string; clave: string; nombre: string; valor: string; unidad?: string | null; detalle?: string | null; fuente?: string | null; verificado: boolean }) {
	const valores = {
		vehiculoId,
		seccion: (SECCIONES.has(d.seccion) ? d.seccion : 'otros') as SeccionFicha,
		clave: claveDato(d.clave || d.nombre),
		nombre: d.nombre.trim().slice(0, 80),
		valor: d.valor.trim().slice(0, 300),
		unidad: d.unidad?.trim() || null,
		detalle: d.detalle?.trim() || null,
		fuente: d.fuente?.trim() || null,
		verificado: d.verificado,
		actualizado: sql`(datetime('now'))`
	};
	await db
		.insert(s.datosTecnicos)
		.values(valores)
		.onConflictDoUpdate({ target: [s.datosTecnicos.vehiculoId, s.datosTecnicos.clave], set: valores });
}

export async function guardarDato(locals: Locals, vehiculoId: number, fd: FormData) {
	const f = leer(fd);
	const nombre = f.obligatorio('nombre', 'qué dato');
	const valor = f.texto('valor');
	const clave = f.texto('clave') ?? claveDato(nombre);
	if (!valor) {
		// Vaciar el valor = borrar el dato
		await locals.db.delete(s.datosTecnicos).where(and(eq(s.datosTecnicos.vehiculoId, vehiculoId), eq(s.datosTecnicos.clave, clave)));
		return;
	}
	await fijarDato(locals.db, vehiculoId, { seccion: f.texto('seccion') ?? 'otros', clave, nombre, valor, unidad: f.texto('unidad'), detalle: f.texto('detalle'), fuente: f.texto('fuente'), verificado: f.bool('verificado') });
}

/** Importa un manual en formato «novaz-ficha». Lo verificado que ya tienes no se pisa con datos sin verificar. */
export async function importarFicha(locals: Locals, vehiculoId: number, texto: string) {
	let raw: unknown;
	try {
		raw = JSON.parse(texto);
	} catch {
		raw = extraerJson(texto);
		if (!raw) throw new ErrorFormulario('Ese archivo no es un JSON válido');
	}
	const { datos, procedimientos, avisos } = leerFichaJSON(raw);
	if (!datos.length && !procedimientos.length) throw new ErrorFormulario(avisos.join(' ') || 'No hay nada que importar');
	const existentes = await locals.db.select().from(s.datosTecnicos).where(eq(s.datosTecnicos.vehiculoId, vehiculoId));
	let nuevos = 0;
	let respetados = 0;
	for (const d of datos) {
		const ya = existentes.find((e) => e.clave === d.clave);
		if (ya?.verificado && !d.verificado) {
			respetados++;
			continue;
		}
		await fijarDato(locals.db, vehiculoId, { ...d, verificado: d.verificado ?? false, fuente: d.fuente ?? 'Manual importado' });
		nuevos++;
	}
	const titulos = new Set((await locals.db.select({ t: s.procedimientos.titulo }).from(s.procedimientos).where(eq(s.procedimientos.vehiculoId, vehiculoId))).map((p) => p.t.toLowerCase()));
	const procs = procedimientos.filter((p) => !titulos.has(p.titulo.toLowerCase()));
	if (procs.length)
		await locals.db.insert(s.procedimientos).values(procs.map((p) => ({ vehiculoId, titulo: p.titulo, tiempoMin: p.tiempoMin ?? null, herramientas: p.herramientas ?? [], pasos: p.pasos, notas: p.notas ?? null })));
	return { nuevos, respetados, procedimientos: procs.length, avisos };
}

export async function exportarFicha(db: DB, vehiculoId: number): Promise<FichaJSON> {
	const [v, datos, procs] = await Promise.all([
		db.select().from(s.vehiculos).where(eq(s.vehiculos.id, vehiculoId)).get(),
		db.select().from(s.datosTecnicos).where(eq(s.datosTecnicos.vehiculoId, vehiculoId)).orderBy(asc(s.datosTecnicos.id)),
		db.select().from(s.procedimientos).where(eq(s.procedimientos.vehiculoId, vehiculoId)).orderBy(asc(s.procedimientos.titulo))
	]);
	return {
		formato: 'novaz-ficha',
		version: 1,
		vehiculo: v ? [v.marca, v.modelo, v.anio ? `(${v.anio})` : null].filter(Boolean).join(' ') || v.alias : undefined,
		datos: datos.map((d) => ({ seccion: d.seccion as SeccionFicha, clave: d.clave, nombre: d.nombre, valor: d.valor, unidad: d.unidad, detalle: d.detalle, fuente: d.fuente, verificado: d.verificado })),
		procedimientos: procs.map((p) => ({ titulo: p.titulo, tiempoMin: p.tiempoMin, herramientas: p.herramientas, pasos: p.pasos.map((x) => ({ texto: x.texto, par: x.par ?? null })), notas: p.notas }))
	};
}

const MODELO = '@cf/meta/llama-4-scout-17b-16e-instruct';

/** Borrador con IA: propone valores típicos para los huecos vacíos, siempre como «sin verificar». */
export async function borradorConIa(locals: Locals, ai: Ai, vehiculoId: number) {
	const v = await locals.db
		.select({ v: s.vehiculos, tipo: s.tiposVehiculo.nombre })
		.from(s.vehiculos)
		.innerJoin(s.tiposVehiculo, eq(s.vehiculos.tipoId, s.tiposVehiculo.id))
		.where(eq(s.vehiculos.id, vehiculoId))
		.get();
	if (!v) throw new ErrorFormulario('Vehículo no encontrado');
	const plantilla = plantillaFicha(v.tipo);
	const ya = new Set((await locals.db.select({ c: s.datosTecnicos.clave }).from(s.datosTecnicos).where(eq(s.datosTecnicos.vehiculoId, vehiculoId))).map((d) => d.c));
	const huecos = plantilla.filter((p) => !ya.has(p.clave));
	if (!huecos.length) return 0;
	const desc = [v.v.marca, v.v.modelo, v.v.anio, v.v.notas?.slice(0, 300), ...Object.entries(v.v.campos ?? {}).map(([k, x]) => `${k}: ${String(x)}`)].filter(Boolean).join(' · ');
	const prompt = `Eres un mecánico experto. Para este vehículo: ${desc} (${v.tipo}), da los valores de fábrica que conozcas con seguridad para estos datos. Si no estás seguro de uno, NO lo incluyas. Devuelve SOLO un JSON {"datos":[{"clave":"...","valor":"...","unidad":"..."}]} con las claves de esta lista:\n${huecos.map((h) => `- ${h.clave}: ${h.nombre}${h.unidad ? ` (${h.unidad})` : ''}${h.ayuda ? ` — ${h.ayuda}` : ''}`).join('\n')}\nNúmeros con coma decimal española. Sin texto fuera del JSON.`;
	const r = (await ai.run(MODELO as Parameters<Ai['run']>[0], { messages: [{ role: 'user', content: prompt }], max_tokens: 1200, temperature: 0.1 } as never)) as { response?: unknown };
	const o = extraerJson(r?.response) ?? {};
	const lista = Array.isArray((o as Record<string, unknown>).datos) ? ((o as Record<string, unknown>).datos as Record<string, unknown>[]) : [];
	let n = 0;
	for (const d of lista) {
		const h = huecos.find((x) => x.clave === d?.clave);
		const valor = typeof d?.valor === 'string' || typeof d?.valor === 'number' ? String(d.valor).trim() : '';
		if (!h || !valor || /desconoc|no disponible|n\/a/i.test(valor)) continue;
		await fijarDato(locals.db, vehiculoId, { seccion: h.seccion, clave: h.clave, nombre: h.nombre, valor, unidad: h.unidad ?? (typeof d.unidad === 'string' ? d.unidad : null), fuente: 'IA · sin verificar', verificado: false });
		n++;
	}
	return n;
}

// ─── Procedimientos ──────────────────────────────────────────────────────────

const lineas = (t: string | null) =>
	(t ?? '')
		.split(/\n+/)
		.map((l) => l.replace(/^\s*(\d+[.)-]|[-•*])\s*/, '').trim())
		.filter(Boolean);

/** Un paso por línea; «… | 25 Nm» al final de la línea es su par de apriete. */
function pasosDeTexto(t: string | null) {
	return lineas(t).map((l) => {
		const [texto, par] = l.split(/\s*\|\s*/);
		return { texto: texto.slice(0, 600), par: par?.slice(0, 60) || null };
	});
}

export async function guardarProcedimiento(locals: Locals, vehiculoId: number, fd: FormData) {
	const f = leer(fd);
	const id = f.idOpcional('id');
	const pasos = pasosDeTexto(f.texto('pasos'));
	if (!pasos.length) throw new ErrorFormulario('Escribe al menos un paso (uno por línea)');
	const valores = {
		vehiculoId,
		titulo: f.obligatorio('titulo', 'título'),
		tiempoMin: f.entero('tiempoMin'),
		herramientas: lineas(f.texto('herramientas')?.replace(/,\s*/g, '\n') ?? null).slice(0, 30),
		pasos,
		entradaId: f.idOpcional('entradaId'),
		notas: f.texto('notas')
	};
	if (id) await locals.db.update(s.procedimientos).set(valores).where(and(eq(s.procedimientos.id, id), eq(s.procedimientos.vehiculoId, vehiculoId)));
	else await locals.db.insert(s.procedimientos).values(valores);
}
