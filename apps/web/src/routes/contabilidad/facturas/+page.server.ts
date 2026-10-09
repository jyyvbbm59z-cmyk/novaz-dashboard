import * as s from '@novaz/core/schema';
import { desc, eq, like } from 'drizzle-orm';
import { borrarMovimiento } from '$lib/server/acciones';
import { ejercicioDeUrl } from '$lib/server/contabilidad';
import { anularFactura, registrarCobro } from '$lib/server/facturas';
import { accion, leer } from '$lib/server/form';

export const load = async ({ locals, url }) => {
	const ejercicio = ejercicioDeUrl(url, locals.hoy);
	return {
		facturas: await locals.db
			.select()
			.from(s.facturas)
			.where(like(s.facturas.fecha, `${ejercicio}%`))
			.orderBy(desc(s.facturas.fecha), desc(s.facturas.numero))
	};
};

export const actions = {
	cobrar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		await registrarCobro(locals, f.id('id'), f.texto('pago') ?? 'banco');
		return { mensaje: 'Cobro apuntado como ingreso' };
	}),
	anular: accion(async ({ request, locals, platform }) => {
		await anularFactura(locals, leer(await request.formData()).id('id'), platform!.env.ARCHIVOS);
		return { mensaje: 'Factura anulada' };
	}),
	descobrar: accion(async ({ request, locals, platform }) => {
		const id = leer(await request.formData()).id('id');
		const f = await locals.db.select().from(s.facturas).where(eq(s.facturas.id, id)).get();
		if (f?.movimientoId) {
			await borrarMovimiento(locals, f.movimientoId, platform!.env.ARCHIVOS);
			await locals.db.update(s.facturas).set({ movimientoId: null }).where(eq(s.facturas.id, id));
		}
		return { mensaje: 'Marcada como pendiente de cobro' };
	})
};
