// El local por zonas: muebles en el plano y dónde está cada artículo.
import { huella, MUEBLES, siguienteCodigoMueble, zonaEnPunto } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { TIPOS_MUEBLE, type TipoMueble } from '@novaz/core/schema';
import { and, asc, eq, gt, inArray, ne } from 'drizzle-orm';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

export async function cargarPlano(db: Locals['db']) {
	const [zonas, muebles] = await Promise.all([
		db.select().from(s.zonas).orderBy(asc(s.zonas.orden), asc(s.zonas.codigo)),
		db.select().from(s.muebles).orderBy(asc(s.muebles.codigo))
	]);
	return { zonas, muebles };
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
		notas: f.texto('notas')
	};
	const zonaId = await zonaDelMueble(db, valores);
	if (id) {
		await db.update(s.muebles).set({ ...valores, zonaId }).where(eq(s.muebles.id, id));
		// Lo que estaba en una balda que ya no existe se queda en el mueble, sin balda
		await db.update(s.articulos).set({ nivel: null }).where(and(eq(s.articulos.muebleId, id), gt(s.articulos.nivel, valores.niveles)));
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
	await locals.db.update(s.articulos).set({ muebleId: null, nivel: null, zonaId: m.zonaId }).where(eq(s.articulos.muebleId, id));
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

/** Coloca artículos en un sitio: mueble y balda (o solo la zona). */
export async function ubicarArticulos(locals: Locals, ids: number[], sitio: { muebleId: number | null; nivel: number | null; zonaId?: number | null }) {
	if (!ids.length) return;
	let zonaId = sitio.zonaId ?? null;
	if (sitio.muebleId) {
		const m = await locals.db.select({ zonaId: s.muebles.zonaId, niveles: s.muebles.niveles }).from(s.muebles).where(eq(s.muebles.id, sitio.muebleId)).get();
		if (!m) throw new ErrorFormulario('Ese mueble ya no existe');
		if (sitio.nivel != null && (sitio.nivel < 1 || sitio.nivel > m.niveles)) throw new ErrorFormulario('Esa balda no existe');
		zonaId = m.zonaId;
	}
	await locals.db
		.update(s.articulos)
		.set({ muebleId: sitio.muebleId, nivel: sitio.muebleId ? sitio.nivel : null, zonaId })
		.where(inArray(s.articulos.id, ids));
}

/** Sitio enviado por un formulario: muebleId + nivel, o zonaId. */
export async function sitioDeFormulario(db: Locals['db'], fd: FormData) {
	const f = leer(fd);
	const muebleId = f.idOpcional('muebleId');
	if (muebleId) {
		const m = await db.select({ zonaId: s.muebles.zonaId, niveles: s.muebles.niveles }).from(s.muebles).where(eq(s.muebles.id, muebleId)).get();
		if (m) {
			const nivel = f.entero('nivel');
			return { muebleId, zonaId: m.zonaId, nivel: nivel && nivel >= 1 && nivel <= m.niveles ? nivel : null };
		}
	}
	return { muebleId: null, nivel: null, zonaId: f.idOpcional('zonaId') };
}
