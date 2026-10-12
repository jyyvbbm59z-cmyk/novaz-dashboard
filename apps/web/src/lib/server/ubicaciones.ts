// El local por zonas: muebles en el plano y dónde está cada artículo.
import { ALTO_CONTENEDOR, codigoUbicacion, nivelValido, conRejilla, CONTENEDORES, encajar, huecoLibre, huella, limpiarDisposicion, MUEBLES, nivelesMueble, rejillaBalda, sePisan, type Celda, ordenLetra, siguienteCodigoMueble, siguienteLetra, zonaEnPunto, type DisposicionMueble } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { TIPOS_ARTICULO, TIPOS_CONTENEDOR, TIPOS_MUEBLE, type TipoArticulo, type TipoContenedor, type TipoMueble } from '@novaz/core/schema';
import { and, asc, eq, gt, inArray, ne } from 'drizzle-orm';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

export async function cargarPlano(db: Locals['db']) {
	const [zonas, muebles, contenedores] = await Promise.all([
		db.select().from(s.zonas).orderBy(asc(s.zonas.orden), asc(s.zonas.codigo)),
		db.select().from(s.muebles).orderBy(asc(s.muebles.codigo)),
		db.select().from(s.contenedores)
	]);
	contenedores.sort((a, b) => a.muebleId - b.muebleId || (a.nivel ?? 0) - (b.nivel ?? 0) || ordenLetra(a.letra, b.letra));
	return { zonas, muebles, contenedores };
}
export type Plano = Awaited<ReturnType<typeof cargarPlano>>;

/** La zona de un mueble: la que contiene su centro. */
/** La zona de un mueble por dónde cae su centro. Si sigue dentro de la que ya tenía (p. ej. justo en la raya entre dos), se queda en esa. */
async function zonaDelMueble(db: Locals['db'], m: { x: number; y: number; ancho: number; fondo: number; girado: boolean }, actual: number | null = null) {
	const h = huella(m);
	const zonas = await db.select().from(s.zonas);
	const [cx, cy] = [h.x + h.ancho / 2, h.y + h.alto / 2];
	const suya = zonas.find((z) => z.id === actual);
	if (suya && cx >= suya.x && cx <= suya.x + suya.ancho && cy >= suya.y && cy <= suya.y + suya.alto) return suya.id;
	return zonaEnPunto(cx, cy, zonas)?.id ?? null;
}

const medida = (v: number | null, min: number, max: number, def: number) => (v == null || !Number.isFinite(v) ? def : Math.min(Math.max(v, min), max));

export async function guardarMueble(locals: Locals, fd: FormData) {
	const { db } = locals;
	const f = leer(fd);
	const id = f.idOpcional('id');
	const tipoCrudo = f.texto('tipo') as TipoMueble;
	const tipo = TIPOS_MUEBLE.includes(tipoCrudo) ? tipoCrudo : 'estanteria';
	const def = MUEBLES[tipo];
	const existentes = await db.select({ id: s.muebles.id, codigo: s.muebles.codigo }).from(s.muebles);
	const codigo = (f.texto('codigo') ?? '').toUpperCase().replace(/\s+/g, '') || siguienteCodigoMueble(tipo, existentes.filter((m) => m.id !== id));
	if (!/^[A-Z0-9-]{1,8}$/.test(codigo)) throw new ErrorFormulario('El código: letras y números, sin espacios (p. ej. E3)');
	if (existentes.some((m) => m.codigo === codigo && m.id !== id)) throw new ErrorFormulario(`Ya hay un mueble ${codigo}`);
	const valores = {
		tipo,
		codigo,
		nombre: f.texto('nombre') ?? def.nombre,
		x: medida(f.decimal('x'), -1, 20, 1),
		y: medida(f.decimal('y'), -1, 20, 1),
		ancho: medida(f.decimal('ancho'), 0.05, 10, def.ancho),
		fondo: medida(f.decimal('fondo'), 0.05, 10, def.fondo),
		girado: f.bool('girado'),
		niveles: Math.round(medida(f.entero('niveles'), 0, 30, def.niveles)),
		disposicion: null as DisposicionMueble | null,
		notas: f.texto('notas')
	};
	// A medida: filas de distinto alto, partidas en cajones o huecos; el número de niveles sale de ahí
	const crudo = f.texto('disposicion');
	if (crudo) {
		let d: DisposicionMueble | null = null;
		try {
			d = limpiarDisposicion(JSON.parse(crudo));
		} catch {
			throw new ErrorFormulario('La disposición de cajones no se entiende');
		}
		if (d) ((valores.disposicion = d), (valores.niveles = nivelesMueble({ tipo, disposicion: d }).length));
	}
	const antes = id ? await db.select({ zonaId: s.muebles.zonaId }).from(s.muebles).where(eq(s.muebles.id, id)).get() : null;
	const zonaId = await zonaDelMueble(db, valores, antes?.zonaId ?? null);
	if (id) {
		await db.update(s.muebles).set({ ...valores, zonaId }).where(eq(s.muebles.id, id));
		// Lo que estaba en una balda que ya no existe se queda en el mueble, sin balda
		await db.update(s.articulos).set({ nivel: null }).where(and(eq(s.articulos.muebleId, id), gt(s.articulos.nivel, valores.niveles)));
		await db.update(s.contenedores).set({ nivel: null }).where(and(eq(s.contenedores.muebleId, id), gt(s.contenedores.nivel, valores.niveles)));
		await db.update(s.articulos).set({ zonaId }).where(eq(s.articulos.muebleId, id));
		return id;
	}
	const [m] = await db.insert(s.muebles).values({ ...valores, zonaId }).returning({ id: s.muebles.id });
	return m.id;
}

