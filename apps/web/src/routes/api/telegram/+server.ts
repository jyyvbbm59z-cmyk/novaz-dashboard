// Webhook del bot de Telegram. Llega aquí sin Cloudflare Access (la ruta tiene Bypass) y se autentica con el
// secreto del webhook (hooks.server.ts) y el chat ID guardado en Ajustes: solo responde a tu chat.
import { dev } from '$app/environment';
import {
	faltanDatos,
	interpretarReglas,
	NECESITA_VEHICULO,
	notasTicket,
	numeroES,
	buscarVehiculo,
	TEXTO_AYUDA,
	vehiculosActivos,
	type Intencion,
	type VehiculoBot
} from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, eq } from 'drizzle-orm';
import { deshacer, ejecutarOrden, prepararOrden, responderConsulta, textoOrden, vehiculosBot, type EnvBot, type Orden } from '$lib/server/bot';
import { interpretarConIa, leerTicket, transcribir } from '$lib/server/ia';
import { descargarTelegram, llamarTelegram } from '$lib/server/telegram';

interface Mensaje {
	message_id: number;
	chat: { id: number };
	text?: string;
	caption?: string;
	photo?: { file_id: string; file_size?: number }[];
	document?: { file_id: string; mime_type?: string };
	voice?: { file_id: string; duration?: number };
	audio?: { file_id: string; duration?: number };
}
interface Update {
	update_id: number;
	message?: Mensaje;
	callback_query?: { id: string; data?: string; message?: Mensaje };
}
type Boton = { text: string; callback_data?: string; url?: string };

export const POST = async ({ request, locals, platform, url }) => {
	const env = platform?.env;
	if (!env?.TELEGRAM_TOKEN) return new Response('Sin bot', { status: 503 });
	const update = (await request.json().catch(() => null)) as Update | null;
	if (!update) return new Response('ok');
	const trabajo = new Bot(locals, { ...env, ARCHIVOS: env.ARCHIVOS }, env.AI, url.origin).atender(update).catch((e) => console.error('Bot:', e));
	// Telegram reintenta si tardamos: se contesta ya y se trabaja después
	if (!dev && platform?.ctx) platform.ctx.waitUntil(trabajo);
	else await trabajo;
	return new Response('ok');
};

class Bot {
	constructor(
		private locals: App.Locals,
		private env: EnvBot,
		private ai: Ai | undefined,
		private app: string
	) {}

	private tg = <T = unknown>(metodo: string, cuerpo: Record<string, unknown>) => llamarTelegram<T>(this.env, metodo, cuerpo);

	private enviar(chat: number, texto: string, teclado?: Boton[][]) {
		return this.tg<{ message_id: number }>('sendMessage', {
			chat_id: chat,
			text: texto,
			parse_mode: 'HTML',
			disable_web_page_preview: true,
			...(teclado ? { reply_markup: { inline_keyboard: teclado } } : {})
		});
	}

	private async editar(m: Mensaje, texto: string, teclado: Boton[][] = []) {
		try {
			await this.tg('editMessageText', { chat_id: m.chat.id, message_id: m.message_id, text: texto, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: { inline_keyboard: teclado } });
		} catch (e) {
			// Pulsar dos veces deja el mensaje igual: no es un error
			if (!/not modified/i.test((e as Error).message)) throw e;
		}
	}

	async atender(u: Update) {
		const chat = u.message?.chat.id ?? u.callback_query?.message?.chat.id;
		// Solo tu chat (el de Ajustes); a cualquier otro, silencio
		if (chat == null || String(chat) !== this.locals.ajustes.telegramChatId) return;
		if (u.callback_query) return this.boton(u.callback_query);
		const m = u.message!;
		try {
			if (m.photo?.length || m.document?.mime_type?.startsWith('image/')) return await this.foto(m);
			if (m.voice || m.audio) return await this.voz(m);
			if (m.text) return await this.texto(m.chat.id, m.text);
		} catch (e) {
			console.error('Bot:', e);
			await this.enviar(m.chat.id, `No he podido con eso: ${(e as Error).message}`);
		}
	}

	private async entender(texto: string, vehiculos: VehiculoBot[]): Promise<Intencion> {
		const reglas = interpretarReglas(texto, vehiculos);
		if (texto.trim().startsWith('/') || !this.ai || (reglas.tipo === 'consulta' && reglas.tema === 'donde')) return reglas;
		try {
			const i = await interpretarConIa(this.ai, texto, vehiculos, this.locals.hoy);
			if (i.tipo !== 'desconocido') return i;
		} catch (e) {
			console.error('Bot IA:', (e as Error).message);
		}
		return reglas;
	}

