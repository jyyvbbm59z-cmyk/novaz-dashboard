// Quién es quién: el email que da Cloudflare Access → su ficha de usuario y sus permisos.
import { normalizarPermisos, PERMISOS, type Ajustes, type Permiso } from '@novaz/core';
import type { PreferenciasUsuario } from '@novaz/core/schema';
import * as s from '@novaz/core/schema';
import { eq, sql } from 'drizzle-orm';

type DB = App.Locals['db'];

export interface Yo {
	id: number;
	email: string;
	nombre: string;
	permisos: Permiso[];
	telegramChatId: string | null;
	preferencias: PreferenciasUsuario;
	/**
	 * Vehículos con los que trabaja (los suyos y los del taller): los que le salen en Inicio, agenda, avisos, bot y «+».
	 * null = todos (no hay privados de otros).
	 */
	vehiculos: number[] | null;
	/** Vehículos privados de otros usuarios: los ve en solo lectura. */
	ajenos: number[];
}

/** Reparto de vehículos para un usuario: privados de otros (solo lectura) y el resto (con los que trabaja). */
async function repartoVehiculos(db: DB, uid: number) {
	const todos = await db.select({ id: s.vehiculos.id, usuarioId: s.vehiculos.usuarioId }).from(s.vehiculos);
	const ajenos = todos.filter((v) => v.usuarioId != null && v.usuarioId !== uid).map((v) => v.id);
	return { ajenos, vehiculos: ajenos.length ? todos.filter((v) => !ajenos.includes(v.id)).map((v) => v.id) : null };
}

async function comoYo(db: DB, u: s.Usuario): Promise<Yo> {
	return { id: u.id, email: u.email, nombre: u.nombre, permisos: normalizarPermisos(u.permisos), telegramChatId: u.telegramChatId, preferencias: u.preferencias ?? {}, ...(await repartoVehiculos(db, u.id)) };
}

/** ¿Trabaja con este vehículo (suyo o del taller)? Los privados de otros solo los ve. */
export const veVehiculo = (yo: Pick<Yo, 'vehiculos'> | null, vehiculoId: number) => !yo || yo.vehiculos == null || yo.vehiculos.includes(vehiculoId);

/** ¿Es un vehículo privado de otro usuario (solo lectura para él)? */
export const esAjeno = (yo: Pick<Yo, 'ajenos'> | null, vehiculoId: number | null | undefined) => !!yo && vehiculoId != null && yo.ajenos.includes(vehiculoId);

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
export const yoLocal = (ajustes: Ajustes): Yo => ({ id: 0, email: 'local', nombre: 'Local', permisos: [...PERMISOS], telegramChatId: ajustes.telegramChatId || null, preferencias: {}, vehiculos: null, ajenos: [] });

/** El usuario dueño de un chat de Telegram (el bot solo hace caso a usuarios dados de alta). */
export async function usuarioDeChat(db: DB, chatId: string, ajustes: Ajustes): Promise<Yo | null> {
	const u = await db.select().from(s.usuarios).where(eq(s.usuarios.telegramChatId, chatId)).get();
	if (u) return u.activo ? comoYo(db, u) : null;
	// Antes de dar de alta a nadie, el chat de Ajustes sigue siendo el del dueño
	const hay = await db.select({ n: sql<number>`count(*)` }).from(s.usuarios).get();
	return !hay?.n && ajustes.telegramChatId === chatId ? yoLocal(ajustes) : null;
}

/** Solo lo de sus vehículos y los del taller (fuera lo de los privados de otros). Lo que no es de ningún vehículo se queda. */
export function soloVisibles<T>(yo: Pick<Yo, 'ajenos'> | null, xs: T[], vehiculoDe: (x: T) => number | null | undefined): T[] {
	if (!yo?.ajenos.length) return xs;
	const fuera = new Set(yo.ajenos);
	return xs.filter((x) => {
		const v = vehiculoDe(x);
		return v == null || !fuera.has(v);
	});
}
