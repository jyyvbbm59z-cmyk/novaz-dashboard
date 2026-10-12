import { datosInforme, mensajeInforme, NOMBRE_PERMISO, recortarInforme } from '@novaz/core';
import * as s from '@novaz/core/schema';
import type { PreferenciasUsuario } from '@novaz/core/schema';
import { eq, inArray } from 'drizzle-orm';
import { precioCombustibleHoy } from '$lib/server/combustible';
import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { enviarTelegram } from '$lib/server/telegram';

export const load = async ({ locals }) => {
	const yo = locals.yo!;
	const suyos = yo.id ? await locals.db.select({ id: s.vehiculos.id, alias: s.vehiculos.alias }).from(s.vehiculos).where(eq(s.vehiculos.usuarioId, yo.id)) : [];
	const { tema, acento, parteDiario, resumenSemanal } = locals.ajustes;
	return {
		perfil: { nombre: yo.nombre, email: yo.email, telegramChatId: yo.telegramChatId, permisos: yo.permisos.map((p) => NOMBRE_PERMISO[p].nombre), suyos, hayUsuarios: !!yo.id },
		preferencias: yo.preferencias,
		/** Lo del taller, para «como el taller». */
		taller: { tema, acento, avisos: parteDiario ? ('parte' as const) : ('umbrales' as const), resumenSemanal }
	};
};

const HEX = /^#[0-9a-f]{6}$/i;

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		if (!locals.yo?.id) throw new ErrorFormulario('En este entorno no hay usuarios');
		const f = leer(await request.formData());
		const chat = f.texto('telegramChatId')?.replace(/\s/g, '') || null;
		if (chat && !/^-?\d{4,20}$/.test(chat)) throw new ErrorFormulario('El chat de Telegram es un número (te lo da @userinfobot)');
		await locals.db.update(s.usuarios).set({ nombre: f.obligatorio('nombre', 'nombre'), telegramChatId: chat }).where(eq(s.usuarios.id, locals.yo.id));
		return { mensaje: 'Guardado' };
	}),
	/** Su apariencia y sus avisos (vacío = como el taller). */
	preferencias: accion(async ({ request, locals }) => {
		if (!locals.yo?.id) throw new ErrorFormulario('En este entorno no hay usuarios');
		const f = leer(await request.formData());
		const tema = f.texto('tema');
		const acento = f.texto('acento');
		const avisos = f.texto('avisos');
		if (acento && !HEX.test(acento)) throw new ErrorFormulario('Color no válido');
		const p: PreferenciasUsuario = {
			tema: tema === 'oscuro' || tema === 'claro' || tema === 'sistema' ? tema : undefined,
			acento: acento || undefined,
			avisos: avisos === 'parte' || avisos === 'umbrales' || avisos === 'ninguno' ? avisos : undefined,
			resumenSemanal: f.bool('resumenSemanal')
		};
		await locals.db.update(s.usuarios).set({ preferencias: JSON.parse(JSON.stringify(p)) }).where(eq(s.usuarios.id, locals.yo.id));
		return { mensaje: 'Guardado' };
	}),
	probar: accion(async ({ locals, platform, url }) => {
		const token = platform?.env.TELEGRAM_TOKEN;
		const chat = locals.yo?.telegramChatId;
		if (!token) throw new ErrorFormulario('El bot no está configurado');
		if (!chat) throw new ErrorFormulario('Guarda primero tu chat de Telegram');
		const { ajustes, hoy, db } = locals;
		const datos = await datosInforme(db, { hoy, ajustes, precios: await precioCombustibleHoy(locals), nuevas: new Set(), app: url.origin, conObras: false });
		const ids = locals.yo!.vehiculos;
		const alias = ids ? (await db.select({ alias: s.vehiculos.alias }).from(s.vehiculos).where(inArray(s.vehiculos.id, ids))).map((v) => v.alias) : [];
		try {
			await enviarTelegram(token, chat, mensajeInforme(recortarInforme(datos, locals.permisos, ids ? { ids, alias } : null)));
		} catch (e) {
			throw new ErrorFormulario(`Telegram: ${(e as Error).message}`);
		}
		return { mensaje: 'Mira Telegram' };
	})
};
