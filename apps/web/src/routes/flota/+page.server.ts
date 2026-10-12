import { compararNivel, textoDias } from '@novaz/core';
import { resumenVehiculos } from '$lib/server/datos';
import * as s from '@novaz/core/schema';

export const load = async ({ locals, parent }) => {
	const { alertas } = await parent();
	// Lo más urgente de cada vehículo, para decirlo en su tarjeta
	const aviso: Record<number, { texto: string; nivel: string }> = {};
	for (const a of [...alertas].sort((x, y) => compararNivel(x.nivel, y.nivel) || (x.dias ?? 999) - (y.dias ?? 999))) {
		if (aviso[a.vehiculoId] || a.nivel === 'ok') continue;
		const cuando = a.tipo === 'vencimiento' && a.dias != null ? textoDias(a.dias) : a.tipo === 'pendiente' ? 'por reparar' : a.detalle;
		aviso[a.vehiculoId] = { texto: `${a.titulo} · ${cuando}`, nivel: a.nivel };
	}
	// Se ven todos; los privados de otros, marcados y en solo lectura
	const [vehiculos, usuarios] = await Promise.all([resumenVehiculos(locals.db, alertas), locals.db.select({ id: s.usuarios.id, nombre: s.usuarios.nombre }).from(s.usuarios)]);
	const deQuien: Record<number, string> = {};
	for (const v of vehiculos) if (v.usuarioId != null) deQuien[v.id] = v.usuarioId === locals.yo?.id ? 'ti' : (usuarios.find((u) => u.id === v.usuarioId)?.nombre ?? 'otro usuario');
	return { vehiculos, aviso, deQuien, ajenos: locals.yo?.ajenos ?? [] };
};