export async function moverMueble(locals: Locals, id: number, x: number, y: number) {
	const m = await locals.db.select().from(s.muebles).where(eq(s.muebles.id, id)).get();
	if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
	const zonaId = await zonaDelMueble(locals.db, { ...m, x, y }, m.zonaId);
	await locals.db.update(s.muebles).set({ x, y, zonaId }).where(eq(s.muebles.id, id));
	await locals.db.update(s.articulos).set({ zonaId }).where(eq(s.articulos.muebleId, id));
}

/** Borra un mueble: lo que tenía se queda en su zona, sin mueble (para reubicarlo). */
export async function borrarMueble(locals: Locals, id: number) {
	const m = await locals.db.select().from(s.muebles).where(eq(s.muebles.id, id)).get();
	if (!m) return;
	await locals.db.update(s.articulos).set({ muebleId: null, nivel: null, contenedorId: null, zonaId: m.zonaId }).where(eq(s.articulos.muebleId, id));
	await locals.db.delete(s.muebles).where(eq(s.muebles.id, id));
}

export async function guardarZona(locals: Locals, fd: FormData) {
	const f = leer(fd);
	const id = f.id('id');
	const color = f.texto('color');
	const codigo = (f.texto('codigo') ?? '').toUpperCase();
	if (!/^[A-Z0-9]{1,3}$/.test(codigo)) throw new ErrorFormulario('El código de la zona: una letra (o hasta 3 caracteres)');
	const otra = await locals.db.select({ id: s.zonas.id }).from(s.zonas).where(and(eq(s.zonas.codigo, codigo), ne(s.zonas.id, id))).get();
	if (otra) throw new ErrorFormulario(`Ya hay una zona ${codigo}`);
	await locals.db
		.update(s.zonas)
		.set({ codigo, nombre: f.obligatorio('nombre', 'nombre'), notas: f.texto('notas'), ...(color && /^#[0-9a-f]{6}$/i.test(color) ? { color } : {}) })
		.where(eq(s.zonas.id, id));
}

type Sitio = { muebleId: number | null; nivel: number | null; zonaId?: number | null; contenedorId?: number | null };

/** Completa un sitio: el contenedor manda (su mueble y su balda), el mueble da la zona. */
async function resolverSitio(db: Locals['db'], sitio: Sitio) {
	let { muebleId, nivel } = sitio;
	let contenedorId = sitio.contenedorId ?? null;
	if (contenedorId) {
		const c = await db.select().from(s.contenedores).where(eq(s.contenedores.id, contenedorId)).get();
		if (!c) throw new ErrorFormulario('Ese contenedor ya no existe');
		muebleId = c.muebleId;
		nivel = c.nivel;
	}
	let zonaId = sitio.zonaId ?? null;
	if (muebleId) {
		const m = await db.select({ zonaId: s.muebles.zonaId, niveles: s.muebles.niveles, tipo: s.muebles.tipo }).from(s.muebles).where(eq(s.muebles.id, muebleId)).get();
		if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
		if (nivel != null && !nivelValido(m, nivel)) throw new ErrorFormulario('Esa balda no existe');
		zonaId = m.zonaId;
	} else contenedorId = null;
	return { muebleId, nivel: muebleId ? nivel : null, zonaId, contenedorId };
}

/** Coloca artículos en un sitio: contenedor, mueble y balda, o solo la zona. */
export async function ubicarArticulos(locals: Locals, ids: number[], sitio: Sitio) {
	if (!ids.length) return;
	await locals.db.update(s.articulos).set(await resolverSitio(locals.db, sitio)).where(inArray(s.articulos.id, ids));
}

/** Sitio enviado por un formulario: contenedorId, o muebleId + nivel, o zonaId. */
export async function sitioDeFormulario(db: Locals['db'], fd: FormData) {
	const f = leer(fd);
	const nivel = f.entero('nivel');
	try {
		return await resolverSitio(db, { muebleId: f.idOpcional('muebleId'), nivel: nivel != null && nivel >= 0 ? nivel : null, zonaId: f.idOpcional('zonaId'), contenedorId: f.idOpcional('contenedorId') });
	} catch {
		return { muebleId: null, nivel: null, zonaId: f.idOpcional('zonaId'), contenedorId: null };
	}
}

// ─── Contenedores ────────────────────────────────────────────────────────────

export interface DestinoContenedor {
	muebleId: number;
	nivel: number | null;
	/** Tercio (1–3) y altura (0 = sobre la balda) si se eligen; si no, el primer hueco libre. */
	columna?: number | null;
	piso?: number | null;
}
type SitioContenedor = Pick<s.Contenedor, 'muebleId' | 'nivel' | 'letra' | 'columna' | 'ancho' | 'piso' | 'alto'>;

/**
 * Cómo quedaría un contenedor en otro sitio (sin guardar nada): su letra (la misma si está libre), su hueco en la
 * rejilla de la balda y los códigos de antes y de después. Si no cabe, `error` lo explica.
 */
export async function planearMovimiento(db: Locals['db'], id: number, destino: DestinoContenedor) {
	const c = await db.select().from(s.contenedores).where(eq(s.contenedores.id, id)).get();
	if (!c) throw new ErrorFormulario('Ese contenedor ya no existe');
	const plano = await cargarPlano(db);
	const m = plano.muebles.find((x) => x.id === destino.muebleId);
	if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
	const nivel = nivelValido(m, destino.nivel) ? destino.nivel : null;
	const hermanos = plano.contenedores.filter((h) => h.muebleId === m.id && h.nivel === nivel && h.id !== id);
	const letra = hermanos.some((h) => h.letra === c.letra) ? siguienteLetra(hermanos.map((h) => h.letra)) : c.letra;
	let celda: Celda | null = null;
	let error: string | null = null;
	if (nivel != null && conRejilla(m.tipo)) {
		const ocupadas = [...(rejillaBalda(hermanos, true) ?? new Map<number, Celda>()).values()];
		const tam = { ancho: c.ancho ?? 1, alto: c.alto ?? ALTO_CONTENEDOR[c.tipo] };
		if (destino.columna) {
			const pisos = destino.piso != null ? [destino.piso] : Array.from({ length: 3 }, (_, k) => k);
			celda = pisos.map((piso) => encajar({ ...tam, columna: destino.columna, piso })).find((x) => !ocupadas.some((o) => sePisan(o, x))) ?? null;
			if (!celda) error = 'No cabe en ese tercio de la balda';
		} else {
			celda = huecoLibre(ocupadas, encajar(tam));
			if (!celda) error = 'No queda un hueco de su tamaño en esa balda';
		}
	}
	const zonaDe = (muebleId: number) => plano.zonas.find((z) => z.id === plano.muebles.find((x) => x.id === muebleId)?.zonaId);
	const muebleAntes = plano.muebles.find((x) => x.id === c.muebleId);
	return {
		c,
		mueble: m,
		despues: { muebleId: m.id, nivel, letra, ...(celda ?? { columna: null, ancho: c.ancho, piso: null, alto: c.alto }) } satisfies SitioContenedor,
		codigoAntes: codigoUbicacion(zonaDe(c.muebleId), muebleAntes, c.nivel, c) ?? '',
		codigoDespues: codigoUbicacion(zonaDe(m.id), m, nivel, { letra }) ?? '',
		letraCambiada: letra !== c.letra,
		hermanos,
		error
	};
}

/** Lleva un contenedor (y todo lo de dentro) a otro mueble, balda y hueco. Devuelve dónde estaba, para poder deshacerlo. */
export async function moverContenedor(locals: Locals, id: number, destino: DestinoContenedor) {
	const { db } = locals;
	const p = await planearMovimiento(db, id, destino);
	if (p.error) throw new ErrorFormulario(p.error);
	// Los de la balda de destino que aún no tenían sitio se quedan donde se ven
	if (p.despues.nivel != null && conRejilla(p.mueble.tipo)) {
		const auto = rejillaBalda(p.hermanos, true);
		for (const h of p.hermanos) if (h.columna == null && auto?.get(h.id)) await db.update(s.contenedores).set(auto.get(h.id)!).where(eq(s.contenedores.id, h.id));
	}
	const antes: SitioContenedor = { muebleId: p.c.muebleId, nivel: p.c.nivel, letra: p.c.letra, columna: p.c.columna, ancho: p.c.ancho, piso: p.c.piso, alto: p.c.alto };
	await aplicarSitioContenedor(db, id, p.despues);
	return { antes, codigoAntes: p.codigoAntes, codigoDespues: p.codigoDespues, letraCambiada: p.letraCambiada, muebleId: p.mueble.id };
}

/** Pone un contenedor en un sitio (y lo de dentro con él). También sirve para deshacer un movimiento. */
export async function aplicarSitioContenedor(db: Locals['db'], id: number, sitio: SitioContenedor) {
	const m = await db.select({ zonaId: s.muebles.zonaId }).from(s.muebles).where(eq(s.muebles.id, sitio.muebleId)).get();
	if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
	// Si al deshacer su letra ya está cogida en la balda de antes, la siguiente libre
	const otros = await db.select({ letra: s.contenedores.letra, nivel: s.contenedores.nivel }).from(s.contenedores).where(and(eq(s.contenedores.muebleId, sitio.muebleId), ne(s.contenedores.id, id)));
	const usadas = otros.filter((o) => o.nivel === sitio.nivel).map((o) => o.letra);
	const letra = usadas.includes(sitio.letra) ? siguienteLetra(usadas) : sitio.letra;
	await db.update(s.contenedores).set({ ...sitio, letra }).where(eq(s.contenedores.id, id));
	await db.update(s.articulos).set({ muebleId: sitio.muebleId, nivel: sitio.nivel, zonaId: m.zonaId }).where(eq(s.articulos.contenedorId, id));
}

/** Lleva un artículo suelto a otro sitio. Devuelve dónde estaba, para poder deshacerlo. */
export async function moverArticulo(locals: Locals, id: number, sitio: Sitio) {
	const a = await locals.db.select({ muebleId: s.articulos.muebleId, nivel: s.articulos.nivel, zonaId: s.articulos.zonaId, contenedorId: s.articulos.contenedorId }).from(s.articulos).where(eq(s.articulos.id, id)).get();
	if (!a) throw new ErrorFormulario('Eso ya no está en el inventario');
	await ubicarArticulos(locals, [id], sitio);
	return a;
}

export async function guardarContenedor(locals: Locals, fd: FormData) {
	const { db } = locals;
	const f = leer(fd);
	const id = f.idOpcional('id');
	const muebleId = f.id('muebleId');
	const m = await db.select({ niveles: s.muebles.niveles, tipo: s.muebles.tipo }).from(s.muebles).where(eq(s.muebles.id, muebleId)).get();
	if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
	const nivelCrudo = f.entero('nivel');
	const nivel = nivelValido(m, nivelCrudo) ? nivelCrudo : null;
	const tipoCrudo = f.texto('tipo') as TipoContenedor;
	const tipo = TIPOS_CONTENEDOR.includes(tipoCrudo) ? tipoCrudo : 'cubo';
	const hermanos = (await db.select().from(s.contenedores).where(eq(s.contenedores.muebleId, muebleId))).filter((c) => c.nivel === nivel && c.id !== id);
	const letra = (f.texto('letra') ?? '').toUpperCase().replace(/[^A-Z]/g, '') || siguienteLetra(hermanos.map((c) => c.letra));
	if (hermanos.some((c) => c.letra === letra)) throw new ErrorFormulario(`Ya hay un contenedor ${letra} en esa balda`);
	// Su sitio en la rejilla de la balda (3 tercios × 3 alturas): el que se eligió o el primer hueco libre
	let celda: Celda | null = null;
	if (nivel != null && conRejilla(m.tipo)) {
		const ocupadas = rejillaBalda(hermanos) ?? new Map<number, Celda>();
		const tam = { ancho: f.entero('ancho') ?? 1, alto: f.entero('alto') ?? ALTO_CONTENEDOR[tipo] };
		const columna = f.entero('columna');
		if (columna) {
			celda = encajar({ ...tam, columna, piso: f.entero('piso') ?? 0 });
			const pisa = hermanos.find((h) => ocupadas.get(h.id) && sePisan(ocupadas.get(h.id)!, celda!));
			if (pisa) throw new ErrorFormulario(`Ahí ya está ${CONTENEDORES[pisa.tipo].toLowerCase()} ${pisa.letra}`);
		} else celda = huecoLibre([...ocupadas.values()], encajar(tam));
		// Los de al lado que aún no tenían sitio se quedan donde se ven ahora
		for (const h of hermanos) if (h.columna == null && ocupadas.get(h.id)) await db.update(s.contenedores).set(ocupadas.get(h.id)!).where(eq(s.contenedores.id, h.id));
	}
	const valores = { muebleId, nivel, letra, tipo, nombre: f.texto('nombre') ?? '', notas: f.texto('notas'), ...(celda ?? { columna: null, ancho: null, piso: null, alto: null }) };
	if (id) {
		await db.update(s.contenedores).set(valores).where(eq(s.contenedores.id, id));
		await db.update(s.articulos).set({ muebleId, nivel }).where(eq(s.articulos.contenedorId, id));
		return id;
	}
	const [c] = await db.insert(s.contenedores).values(valores).returning({ id: s.contenedores.id });
	return c.id;
}

/** Borra un contenedor: lo que tenía se queda en la misma balda, suelto. */
export async function borrarContenedor(locals: Locals, id: number) {
	await locals.db.update(s.articulos).set({ contenedorId: null }).where(eq(s.articulos.contenedorId, id));
	await locals.db.delete(s.contenedores).where(eq(s.contenedores.id, id));
}

/**
 * Alta de golpe de lo que hay en un sitio (de una foto o una lista): lo nuevo se crea con su cantidad
 * y lo que ya estaba en el inventario (moverId) se mueve aquí.
 */
export async function altaEnSitio(
	locals: Locals,
	objetos: { nombre: string; marca: string | null; cantidad: number; tipo: string; categoria: string | null; moverId?: number | null }[],
	sitioPedido: Sitio
) {
	const mover = objetos.flatMap((o) => (o.moverId ? [o.moverId] : []));
	const nuevos = objetos.filter((o) => !o.moverId && o.nombre.trim());
	const sitio = await resolverSitio(locals.db, sitioPedido);
	await ubicarArticulos(locals, mover, sitio);
	for (let i = 0; i < nuevos.length; i += 20) {
		const lote = nuevos.slice(i, i + 20);
		const creados = await locals.db
			.insert(s.articulos)
			.values(
				lote.map((o) => ({
					tipo: (TIPOS_ARTICULO.includes(o.tipo as TipoArticulo) ? o.tipo : 'herramienta') as TipoArticulo,
					nombre: o.nombre.trim().slice(0, 120),
					marca: o.marca?.trim() || null,
					categoria: o.categoria?.trim() || null,
					...sitio
				}))
			)
			.returning({ id: s.articulos.id });
		await locals.db.insert(s.stock).values(creados.map((c, k) => ({ articuloId: c.id, fecha: locals.hoy, cantidad: Math.max(lote[k].cantidad, 0) || 1, motivo: 'alta' as const })));
	}
	return { creados: nuevos.length, movidos: mover.length };
}
