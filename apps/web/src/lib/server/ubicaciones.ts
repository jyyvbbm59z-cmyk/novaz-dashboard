// El local por zonas: muebles en el plano y dónde está cada artículo.
import { huella, limpiarDisposicion, MUEBLES, nivelesMueble, ordenLetra, siguienteCodigoMueble, siguienteLetra, zonaEnPunto, type DisposicionMueble } from '@novaz/core';
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
async function zonaDelMueble(db: Locals['db'], m: { x: number; y: number; ancho: number; fondo: number; girado: boolean }) {
	const h = huella(m);
	const zonas = await db.select().from(s.zonas);
	return zonaEnPunto(h.x + h.ancho / 2, h.y + h.alto / 2, zonas)?.id ?? null;
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
	const zonaId = await zonaDelMueble(db, valores);
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
	const zonaId = await zonaDelMueble(locals.db, { ...m, x, y });
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
		const m = await db.select({ zonaId: s.muebles.zonaId, niveles: s.muebles.niveles }).from(s.muebles).where(eq(s.muebles.id, muebleId)).get();
		if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
		if (nivel != null && (nivel < 1 || nivel > m.niveles)) throw new ErrorFormulario('Esa balda no existe');
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
		return await resolverSitio(db, { muebleId: f.idOpcional('muebleId'), nivel: nivel && nivel >= 1 ? nivel : null, zonaId: f.idOpcional('zonaId'), contenedorId: f.idOpcional('contenedorId') });
	} catch {
		return { muebleId: null, nivel: null, zonaId: f.idOpcional('zonaId'), contenedorId: null };
	}
}

// ─── Contenedores ────────────────────────────────────────────────────────────

export async function guardarContenedor(locals: Locals, fd: FormData) {
	const { db } = locals;
	const f = leer(fd);
	const id = f.idOpcional('id');
	const muebleId = f.id('muebleId');
	const m = await db.select({ niveles: s.muebles.niveles }).from(s.muebles).where(eq(s.muebles.id, muebleId)).get();
	if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
	const nivelCrudo = f.entero('nivel');
	const nivel = nivelCrudo && nivelCrudo >= 1 && nivelCrudo <= m.niveles ? nivelCrudo : null;
	const tipoCrudo = f.texto('tipo') as TipoContenedor;
	const tipo = TIPOS_CONTENEDOR.includes(tipoCrudo) ? tipoCrudo : 'cubo';
	const hermanos = (await db.select({ id: s.contenedores.id, nivel: s.contenedores.nivel, letra: s.contenedores.letra }).from(s.contenedores).where(eq(s.contenedores.muebleId, muebleId))).filter(
		(c) => c.nivel === nivel && c.id !== id
	);
	const letra = (f.texto('letra') ?? '').toUpperCase().replace(/[^A-Z]/g, '') || siguienteLetra(hermanos.map((c) => c.letra));
	if (hermanos.some((c) => c.letra === letra)) throw new ErrorFormulario(`Ya hay un contenedor ${letra} en esa balda`);
	const valores = { muebleId, nivel, letra, tipo, nombre: f.texto('nombre') ?? '', notas: f.texto('notas') };
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
