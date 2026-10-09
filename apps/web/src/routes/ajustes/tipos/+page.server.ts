import { claveDesdeEtiqueta, TIPOS_CAMPO, type CampoDef } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { count, eq } from 'drizzle-orm';
import { ICONOS_VALIDOS } from '$lib/server/iconos';
import { accion, ErrorFormulario, leer } from '$lib/server/form';

export const load = async ({ locals }) => {
	const usos = await locals.db.select({ tipoId: s.vehiculos.tipoId, n: count() }).from(s.vehiculos).groupBy(s.vehiculos.tipoId);
	return { usos: Object.fromEntries(usos.map((u) => [u.tipoId, u.n])) };
};

function limpiarCampos(json: string | null): CampoDef[] {
	let crudo: unknown;
	try {
		crudo = JSON.parse(json ?? '[]');
	} catch {
		throw new ErrorFormulario('Campos mal formados');
	}
	if (!Array.isArray(crudo)) throw new ErrorFormulario('Campos mal formados');
	const vistas = new Set<string>();
	return crudo
		.filter((c) => c && typeof c.etiqueta === 'string' && c.etiqueta.trim())
		.map((c) => {
			let clave = (typeof c.clave === 'string' && c.clave) || claveDesdeEtiqueta(c.etiqueta);
			while (vistas.has(clave)) clave += '_2';
			vistas.add(clave);
			const tipo = TIPOS_CAMPO.includes(c.tipo) ? c.tipo : 'texto';
			const def: CampoDef = { clave, etiqueta: c.etiqueta.trim(), tipo };
			if (tipo === 'lista') def.opciones = (Array.isArray(c.opciones) ? c.opciones : []).map((o: unknown) => String(o).trim()).filter(Boolean);
			if (tipo === 'numero' && c.unidad) def.unidad = String(c.unidad).trim();
			if (c.obligatorio) def.obligatorio = true;
			return def;
		});
}

export const actions = {
	guardar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const id = f.idOpcional('id');
		const icono = f.texto('icono') ?? 'cog';
		const v = {
			nombre: f.obligatorio('nombre', 'nombre'),
			icono: ICONOS_VALIDOS.includes(icono) ? icono : 'cog',
			orden: f.entero('orden') ?? 0,
			campos: limpiarCampos(f.texto('campos'))
		};
		if (id) await locals.db.update(s.tiposVehiculo).set(v).where(eq(s.tiposVehiculo.id, id));
		else await locals.db.insert(s.tiposVehiculo).values(v);
		return { mensaje: 'Tipo guardado' };
	}),
	borrar: accion(async ({ request, locals }) => {
		const id = leer(await request.formData()).id('id');
		const usado = await locals.db.select({ n: count() }).from(s.vehiculos).where(eq(s.vehiculos.tipoId, id)).get();
		if (usado?.n) throw new ErrorFormulario(`Hay ${usado.n} vehículos de este tipo`);
		await locals.db.delete(s.tiposVehiculo).where(eq(s.tiposVehiculo.id, id));
		return { mensaje: 'Tipo borrado' };
	})
};
