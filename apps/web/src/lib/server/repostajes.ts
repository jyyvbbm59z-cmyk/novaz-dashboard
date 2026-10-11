import * as s from '@novaz/core/schema';
import { and, eq } from 'drizzle-orm';
import { borrarMovimiento, guardarMovimiento } from './acciones';
import { comprobarLectura, registrarKm } from './datos';
import { ErrorFormulario, leer } from './form';

/** Repostaje: apunta el gasto en Combustible, la lectura de km y los litros (para el consumo real). */
export async function guardarRepostaje(locals: App.Locals, fd: FormData) {
	const f = leer(fd);
	const vehiculoId = f.id('vehiculoId');
	const fecha = f.fecha('fecha') ?? locals.hoy;
	const litros = f.decimal('litros');
	if (!litros || litros <= 0) throw new ErrorFormulario('Indica los litros');
	let importe = f.euros('importe');
	const precio = f.decimal('precioLitro');
	if (!importe && precio) importe = Math.round(litros * precio * 100);
	if (!importe || importe <= 0) throw new ErrorFormulario('Indica el importe (o el precio por litro)');
	const km = f.entero('km');
	if (km != null) await comprobarLectura(locals.db, vehiculoId, fecha, km);
	const gasolinera = f.texto('gasolinera');

	const cat = (await locals.db.select().from(s.categorias).where(eq(s.categorias.tipo, 'gasto'))).find((c) => /combust/i.test(c.nombre));
	const datos = new FormData();
	datos.set('tipo', 'gasto');
	datos.set('importe', (importe / 100).toFixed(2).replace('.', ','));
	datos.set('fecha', fecha);
	datos.set('concepto', `Repostaje ${litros.toLocaleString('es-ES')} L`);
	if (cat) datos.set('categoriaId', String(cat.id));
	if (gasolinera) datos.set('proveedor', gasolinera);
	const pago = f.texto('pago');
	if (pago) datos.set('pago', pago);
	const movimientoId = await guardarMovimiento(locals, datos, { vehiculoId });

	const [r] = await locals.db
		.insert(s.repostajes)
		.values({ vehiculoId, fecha, km, litros, importeCent: importe, lleno: f.bool('lleno'), gasolinera, movimientoId })
		.returning({ id: s.repostajes.id });
	await registrarKm(locals.db, vehiculoId, fecha, km, 'entrada');
	return { repostajeId: r.id, movimientoId, importe };
}

export async function borrarRepostaje(locals: App.Locals, id: number, bucket?: R2Bucket) {
	const r = await locals.db.select().from(s.repostajes).where(eq(s.repostajes.id, id)).get();
	if (!r) return;
	await locals.db.delete(s.repostajes).where(eq(s.repostajes.id, id));
	if (r.movimientoId) await borrarMovimiento(locals, r.movimientoId, bucket);
	// La lectura de km que apuntó (si nadie más la registró a mano)
	if (r.km != null)
		await locals.db
			.delete(s.lecturasKm)
			.where(and(eq(s.lecturasKm.vehiculoId, r.vehiculoId), eq(s.lecturasKm.fecha, r.fecha), eq(s.lecturasKm.km, r.km), eq(s.lecturasKm.origen, 'entrada')));
}
