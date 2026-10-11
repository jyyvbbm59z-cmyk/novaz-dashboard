// Bot de Telegram: envío de mensajes (HTML simple) y llamadas a la API.

type Env = { TELEGRAM_TOKEN?: string; TELEGRAM_API?: string };
/** En pruebas locales, TELEGRAM_API apunta a un simulador. */
const base = (env: Env) => env.TELEGRAM_API ?? 'https://api.telegram.org';

export async function llamarTelegram<T = unknown>(env: Env, metodo: string, cuerpo: Record<string, unknown> = {}): Promise<T> {
	if (!env.TELEGRAM_TOKEN) throw new Error('Falta TELEGRAM_TOKEN');
	const r = await fetch(`${base(env)}/bot${env.TELEGRAM_TOKEN}/${metodo}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(cuerpo),
		signal: AbortSignal.timeout(10_000)
	});
	const j = (await r.json().catch(() => ({}))) as { ok?: boolean; description?: string; result?: T };
	if (!r.ok || !j.ok) throw new Error(j.description ?? `Telegram respondió ${r.status}`);
	return j.result as T;
}

export async function enviarTelegram(token: string, chatId: string, texto: string) {
	await llamarTelegram({ TELEGRAM_TOKEN: token }, 'sendMessage', { chat_id: chatId, text: texto, parse_mode: 'HTML', disable_web_page_preview: true });
}

/** Descarga un archivo que te han mandado (foto, nota de voz). */
export async function descargarTelegram(env: Env, fileId: string): Promise<{ bytes: ArrayBuffer; ruta: string }> {
	const f = await llamarTelegram<{ file_path?: string }>(env, 'getFile', { file_id: fileId });
	if (!f.file_path) throw new Error('Telegram no da el archivo');
	const r = await fetch(`${base(env)}/file/bot${env.TELEGRAM_TOKEN}/${f.file_path}`, { signal: AbortSignal.timeout(15_000) });
	if (!r.ok) throw new Error(`No se pudo descargar el archivo (${r.status})`);
	return { bytes: await r.arrayBuffer(), ruta: f.file_path };
}

/** Secreto del webhook: Telegram lo manda en cada llamada y así sabemos que es él (sale del token, no hay que guardarlo). */
export async function secretoWebhook(token: string) {
	const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`novaz-webhook:${token}`));
	return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
