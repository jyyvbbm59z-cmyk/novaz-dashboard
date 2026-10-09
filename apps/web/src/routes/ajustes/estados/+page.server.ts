import * as s from '@novaz/core/schema';
import { eq } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const color = f.texto('color') ?? '#8a8f98';
		if (!/^#[0-9a-f]{6}$/i.test(color)) throw new ErrorFormulario('Color no válido');
		const v = { nombre: f.obligatorio('nombre', 'nombre'), color, final: f.bool('final'), orden: f.entero('orden') ?? 0 };
		if (id) await locals.db.update(s.estados).set(v).where(eq(s.estados.id, id));
		else await locals.db.insert(s.estados).values(v);
		return { mensaje: 'Estado guardado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		await locals.db.delete(s.estados).where(eq(s.estados.id, leer(await request.formData()).id('id')));
		return { mensaje: 'Estado borrado' };
	})
};
