// La libreta de gastos de quien tiene sus propios vehículos en la app (aparte de la contabilidad del taller).
import { categoriaSimple } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { CATEGORIAS_GASTO_SIMPLE, type CategoriaGastoSimple } from '@novaz/core/schema';
import { and, eq } from 'drizzle-orm';
import { registrarKm } from './datos';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

/** ¿Es el dueño del vehículo (y por tanto lleva su libreta)? */
export async function esDueno(locals: Locals, vehiculoId: number) {
	if (!locals.yo?.id) return false;
	const v = await locals.db.select({ u: s.vehiculos.usuarioId }).from(s.vehiculos).where(eq(s.vehiculos.id, vehiculoId)).get();
	return v?.u === locals.yo.id;
}

export interface GastoSimple {
	fecha?: string | null;
	concepto: string;
	categoria?: string | null;
	importeCent: number;
	km?: number | null;
	litros?: number | null;
	entradaId?: number | null;
	notas?: string | null;
}

export async function apuntarGastoSimple(locals: Locals, vehiculoId: number, g: GastoSimple, id?: number | null) {
	if (!(await esDueno(locals, vehiculoId))) throw new ErrorFormulario('La libreta de gastos es del dueño del vehículo');
	if (!g.importeCent || g.importeCent <= 0) throw new ErrorFormulario('Indica cuánto costó');
	const categoria = (CATEGORIAS_GASTO_SIMPLE.includes(g.categoria as CategoriaGastoSimple) ? g.categoria : categoriaSimple(g.concepto)) as CategoriaGastoSimple;
	const valores = {
		vehiculoId,
		usuarioId: locals.yo!.id,
		fecha: g.fecha ?? locals.hoy,
		concepto: g.concepto.trim() || 'Gasto',
		categoria,
		importeCent: g.importeCent,
		km: g.km ?? null,
		litros: g.litros ?? null,
		entradaId: g.entradaId ?? null,
		notas: g.notas ?? null
	};
	let gid = id ?? null;
	if (gid) await locals.db.update(s.gastosPersonales).set(valores).where(and(eq(s.gastosPersonales.id, gid), eq(s.gastosPersonales.usuarioId, locals.yo!.id)));
	else gid = (await locals.db.insert(s.gastosPersonales).values(valores).returning({ id: s.gastosPersonales.id }))[0].id;
	if (valores.km) await registrarKm(locals.db, vehiculoId, valores.fecha, valores.km);
	return gid;
}

export async function guardarGastoSimple(locals: Locals, vehiculoId: number, fd: FormData) {
	const f = leer(fd);
	return apuntarGastoSimple(
		locals,
		vehiculoId,
		{ fecha: f.fecha('fecha'), concepto: f.obligatorio('concepto', 'qué es'), categoria: f.texto('categoria'), importeCent: f.euros('importe') ?? 0, km: f.entero('km'), litros: f.decimal('litros'), notas: f.texto('notas') },
		f.idOpcional('id')
	);
}

export async function borrarGastoSimple(locals: Locals, id: number) {
	if (!locals.yo?.id) return;
	await locals.db.delete(s.gastosPersonales).where(and(eq(s.gastosPersonales.id, id), eq(s.gastosPersonales.usuarioId, locals.yo.id)));
}
