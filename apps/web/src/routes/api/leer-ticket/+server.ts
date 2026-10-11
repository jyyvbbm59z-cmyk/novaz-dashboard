import { ESQUEMA_TICKET, normalizarTicket, PROMPT_TICKET } from '@novaz/core';
import { error, json } from '@sveltejs/kit';

/** Modelo de visión de Workers AI que lee el ticket. */
const MODELO = '@cf/meta/llama-4-scout-17b-16e-instruct';
const MAX_BYTES = 4 * 1024 * 1024;

function base64(buf: ArrayBuffer) {
	const bytes = new Uint8Array(buf);
	let bin = '';
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

/** Lee una foto de ticket o factura y devuelve importe, fecha, comercio, IVA y, si es combustible, litros. */
export const POST = async ({ request, platform, locals }) => {
	const ai = platform?.env.AI;
	if (!ai) error(501, 'La lectura de tickets necesita Workers AI, que no está disponible en este entorno');
	const imagen = (await request.formData()).get('imagen');
	if (!(imagen instanceof File) || !imagen.type.startsWith('image/')) error(400, 'Falta la foto del ticket');
	if (imagen.size > MAX_BYTES) error(413, 'La foto es demasiado grande');

	let respuesta: unknown;
	try {
		const r = (await ai.run(MODELO as Parameters<Ai['run']>[0], {
			messages: [
				{ role: 'system', content: PROMPT_TICKET },
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Lee este ticket y devuelve el JSON.' },
						{ type: 'image_url', image_url: { url: `data:${imagen.type};base64,${base64(await imagen.arrayBuffer())}` } }
					]
				}
			],
			response_format: { type: 'json_schema', json_schema: ESQUEMA_TICKET },
			max_tokens: 1500,
			temperature: 0
		} as never)) as { response?: unknown };
		respuesta = r?.response;
	} catch (e) {
		console.error('Lectura de ticket:', (e as Error).message);
		error(502, 'No he podido leer el ticket. Prueba con otra foto o rellénalo a mano.');
	}
	const ticket = normalizarTicket(respuesta, locals.hoy);
	if (ticket.importeCent == null && !ticket.fecha && !ticket.proveedor) error(422, 'No he encontrado datos en la foto. ¿Se ve bien el ticket?');
	return json(ticket);
};
