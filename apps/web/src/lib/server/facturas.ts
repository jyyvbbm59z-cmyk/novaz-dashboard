import { numeroFactura, totalesFactura, type LineaFactura } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { and, eq, max } from 'drizzle-orm';
import { borrarMovimiento, guardarMovimiento } from './acciones';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

function leerLineas(json: string | null): LineaFactura[] {
	let crudo: unknown;
	try {
		crudo = JSON.parse(json ?? '[]');
	} catch {
		throw new ErrorFormulario('Líneas mal formadas');
	}
	if (!Array.isArray(crudo)) throw new ErrorFormulario('Líneas mal formadas');
	const lineas = crudo
		.map((l) => ({
			concepto: String(l?.concepto ?? '').trim(),
			detalle: String(l?.detalle ?? '').trim() || null,
			cantidad: Number(l?.cantidad) || 0,
			unidad: String(l?.unidad ?? '').trim() || null,
			precioCent: Math.round(Number(l?.precioCent) || 0)
		}))
		.filter((l) => l.concepto);
	if (!lineas.length) throw new ErrorFormulario('Añade al menos una línea');
	return lineas;
}

export async function crearFactura(locals: Locals, vehiculoId: number, fd: FormData) {
	const { db, ajustes } = locals;
	const f = leer(fd);
	const tipo = f.texto('tipo') === 'informe' ? 'informe' : 'factura';
	const fecha = f.fecha('fecha') ?? locals.hoy;
	const anio = Number(fecha.slice(0, 4));
	const serie = tipo === 'factura' ? ajustes.serieFactura || 'F' : 'INF';
	const ivaPct = tipo === 'factura' ? Math.min(Math.max(f.entero('ivaPct') ?? 21, 0), 100) : 0;
	const lineas = leerLineas(f.texto('lineas'));
	const { base, iva, total } = totalesFactura(lineas, ivaPct);

	const v = await db.select().from(s.vehiculos).where(eq(s.vehiculos.id, vehiculoId)).get();
	if (!v) throw new ErrorFormulario('Vehículo no encontrado');
	const contactoId = f.idOpcional('contactoId');
	const cliente = {
		nombre: f.texto('clienteNombre') ?? '',
		nif: f.texto('clienteNif'),
		direccion: f.texto('clienteDireccion'),
		email: f.texto('clienteEmail'),
		telefono: f.texto('clienteTelefono')
	};
	if (tipo === 'factura' && !cliente.nombre) throw new ErrorFormulario('Indica el cliente');
	// Guarda los datos fiscales nuevos en el contacto para la próxima vez
	if (contactoId && f.bool('guardarCliente')) {
		await db.update(s.contactos).set({ nif: cliente.nif, direccion: cliente.direccion, email: cliente.email, telefono: cliente.telefono }).where(eq(s.contactos.id, contactoId));
	}

	const ultimo = await db.select({ n: max(s.facturas.numero) }).from(s.facturas).where(and(eq(s.facturas.serie, serie), eq(s.facturas.anio, anio))).get();
	const numero = (ultimo?.n ?? 0) + 1;
	const entradas = (f.texto('entradas') ?? '').split(',').map(Number).filter(Number.isInteger);

	const [fac] = await db
		.insert(s.facturas)
		.values({
			tipo,
			serie,
			anio,
			numero,
			fecha,
			vehiculoId,
			contactoId,
			cliente: cliente.nombre ? cliente : null,
			vehiculo: { alias: v.alias, marca: v.marca, modelo: v.modelo, anio: v.anio, matricula: v.matricula, bastidor: v.bastidor },
			km: f.entero('km'),
			lineas,
			ivaPct,
			baseCent: base,
			ivaCent: iva,
			totalCent: total,
			notas: f.texto('notas'),
			entradas
		})
		.returning({ id: s.facturas.id });

	if (tipo === 'factura' && total > 0 && f.bool('cobrada')) await registrarCobro(locals, fac.id, f.texto('pago') ?? 'banco', fecha);
	return { id: fac.id, numero: numeroFactura(serie, anio, numero) };
}

/** Apunta el cobro de una factura como ingreso (705) con su IVA. */
export async function registrarCobro(locals: Locals, facturaId: number, pago: string, fecha?: string) {
	const fac = await locals.db.select().from(s.facturas).where(eq(s.facturas.id, facturaId)).get();
	if (!fac || fac.movimientoId || fac.anulada) return;
	const cats = await locals.db.select().from(s.categorias).where(eq(s.categorias.tipo, 'ingreso'));
	const cat = cats.find((c) => c.cuentaContable === '705') ?? cats.find((c) => c.nombre.toLowerCase().startsWith('trabajos'));
	const fd = new FormData();
	fd.set('tipo', 'ingreso');
	fd.set('importe', (fac.totalCent / 100).toFixed(2).replace('.', ','));
	fd.set('fecha', fecha ?? locals.hoy);
	fd.set('concepto', `Factura ${numeroFactura(fac.serie, fac.anio, fac.numero)}${fac.cliente?.nombre ? ` · ${fac.cliente.nombre}` : ''}`);
	fd.set('ivaPct', String(fac.ivaPct));
	fd.set('pago', pago === 'caja' ? 'caja' : 'banco');
	if (fac.cliente?.nombre) fd.set('proveedor', fac.cliente.nombre);
	if (cat) fd.set('categoriaId', String(cat.id));
	else fd.set('cuentaContable', '705');
	const movimientoId = await guardarMovimiento(locals, fd, { vehiculoId: fac.vehiculoId });
	await locals.db.update(s.facturas).set({ movimientoId }).where(eq(s.facturas.id, facturaId));
}

/** Anula una factura (se conserva el número) y quita su cobro de la contabilidad. */
export async function anularFactura(locals: Locals, facturaId: number, bucket: R2Bucket) {
	const fac = await locals.db.select().from(s.facturas).where(eq(s.facturas.id, facturaId)).get();
	if (!fac) return;
	if (fac.movimientoId) await borrarMovimiento(locals, fac.movimientoId, bucket);
	await locals.db.update(s.facturas).set({ anulada: true, movimientoId: null }).where(eq(s.facturas.id, facturaId));
}
