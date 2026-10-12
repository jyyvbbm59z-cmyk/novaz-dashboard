// Quién es quién: el email que da Cloudflare Access → su ficha de usuario y sus permisos.
import { normalizarPermisos, PERMISOS, type Ajustes, type Permiso } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { eq, sql } from 'drizzle-orm';

type DB = App.Locals['db'];

export interface Yo {
	id: number;
	email: string;
	nombre: string;
	permisos: Permiso[];
	telegramChatId: string | null;
	/** Vehículos que puede ver: null = todos; si no, solo estos (los suyos). */
	vehiculos: number[] | null;
}

async function comoYo(db: DB, u: s.Usuario): Promise<Yo> {
	const vehiculos = u.alcance === 'suyos' ? (await db.select({ id: s.vehiculos.id }).from(s.vehiculos).where(eq(s.vehiculos.usuarioId, u.id))).map((v) => v.id) : null;
	return { id: u.id, email: u.email, nombre: u.nombre, permisos: normalizarPermisos(u.permisos), telegramChatId: u.telegramChatId, vehiculos };
}

/** ¿Puede ver este vehículo? */
export const veVehiculo = (yo: Pick<Yo, 'vehiculos'> | null, vehiculoId: number) => !yo || yo.vehiculos == null || yo.vehiculos.includes(vehiculoId);

/**
 * El usuario de un email. Si aún no hay ninguno, el primero que entra es el administrador (con todo) y se queda
 * con el chat de Telegram que hubiera en Ajustes. Si ya hay usuarios y este no está, no entra.
 */
export async function identificar(db: DB, email: string, ajustes: Ajustes): Promise<Yo | null> {
	const correo = email.trim().toLowerCase();
	const u = await db.select().from(s.usuarios).where(eq(s.usuarios.email, correo)).get();
	if (u) return u.activo ? comoYo(db, u) : null;
	const hay = await db.select({ n: sql<number>`count(*)` }).from(s.usuarios).get();
	if (hay?.n) return null;
	const [nuevo] = await db
		.insert(s.usuarios)
		.values({ email: correo, nombre: correo.split('@')[0], permisos: [...PERMISOS], telegramChatId: ajustes.telegramChatId || null })
		.onConflictDoNothing()
		.returning();
	return nuevo ? comoYo(db, nuevo) : identificar(db, email, ajustes);
}

/** En desarrollo, sin Access: administrador de mentira (o el usuario que diga USUARIO_DEV, para probar permisos). */
export const yoLocal = (ajustes: Ajustes): Yo => ({ id: 0, email: 'local', nombre: 'Local', permisos: [...PERMISOS], telegramChatId: ajustes.telegramChatId || null, vehiculos: null });

/** El usuario dueño de un chat de Telegram (el bot solo hace caso a usuarios dados de alta). */
export async function usuarioDeChat(db: DB, chatId: string, ajustes: Ajustes): Promise<Yo | null> {
	const u = await db.select().from(s.usuarios).where(eq(s.usuarios.telegramChatId, chatId)).get();
	if (u) return u.activo ? comoYo(db, u) : null;
	// Antes de dar de alta a nadie, el chat de Ajustes sigue siendo el del dueño
	const hay = await db.select({ n: sql<number>`count(*)` }).from(s.usuarios).get();
	return !hay?.n && ajustes.telegramChatId === chatId ? yoLocal(ajustes) : null;
}

/** Solo lo de los vehículos que ve (si los ve todos, todo). */
export function soloVisibles<T>(yo: Pick<Yo, 'vehiculos'> | null, xs: T[], vehiculoDe: (x: T) => number | null | undefined): T[] {
	if (!yo || yo.vehiculos == null) return xs;
	const ids = new Set(yo.vehiculos);
	return xs.filter((x) => {
		const v = vehiculoDe(x);
		return v != null && ids.has(v);
	});
}
