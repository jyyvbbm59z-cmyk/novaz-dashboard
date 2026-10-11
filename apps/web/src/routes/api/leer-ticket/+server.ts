import { error, json } from '@sveltejs/kit';
import { leerTicket } from '$lib/server/ia';

const MAX_BYTES = 4 * 1024 * 1024;

/** Lee una foto de ticket o factura y devuelve importe, fecha, comercio, IVA y, si es combustible, litros. */
export const POST = async ({ request, platform, locals }) => {
	const ai = platform?.env.AI;
	if (!ai) error(501, 'La lectura de tickets necesita Workers AI, que no está disponible en este entorno');
	const imagen = (await request.formData()).get('imagen');
	if (!(imagen instanceof File) || !imagen.type.startsWith('image/')) error(400, 'Falta la foto del ticket');
	if (imagen.size > MAX_BYTES) error(413, 'La foto es demasiado grande');

	let ticket;
	try {
		ticket = await leerTicket(ai, { mime: imagen.type, bytes: await imagen.arrayBuffer() }, locals.hoy);
	} catch (e) {
		console.error('Lectura de ticket:', (e as Error).message);
		error(502, 'No he podido leer el ticket. Prueba con otra foto o rellénalo a mano.');
	}
	if (ticket.importeCent == null && !ticket.fecha && !ticket.proveedor) error(422, 'No he encontrado datos en la foto. ¿Se ve bien el ticket?');
	return json(ticket);
};
