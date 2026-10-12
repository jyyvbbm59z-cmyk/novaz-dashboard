import { datosInforme, mensajeInforme, NOMBRE_PERMISO, recortarInforme } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq, inArray } from 'drizzle-orm';
import { precioCombustibleHoy } from '$lib/server/combustible';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { enviarTelegram } from '$lib/server/telegram';

export const load = async ({ locals }) => {
	const yo = locals.yo!;
	const vehiculos = yo.vehiculos?.length ? await locals.db.select({ id: s.vehiculos.id, alias: s.vehiculos.alias }).from(s.vehiculos).where(inArray(s.vehiculos.id, yo.vehiculos)) : [];
	return { perfil: { nombre: yo.nombre, email: yo.email, telegramChatId: yo.telegramChatId, permisos: yo.permisos.map((p) => NOMBRE_PERMISO[p].nombre), todos: yo.vehiculos == null, vehiculos } };
};

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		if (!locals.yo?.id) throw new ErrorFormulario('En este entorno no hay usuarios');
		const f = leer(await request.formData());
		const chat = f.texto('telegramChatId')?.replace(/\s/g, '') || null;
		if (chat && !/^-?\d{4,20}$/.test(chat)) throw new ErrorFormulario('El chat de Telegram es un número (te lo da @userinfobot)');
		await locals.db.update(s.usuarios).set({ nombre: f.obligatorio('nombre', 'nombre'), telegramChatId: chat }).where(eq(s.usuarios.id, locals.yo.id));
		return { mensaje: 'Guardado' };
	}),
	probar: accion(async ({ locals, platform, url }) => {
		const token = platform?.env.TELEGRAM_TOKEN;
		const chat = locals.yo?.telegramChatId;
		if (!token) throw new ErrorFormulario('El bot no está configurado');
		if (!chat) throw new ErrorFormulario('Guarda primero tu chat de Telegram');
		const { ajustes, hoy, db } = locals;
		const datos = await datosInforme(db, { hoy, ajustes, precios: await precioCombustibleHoy(locals), nuevas: new Set(), app: url.origin, conObras: false });
		const alias = locals.yo!.vehiculos ? (await db.select({ id: s.vehiculos.id, alias: s.vehiculos.alias }).from(s.vehiculos)).filter((v) => locals.yo!.vehiculos!.includes(v.id)).map((v) => v.alias) : [];
		try {
			await enviarTelegram(token, chat, mensajeInforme(recortarInforme(datos, locals.permisos, locals.yo!.vehiculos ? { ids: locals.yo!.vehiculos, alias } : null)));
		} catch (e) {
			throw new ErrorFormulario(`Telegram: ${(e as Error).message}`);
		}
		return { mensaje: 'Mira Telegram' };
	})
};
