// Workers AI: leer tickets, entender mensajes del bot y transcribir notas de voz.
import { ESQUEMA_INTENCION, ESQUEMA_TICKET, extraerJson, normalizarIntencion, normalizarTicket, PROMPT_TICKET, promptInterprete, type Intencion, type TicketLeido, type VehiculoBot } from '@novaz/core';

/** Modelo multimodal (visión + texto) con salida JSON. */
const MODELO = '@cf/meta/llama-4-scout-17b-16e-instruct';
const MODELO_VOZ = '@cf/openai/whisper-large-v3-turbo';

export function base64(buf: ArrayBuffer) {
	const bytes = new Uint8Array(buf);
	let bin = '';
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

const correr = (ai: Ai, modelo: string, entrada: unknown) => ai.run(modelo as Parameters<Ai['run']>[0], entrada as never) as Promise<{ response?: unknown; text?: string }>;

/** Lee una foto de ticket o factura: importe, fecha, comercio, IVA, líneas y, si es combustible, litros. */
export async function leerTicket(ai: Ai, imagen: { mime: string; bytes: ArrayBuffer }, hoy: string): Promise<TicketLeido> {
	const r = await correr(ai, MODELO, {
		messages: [
			{ role: 'system', content: PROMPT_TICKET },
			{
				role: 'user',
				content: [
					{ type: 'text', text: 'Lee este ticket y devuelve el JSON.' },
					{ type: 'image_url', image_url: { url: `data:${imagen.mime};base64,${base64(imagen.bytes)}` } }
				]
			}
		],
		response_format: { type: 'json_schema', json_schema: ESQUEMA_TICKET },
		max_tokens: 1500,
		temperature: 0
	});
	return normalizarTicket(r?.response, hoy);
}

/** Lo que quiere decir un mensaje del bot, según la IA. */
export async function interpretarConIa(ai: Ai, texto: string, vehiculos: VehiculoBot[], hoy: string): Promise<Intencion> {
	const r = await correr(ai, MODELO, {
		messages: [
			{ role: 'system', content: promptInterprete(vehiculos, hoy) },
			{ role: 'user', content: texto }
		],
		response_format: { type: 'json_schema', json_schema: ESQUEMA_INTENCION },
		max_tokens: 600,
		temperature: 0
	});
	return normalizarIntencion(extraerJson(r?.response), vehiculos, texto);
}

/** Nota de voz (ogg/opus de Telegram) → texto. */
export async function transcribir(ai: Ai, audio: ArrayBuffer): Promise<string> {
	const r = await correr(ai, MODELO_VOZ, { audio: base64(audio), language: 'es', task: 'transcribe' });
	return String(r?.text ?? '').trim();
}