	private async texto(chat: number, texto: string, voz?: string) {
		const vehiculos = await vehiculosBot(this.locals.db);
		const i = await this.entender(texto, vehiculos);
		const prefijo = voz ? `🎙 <i>«${voz.replace(/</g, '&lt;')}»</i>\n\n` : '';
		if (i.tipo === 'ayuda') return this.enviar(chat, TEXTO_AYUDA);
		if (i.tipo === 'consulta') return this.enviar(chat, prefijo + (await responderConsulta(this.locals, i, this.app)));
		if (i.tipo === 'desconocido')
			return this.enviar(chat, `${prefijo}No sé qué apuntar con eso. Prueba con algo como <i>«Repostaje Ibiza 40 L 72 € 117.200 km»</i> o <i>«Comprar lija de 400»</i>.\n/ayuda para ver todo lo que entiendo.`);
		return this.proponer(chat, { i, voz: voz ?? null }, vehiculos);
	}

	private async voz(m: Mensaje) {
		if (!this.ai) return this.enviar(m.chat.id, 'Las notas de voz necesitan Workers AI, que no está disponible aquí.');
		const { bytes } = await descargarTelegram(this.env, (m.voice ?? m.audio)!.file_id);
		const texto = await transcribir(this.ai, bytes);
		if (!texto) return this.enviar(m.chat.id, 'No te he entendido en el audio. ¿Me lo repites?');
		return this.texto(m.chat.id, texto, texto);
	}

	private async foto(m: Mensaje) {
		if (!this.ai) return this.enviar(m.chat.id, 'Leer tickets necesita Workers AI, que no está disponible aquí.');
		const fileId = m.photo?.length ? m.photo[m.photo.length - 1].file_id : m.document!.file_id;
		const { bytes, ruta } = await descargarTelegram(this.env, fileId);
		const mime = ruta.endsWith('.png') ? 'image/png' : ruta.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
		const t = await leerTicket(this.ai, { mime, bytes }, this.locals.hoy);
		if (!t.importeCent) return this.enviar(m.chat.id, 'No veo el total en la foto. ¿Se lee bien el ticket? Prueba con otra más cerca.');

		const pie = m.caption ?? '';
		const vehiculos = await vehiculosBot(this.locals.db);
		const local = /\b(local|taller|nave)\b/i.test(pie);
		const vehiculoId = local ? null : buscarVehiculo(pie, vehiculos);
		const km = numeroES(pie.match(/(\d{1,3}(?:\.\d{3})+|\d{3,7})\s*km\b/i)?.[1]);
		const i: Intencion =
			t.combustible && t.litros
				? { tipo: 'repostaje', vehiculoId, litros: t.litros, importeCent: t.importeCent, km: km ? Math.round(km) : null, gasolinera: t.proveedor, lleno: !/\b(parcial|medio)\b/i.test(pie) }
				: { tipo: 'gasto', vehiculoId, importeCent: t.importeCent, concepto: t.concepto ?? t.proveedor ?? 'Compra', proveedor: t.proveedor, categoria: pie.replace(/\d[\d.,]*\s*km/i, '').trim() || null, local };
		return this.proponer(m.chat.id, { i, foto: fileId, fecha: t.fecha, notas: notasTicket(t) || null, ivaPct: t.ivaPct }, vehiculos);
	}

	/** Enseña lo entendido y espera tu OK (o que elijas el vehículo). */
	private async proponer(chat: number, orden: Orden, vehiculos: VehiculoBot[]) {
		const o = await prepararOrden(this.locals, orden);
		const texto = textoOrden(o, vehiculos);
		const falta = faltanDatos(o.i);
		if (falta.length) return this.enviar(chat, `${texto}\n\nMe falta ${falta.join(' y ')}. Escríbemelo otra vez con todo.`);
		const [a] = await this.locals.db.insert(s.botAcciones).values({ orden: o as unknown as Record<string, unknown> }).returning({ id: s.botAcciones.id });
		if (NECESITA_VEHICULO.has(o.i.tipo) && !('vehiculoId' in o.i && o.i.vehiculoId))
			return this.enviar(chat, `${texto}\n\n<b>¿De qué vehículo?</b>`, await this.tecladoVehiculos(a.id));
		return this.enviar(chat, texto, confirmar(a.id));
	}

