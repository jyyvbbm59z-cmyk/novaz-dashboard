import type { FasePlantilla } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

/** Formato de texto: una fase por línea; las tareas debajo empiezan por "-". */
function parsear(texto: string): FasePlantilla[] {
	const fases: FasePlantilla[] = [];
	for (const linea of texto.split('\n')) {
		const l = linea.trim();
		if (!l) continue;
		if (/^[-*•]/.test(l)) {
			if (!fases.length) fases.push({ nombre: 'General', tareas: [] });
			fases[fases.length - 1].tareas.push(l.replace(/^[-*•]\s*/, ''));
		} else fases.push({ nombre: l, tareas: [] });
	}
	return fases;
}

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const fases = parsear(f.texto('fases') ?? '');
		if (!fases.length) throw new ErrorFormulario('Añade al menos una fase');
		const v = { nombre: f.obligatorio('nombre', 'nombre'), fases };
		if (id) await locals.db.update(s.plantillasFases).set(v).where(eq(s.plantillasFases.id, id));
		else await locals.db.insert(s.plantillasFases).values(v);
		return { mensaje: 'Plantilla guardada' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.plantillasFases).where(eq(s.plantillasFases.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Plantilla borrada' };
	})
};
