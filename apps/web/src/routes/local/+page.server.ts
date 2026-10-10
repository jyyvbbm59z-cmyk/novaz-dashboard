import { ordenarTareasLocal, siguienteTareaLocal } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { PRIORIDADES, type Prioridad } from '@novaz/core/schema';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { borrarMovimiento, guardarMovimiento } from '$lib/server/acciones';
import { adjuntosDe, borrarAdjuntos, borrarAdjuntosDe } from '$lib/server/adjuntos';
import { accion, leer } from '$lib/server/form';

export const load = async ({ locals }) => {
	const { db, hoy } = locals;
	const [tareas, gastos] = await Promise.all([
		db.select().from(s.tareasLocal).orderBy(desc(s.tareasLocal.creado)),
		db.select().from(s.movimientos).where(isNotNull(s.movimientos.tareaLocalId))
	]);
	const abiertas = ordenarTareasLocal(tareas.filter((t) => t.estado === 'pendiente' || t.estado === 'en_curso'), hoy);
	const cerradas = tareas.filter((t) => t.estado === 'hecha' || t.estado === 'descartada').sort((a, b) => (b.fechaHecha ?? '').localeCompare(a.fechaHecha ?? ''));
	const gastosDe: Record<number, typeof gastos> = {};
	for (const g of gastos) (gastosDe[g.tareaLocalId!] ??= []).push(g);
	return {
		abiertas,
		cerradas,
		gastosDe,
		fotos: await adjuntosDe(db, 'local', tareas.map((t) => t.id)),
		zonas: [...new Set(tareas.map((t) => t.zona).filter((z): z is string => Boolean(z)))].sort(),
		gastoAnio: gastos.filter((g) => g.fecha.startsWith(hoy.slice(0, 4))).reduce((t, g) => t + g.importeCent, 0)
	};
};

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const prioridad = f.texto('prioridad') as Prioridad;
		const pasos = (f.texto('pasos') ?? '')
			.split('\n')
			.map((t) => t.replace(/^[-*•]\s*/, '').trim())
			.filter(Boolean);
		const previos = id ? ((await locals.db.select({ pasos: s.tareasLocal.pasos }).from(s.tareasLocal).where(eq(s.tareasLocal.id, id)).get())?.pasos ?? []) : [];
		const valores = {
			titulo: f.obligatorio('titulo', 'qué hay que hacer'),
			detalle: f.texto('detalle'),
			zona: f.texto('zona'),
			prioridad: PRIORIDADES.includes(prioridad) ? prioridad : 'media',
			fechaLimite: f.fecha('fechaLimite'),
			cadaMeses: f.entero('cadaMeses'),
			// Conserva lo ya tachado de los pasos que siguen igual
			pasos: pasos.map((texto) => ({ texto, hecho: previos.find((p) => p.texto === texto)?.hecho ?? false }))
		};
		if (id) {
			await locals.db.update(s.tareasLocal).set(valores).where(eq(s.tareasLocal.id, id));
			return { mensaje: 'Guardado', tareaId: id };
		}
		const [t] = await locals.db.insert(s.tareasLocal).values(valores).returning({ id: s.tareasLocal.id });
		return { mensaje: 'Apuntada', tareaId: t.id };
	}),

	paso: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.id('id');
		const i = f.entero('indice') ?? -1;
		const t = await locals.db.select().from(s.tareasLocal).where(eq(s.tareasLocal.id, id)).get();
		if (!t || !t.pasos[i]) return {};
		const pasos = t.pasos.map((p, j) => (j === i ? { ...p, hecho: f.bool('hecho') } : p));
		await locals.db.update(s.tareasLocal).set({ pasos, estado: t.estado === 'pendiente' ? 'en_curso' : t.estado }).where(eq(s.tareasLocal.id, id));
		return { momento: f.bool('hecho') ? 'tareaHecha' : undefined };
	}),

	estado: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.id('id');
		const estado = f.texto('estado');
		const t = await locals.db.select().from(s.tareasLocal).where(eq(s.tareasLocal.id, id)).get();
		if (!t || !['pendiente', 'en_curso', 'hecha', 'descartada'].includes(estado ?? '')) return {};
		const hecha = estado === 'hecha';
		await locals.db
			.update(s.tareasLocal)
			.set({ estado: estado as 'pendiente', fechaHecha: hecha || estado === 'descartada' ? locals.hoy : null })
			.where(eq(s.tareasLocal.id, id));
		// Si se repite, se crea la siguiente
		if (hecha && t.cadaMeses) {
			await locals.db.insert(s.tareasLocal).values({
				titulo: t.titulo,
				detalle: t.detalle,
				zona: t.zona,
				prioridad: t.prioridad,
				cadaMeses: t.cadaMeses,
				fechaLimite: siguienteTareaLocal(locals.hoy, t.cadaMeses),
				pasos: t.pasos.map((p) => ({ ...p, hecho: false }))
			});
		}
		return hecha
			? { mensaje: t.cadaMeses ? `¡Hecha! La siguiente, dentro de ${t.cadaMeses} meses` : '¡Hecha!', momento: 'faseCompletada' }
			: { mensaje: 'Actualizada' };
	}),

	gasto: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const tareaId = leer(fd).id('tareaId');
		const movId = await guardarMovimiento(locals, fd, { vehiculoId: null });
		await locals.db.update(s.movimientos).set({ tareaLocalId: tareaId }).where(eq(s.movimientos.id, movId));
		return { mensaje: 'Gasto apuntado' };
	}),

	borrarGasto: accion(async ({ request, locals, platform }) => {
		await borrarMovimiento(locals, leer(await request.formData()).id('id'), platform!.env.ARCHIVOS);
		return { mensaje: 'Gasto borrado' };
	}),

	borrar: accion(async ({ request, locals, platform }) => {
		const id = leer(await request.formData()).id('id');
		await borrarAdjuntosDe(locals.db, platform!.env.ARCHIVOS, 'local', id);
		await locals.db.update(s.movimientos).set({ tareaLocalId: null }).where(eq(s.movimientos.tareaLocalId, id));
		await locals.db.delete(s.tareasLocal).where(eq(s.tareasLocal.id, id));
		return { mensaje: 'Tarea borrada' };
	}),

	borrarAdjunto: accion(async ({ request, locals, platform }) => {
		await borrarAdjuntos(locals.db, platform!.env.ARCHIVOS, [leer(await request.formData()).id('id')]);
		return { mensaje: 'Archivo borrado' };
	})
};