	private async tecladoVehiculos(accionId: number): Promise<Boton[][]> {
		const activos = await vehiculosActivos(this.locals.db);
		const botones = activos.map((v) => ({ text: v.alias, callback_data: `v:${accionId}:${v.id}` }));
		const filas: Boton[][] = [];
		for (let k = 0; k < botones.length; k += 3) filas.push(botones.slice(k, k + 3));
		return [...filas, [{ text: '✗ Cancelar', callback_data: `no:${accionId}` }]];
	}

	private async boton(q: NonNullable<Update['callback_query']>) {
		const [cmd, idTxt, extra] = (q.data ?? '').split(':');
		const id = Number(idTxt);
		const m = q.message;
		const { db } = this.locals;
		const responder = (texto?: string, alerta = false) => this.tg('answerCallbackQuery', { callback_query_id: q.id, ...(texto ? { text: texto, show_alert: alerta } : {}) });
		const a = Number.isInteger(id) ? await db.select().from(s.botAcciones).where(eq(s.botAcciones.id, id)).get() : undefined;
		if (!a || !m) return responder('Esto ya no existe');
		let orden = a.orden as unknown as Orden;
		const vehiculos = await vehiculosBot(db);
		const cuerpo = () => textoOrden(orden, vehiculos);
		const marcar = async (de: s.EstadoBot, a_: s.EstadoBot) =>
			(await db.update(s.botAcciones).set({ estado: a_ }).where(and(eq(s.botAcciones.id, id), eq(s.botAcciones.estado, de))).returning({ id: s.botAcciones.id })).length > 0;

		try {
			if (cmd === 'v') {
				if (a.estado !== 'esperando') return responder('Ya está decidido');
				orden = await prepararOrden(this.locals, { ...orden, i: { ...orden.i, vehiculoId: Number(extra) } as Intencion });
				await db.update(s.botAcciones).set({ orden: orden as unknown as Record<string, unknown> }).where(eq(s.botAcciones.id, id));
				await this.editar(m, cuerpo(), confirmar(id));
				return responder();
			}
			if (cmd === 'no') {
				if (!(await marcar('esperando', 'cancelada'))) return responder('Ya está decidido');
				await this.editar(m, `${cuerpo()}\n\n✗ <i>Cancelado</i>`);
				return responder('Cancelado');
			}
			if (cmd === 'ok') {
				if (!(await marcar('esperando', 'hecha'))) return responder(a.estado === 'cancelada' ? 'Lo cancelaste: escríbemelo otra vez' : 'Ya estaba apuntado');
				let r;
				try {
					r = await ejecutarOrden(this.locals, this.env, orden);
				} catch (e) {
					await marcar('hecha', 'esperando');
					await this.editar(m, `${cuerpo()}\n\n⚠️ ${(e as Error).message}`, confirmar(id));
					return responder((e as Error).message, true);
				}
				await db.update(s.botAcciones).set({ hecho: r.hecho }).where(eq(s.botAcciones.id, id));
				const teclado: Boton[] = [{ text: '↩︎ Deshacer', callback_data: `d:${id}` }];
				if (this.app.startsWith('https://')) teclado.push({ text: 'Ver en la app', url: `${this.app}${r.href}` });
				await this.editar(m, `${cuerpo()}\n\n✅ <b>Apuntado</b>`, [teclado]);
				return responder('Apuntado');
			}
			if (cmd === 'd') {
				if (!(await marcar('hecha', 'deshecha'))) return responder('Ya estaba deshecho');
				try {
					await deshacer(this.locals, this.env, a.hecho);
				} catch (e) {
					await marcar('deshecha', 'hecha');
					return responder(`No he podido deshacerlo: ${(e as Error).message}`, true);
				}
				await this.editar(m, `${cuerpo()}\n\n↩︎ <i>Deshecho: no queda nada apuntado</i>`);
				return responder('Deshecho');
			}
			return responder();
		} catch (e) {
			console.error('Bot botón:', e);
			return responder(`Error: ${(e as Error).message}`, true);
		}
	}
}

const confirmar = (id: number): Boton[][] => [[{ text: '✓ Apuntar', callback_data: `ok:${id}` }, { text: '✗ Cancelar', callback_data: `no:${id}` }]];
