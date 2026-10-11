import { error, json } from '@sveltejs/kit';
import { leerBalda } from '$lib/server/ia';

const MAX_BYTES = 4 * 1024 * 1024;

/** Foto de una balda → lista de objetos para revisar y dar de alta. */
export const POST = async ({ request, platform }) => {
	const ai = platform?.env.AI;
	if (!ai) error(501, 'Reconocer fotos necesita Workers AI, que no está disponible en este entorno. Usa «Lista escrita».');
	const imagen = (await request.formData()).get('imagen');
	if (!(imagen instanceof File) || !imagen.type.startsWith('image/')) error(400, 'Falta la foto');
	if (imagen.size > MAX_BYTES) error(413, 'La foto es demasiado grande');
	let objetos;
	try {
		objetos = await leerBalda(ai, { mime: imagen.type, bytes: await imagen.arrayBuffer() });
	} catch (e) {
		console.error('Leer balda:', (e as Error).message);
		error(502, 'No he podido mirar la foto. Prueba otra vez o escribe la lista.');
	}
	if (!objetos.length) error(422, 'No distingo nada en la foto. Haz la foto más cerca y con luz.');
	return json(objetos);
};
