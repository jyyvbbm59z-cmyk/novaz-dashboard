import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, parent, url }) => {
	const { plano } = await parent();
	// Etiquetas viejas: el QR de un contenedor que ya está en otro mueble lleva a donde está ahora
	const cont = plano.contenedores.find((c) => c.id === Number(url.searchParams.get('cont')));
	if (cont && cont.muebleId !== Number(params.id)) redirect(307, `/inventario/mueble/${cont.muebleId}?cont=${cont.id}`);
	const mueble = plano.muebles.find((m) => m.id === Number(params.id));
	if (!mueble) error(404, 'Ese mueble ya no está en el plano');
	return { mueble };
};
