import { compararNivel, textoDias } from '@novaz/core';
import { resumenVehiculos } from '$lib/server/datos';
import { soloVisibles } from '$lib/server/usuarios';

export const load = async ({ locals, parent }) => {
	const { alertas } = await parent();
	// Lo más urgente de cada vehículo, para decirlo en su tarjeta
	const aviso: Record<number, { texto: string; nivel: string }> = {};
	for (const a of [...alertas].sort((x, y) => compararNivel(x.nivel, y.nivel) || (x.dias ?? 999) - (y.dias ?? 999))) {
		if (aviso[a.vehiculoId] || a.nivel === 'ok') continue;
		const cuando = a.tipo === 'vencimiento' && a.dias != null ? textoDias(a.dias) : a.tipo === 'pendiente' ? 'por reparar' : a.detalle;
		aviso[a.vehiculoId] = { texto: `${a.titulo} · ${cuando}`, nivel: a.nivel };
	}
	return { vehiculos: soloVisibles(locals.yo, await resumenVehiculos(locals.db, alertas), (v) => v.id), aviso };
};
