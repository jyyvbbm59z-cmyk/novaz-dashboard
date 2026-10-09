// Envío de mensajes por el bot de Telegram (HTML simple).
export async function enviarTelegram(token: string, chatId: string, texto: string) {
	const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML', disable_web_page_preview: true })
	});
	const j = (await r.json().catch(() => ({}))) as { ok?: boolean; description?: string };
	if (!r.ok || !j.ok) throw new Error(j.description ?? `Telegram respondió ${r.status}`);
}
