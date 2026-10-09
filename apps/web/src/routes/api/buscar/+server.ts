import * as s from '@novaz/core/schema';
import { json } from '@sveltejs/kit';
import { like, or } from 'drizzle-orm';

export const GET = async ({ url, locals }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 2) return json([]);
	const p = `%${q.replace(/[%_]/g, '')}%`;
	const db = locals.db;
	const [vehiculos, entradas, vencimientos, contactos, restauraciones] = await db.batch([
		db
			.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, matricula: s.vehiculos.matricula, marca: s.vehiculos.marca, modelo: s.vehiculos.modelo })
			.from(s.vehiculos)
			.where(or(like(s.vehiculos.alias, p), like(s.vehiculos.matricula, p), like(s.vehiculos.marca, p), like(s.vehiculos.modelo, p), like(s.vehiculos.bastidor, p)))
			.limit(8),
		db
			.select({ id: s.entradas.id, vehiculoId: s.entradas.vehiculoId, titulo: s.entradas.titulo, fecha: s.entradas.fecha })
			.from(s.entradas)
			.where(or(like(s.entradas.titulo, p), like(s.entradas.texto, p)))
			.limit(8),
		db
			.select({ id: s.vencimientos.id, vehiculoId: s.vencimientos.vehiculoId, referencia: s.vencimientos.referencia, proveedor: s.vencimientos.proveedor })
			.from(s.vencimientos)
			.where(or(like(s.vencimientos.referencia, p), like(s.vencimientos.proveedor, p)))
			.limit(5),
		db.select({ id: s.contactos.id, nombre: s.contactos.nombre }).from(s.contactos).where(or(like(s.contactos.nombre, p), like(s.contactos.telefono, p), like(s.contactos.email, p))).limit(5),
		db.select({ id: s.restauraciones.id, nombre: s.restauraciones.nombre }).from(s.restauraciones).where(like(s.restauraciones.nombre, p)).limit(5)
	]);

	return json([
		...vehiculos.map((v) => ({ grupo: 'Vehículos', titulo: v.alias, sub: [v.marca, v.modelo].filter(Boolean).join(' '), matricula: v.matricula, href: `/flota/${v.id}` })),
		...restauraciones.map((r) => ({ grupo: 'Restauraciones', titulo: r.nombre, sub: '', href: `/restauraciones/${r.id}` })),
		...entradas.map((e) => ({ grupo: 'Historial', titulo: e.titulo, sub: e.fecha, href: `/flota/${e.vehiculoId}#entrada-${e.id}` })),
		...vencimientos.map((v) => ({ grupo: 'Pólizas y papeles', titulo: v.referencia ?? v.proveedor ?? 'Vencimiento', sub: v.proveedor ?? '', href: `/flota/${v.vehiculoId}?pestana=vencimientos` })),
		...contactos.map((c) => ({ grupo: 'Contactos', titulo: c.nombre, sub: '', href: `/contactos#c${c.id}` }))
	]);
};
