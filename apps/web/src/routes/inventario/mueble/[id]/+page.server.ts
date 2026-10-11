import { error } from '@sveltejs/kit';

export const load = async ({ params, parent }) => {
	const { plano } = await parent();
	const mueble = plano.muebles.find((m) => m.id === Number(params.id));
	if (!mueble) error(404, 'Ese mueble ya no está en el plano');
	return { mueble };
};
