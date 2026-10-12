import * as s from '@novaz/core/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

// El QR de un contenedor apunta aquí (no a su mueble): aunque lo cambies de sitio, te lleva a donde esté ahora.
export const load = async ({ params, locals }) => {
	const c = await locals.db.select({ muebleId: s.contenedores.muebleId }).from(s.contenedores).where(eq(s.contenedores.id, Number(params.id))).get();
	if (!c) error(404, 'Ese contenedor ya no existe');
	redirect(307, `/inventario/mueble/${c.muebleId}?cont=${params.id}`);
};
