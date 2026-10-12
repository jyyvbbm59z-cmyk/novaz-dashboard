import { cargarAlertas } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { asc } from 'drizzle-orm';
import { catalogos } from '$lib/server/datos';
import { soloVisibles } from '$lib/server/usuarios';

export const load = async ({ locals }) => {
	const { db, ajustes, hoy } = locals;
	const [catalogo, alertas, vehiculos] = await Promise.all([
		catalogos(db),
		locals.permisos.includes('vehiculos') ? cargarAlertas(db, { hoy, urgenteDias: ajustes.urgenteDias }).then((a) => soloVisibles(locals.yo, a, (x) => x.vehiculoId)) : Promise.resolve([]),
		db
			.select({ id: s.vehiculos.id, alias: s.vehiculos.alias, matricula: s.vehiculos.matricula, tipoId: s.vehiculos.tipoId, estadoId: s.vehiculos.estadoId, propietario: s.vehiculos.propietario })
			.from(s.vehiculos)
			.orderBy(asc(s.vehiculos.alias))
			.then((vs) => soloVisibles(locals.yo, vs, (v) => v.id))
	]);
	return {
		ajustes,
		usuario: locals.usuario,
		yo: locals.yo ? { nombre: locals.yo.nombre, email: locals.yo.email } : null,
		permisos: locals.permisos,
		/** Solo ve sus vehículos (sin contactos ni la flota del taller). */
		soloSuyos: locals.yo?.vehiculos != null,
		hoy,
		catalogo,
		alertas,
		vehiculosMenu: vehiculos
	};
};
