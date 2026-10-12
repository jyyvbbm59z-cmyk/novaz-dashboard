import { normalizarPermisos } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, asc, eq, inArray, notInArray } from 'drizzle-orm';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals }) => {
	const [usuarios, vehiculos] = await Promise.all([
		locals.db.select().from(s.usuarios).orderBy(asc(s.usuarios.id)),
		locals.db.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, matricula: s.vehiculos.matricula, usuarioId: s.vehiculos.usuarioId }).from(s.vehiculos).orderBy(asc(s.vehiculos.alias))
	]);
	return { usuarios: usuarios.map((u) => ({ ...u, permisos: normalizarPermisos(u.permisos) })), vehiculosTodos: vehiculos, yoId: locals.yo?.id ?? 0 };
};

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const { db } = locals;
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const email = (f.obligatorio('email', 'email') ?? '').trim().toLowerCase();
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErrorFormulario('Ese email no parece válido');
		const permisos = normalizarPermisos(f.lista('permisos'));
		// Nadie se quita a sí mismo los ajustes (se quedaría fuera) y siempre queda un administrador
		if (id && id === locals.yo?.id && !permisos.includes('ajustes')) throw new ErrorFormulario('No puedes quitarte «Ajustes y usuarios» a ti mismo');
		const otro = await db.select({ id: s.usuarios.id }).from(s.usuarios).where(eq(s.usuarios.email, email)).get();
		if (otro && otro.id !== id) throw new ErrorFormulario('Ya hay un usuario con ese email');
		const valores = {
			email,
			nombre: f.obligatorio('nombre', 'nombre'),
			permisos,
			telegramChatId: f.texto('telegramChatId')?.replace(/\s/g, '') || null,
			activo: f.texto('activo') !== 'no'
		};
		if (valores.telegramChatId && !/^-?\d{4,20}$/.test(valores.telegramChatId)) throw new ErrorFormulario('El chat de Telegram es un número (te lo da @userinfobot)');
		let uid = id;
		if (id) await db.update(s.usuarios).set(valores).where(eq(s.usuarios.id, id));
		else uid = (await db.insert(s.usuarios).values(valores).returning({ id: s.usuarios.id }))[0].id;
		// Sus vehículos: los marcados pasan a ser suyos; los que dejan de estar marcados, de nadie
		const suyos = f.lista('vehiculoIds').map(Number).filter(Number.isInteger);
		if (suyos.length) await db.update(s.vehiculos).set({ usuarioId: uid }).where(inArray(s.vehiculos.id, suyos));
		await db.update(s.vehiculos).set({ usuarioId: null }).where(and(eq(s.vehiculos.usuarioId, uid!), suyos.length ? notInArray(s.vehiculos.id, suyos) : undefined));
		return { mensaje: id ? 'Usuario guardado' : 'Usuario añadido' };
	}),
	borrar: accion(async ({ request, locals }) => {
		const id = leer(await request.formData()).id('id');
		if (id === locals.yo?.id) throw new ErrorFormulario('No puedes borrarte a ti mismo');
		await locals.db.update(s.vehiculos).set({ usuarioId: null }).where(eq(s.vehiculos.usuarioId, id));
		await locals.db.delete(s.usuarios).where(eq(s.usuarios.id, id));
		return { mensaje: 'Usuario borrado' };
	})
};

