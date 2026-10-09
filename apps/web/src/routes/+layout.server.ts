import { cargarAlertas } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc } from 'drizzle-orm';
import { catalogos } from '$lib/server/datos';

export const load = async ({ locals }) => {
	const { db, ajustes, hoy } = locals;
	const [catalogo, alertas, vehiculos] = await Promise.all([
		catalogos(db),
		cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias }),
		db
			.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, matricula: s.vehiculos.matricula, tipoId: s.vehiculos.tipoId, estadoId: s.vehiculos.estadoId })
			.from(s.vehiculos)
			.orderBy(asc(s.vehiculos.alias))
	]);
	return {
		ajustes,
		usuario: locals.usuario,
		hoy,
		catalogo,
		alertas,
		vehiculosMenu: vehiculos
	};
};
