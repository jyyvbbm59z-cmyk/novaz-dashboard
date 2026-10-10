import { existencias } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { ESTADOS_HERRAMIENTA, TIPOS_ARTICULO, type EstadoHerramienta, type TipoArticulo } from '@novaz/core/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { guardarMovimiento } from './acciones';
import { ErrorFormulario, leer } from './form';

type Locals = App.Locals;

/** Artículos con su cantidad actual y su foto. */
export async function cargarInventario(db: Locals['db']) {
	const [articulos, movs, fotos] = await Promise.all([
		db.select().from(s.articulos).orderBy(asc(s.articulos.nombre)),
		db.select({ articuloId: s.stock.articuloId, cantidad: s.stock.cantidad }).from(s.stock),
		db
			.select({ entidadId: s.adjuntos.entidadId, clave: s.adjuntos.clave, mime: s.adjuntos.mime })
			.from(s.adjuntos)
			.where(eq(s.adjuntos.entidad, 'articulo'))
			.orderBy(asc(s.adjuntos.id))
	]);
	const cant = existencias(movs);
	// Portada: la primera foto del artículo
	const portada = new Map<number, string>();
	for (const f of fotos) if (f.mime.startsWith('image/') && !portada.has(f.entidadId)) portada.set(f.entidadId, f.clave);
	return articulos.map((a) => ({ ...a, cantidad: cant.get(a.id) ?? 0, portada: portada.get(a.id) ?? null }));
}
export type ArticuloInventario = Awaited<ReturnType<typeof cargarInventario>>[number];

export async function guardarArticulo(locals: Locals, fd: FormData) {
	const f = leer(fd);
	const id = f.idOpcional('id');
	const tipo = f.texto('tipo') as TipoArticulo;
	const estado = f.texto('estado') as EstadoHerramienta;
	const valores = {
		tipo: TIPOS_ARTICULO.includes(tipo) ? tipo : 'herramienta',
		nombre: f.obligatorio('nombre', 'nombre'),
		marca: f.texto('marca'),
		referencia: f.texto('referencia'),
		categoria: f.texto('categoria'),
		ubicacion: f.texto('ubicacion'),
		unidad: f.texto('unidad') ?? 'ud',
		stockMinimo: f.decimal('stockMinimo'),
		estado: ESTADOS_HERRAMIENTA.includes(estado) ? estado : 'ok',
		prestadaA: estado === 'prestada' ? f.texto('prestadaA') : null,
		valorCent: f.euros('valor'),
		fechaCompra: f.fecha('fechaCompra'),
		proveedor: f.texto('proveedor'),
		numeroSerie: f.texto('numeroSerie'),
		vehiculoIds: f.lista('vehiculoIds').map(Number).filter(Number.isInteger),
		notas: f.texto('notas')
	};
	if (id) {
		await locals.db.update(s.articulos).set(valores).where(eq(s.articulos.id, id));
		return id;
	}
	const [a] = await locals.db.insert(s.articulos).values(valores).returning({ id: s.articulos.id });
	const inicial = f.decimal('cantidadInicial') ?? (valores.tipo === 'herramienta' ? 1 : 0);
	if (inicial) await locals.db.insert(s.stock).values({ articuloId: a.id, fecha: valores.fechaCompra ?? locals.hoy, cantidad: inicial, motivo: 'alta' });
	return a.id;
}

/** Compra (suma y, si hay importe, apunta el gasto), uso (resta) o ajuste (deja la cantidad exacta). */
export async function registrarStock(locals: Locals, fd: FormData, cantidadActual: (id: number) => Promise<number>) {
	const f = leer(fd);
	const articuloId = f.id('articuloId');
	const a = await locals.db.select().from(s.articulos).where(eq(s.articulos.id, articuloId)).get();
	if (!a) throw new ErrorFormulario('Artículo no encontrado');
	const motivo = f.texto('motivo');
	const fecha = f.fecha('fecha') ?? locals.hoy;
	let cantidad = f.decimal('cantidad');
	if (cantidad == null) throw new ErrorFormulario('Indica la cantidad');

	if (motivo === 'ajuste') {
		const delta = cantidad - (await cantidadActual(articuloId));
		if (!delta) return;
		await locals.db.insert(s.stock).values({ articuloId, fecha, cantidad: delta, motivo: 'ajuste', notas: f.texto('notas') ?? 'Recuento' });
		return;
	}
	cantidad = Math.abs(cantidad);
	if (motivo === 'uso') {
		await locals.db.insert(s.stock).values({ articuloId, fecha, cantidad: -cantidad, motivo: 'uso', entradaId: f.idOpcional('entradaId'), notas: f.texto('notas') });
		return;
	}
	// Compra: el gasto va a la categoría que toque según el tipo de artículo
	let movimientoId: number | null = null;
	const importe = f.euros('importe');
	if (importe) {
		const cats = await locals.db.select().from(s.categorias).where(eq(s.categorias.tipo, 'gasto'));
		const buscar = a.tipo === 'herramienta' ? /herramienta/i : a.tipo === 'recambio' ? /recambio/i : /consumible/i;
		const cat = cats.find((c) => buscar.test(c.nombre));
		const datos = new FormData();
		datos.set('tipo', 'gasto');
		datos.set('importe', (importe / 100).toFixed(2).replace('.', ','));
		datos.set('fecha', fecha);
		datos.set('concepto', `${a.nombre}${cantidad !== 1 ? ` × ${cantidad.toLocaleString('es-ES')} ${a.unidad}` : ''}`);
		if (cat) datos.set('categoriaId', String(cat.id));
		const proveedor = f.texto('proveedor') ?? a.proveedor;
		if (proveedor) datos.set('proveedor', proveedor);
		const pago = f.texto('pago');
		if (pago) datos.set('pago', pago);
		movimientoId = await guardarMovimiento(locals, datos, { vehiculoId: a.vehiculoIds.length === 1 ? a.vehiculoIds[0] : null });
		// Guarda el último precio unitario
		await locals.db.update(s.articulos).set({ valorCent: Math.round(importe / cantidad), fechaCompra: fecha }).where(eq(s.articulos.id, articuloId));
	}
	await locals.db.insert(s.stock).values({ articuloId, fecha, cantidad, motivo: 'compra', movimientoId, notas: f.texto('notas') });
}

/** Recuento: lo que está se marca comprobado hoy; lo que falta pasa a «perdida». */
export async function guardarRecuento(locals: Locals, presentes: number[], faltan: number[]) {
	if (presentes.length) {
		await locals.db.update(s.articulos).set({ ultimoRecuento: locals.hoy }).where(inArray(s.articulos.id, presentes));
		await locals.db
			.update(s.articulos)
			.set({ estado: 'ok' })
			.where(and(inArray(s.articulos.id, presentes), eq(s.articulos.estado, 'perdida')));
	}
	if (faltan.length) await locals.db.update(s.articulos).set({ estado: 'perdida' }).where(inArray(s.articulos.id, faltan));
}

/** Líneas «para comprar» de una avería o una tarea del local: crea las nuevas, quita las borradas y respeta lo ya comprado. */
export async function sincronizarCompras(db: Locals['db'], texto: string, ref: { pendienteId: number; vehiculoId: number } | { tareaLocalId: number }) {
	const lineas = [...new Set(texto.split('\n').map((l) => l.trim()).filter(Boolean))];
	const filtro = 'pendienteId' in ref ? eq(s.listaCompra.pendienteId, ref.pendienteId) : eq(s.listaCompra.tareaLocalId, ref.tareaLocalId);
	const existentes = await db.select().from(s.listaCompra).where(filtro);
	const clave = (t: string) => t.toLocaleLowerCase('es');
	const quedan = new Set(lineas.map(clave));
	const borrar = existentes.filter((e) => !quedan.has(clave(e.texto))).map((e) => e.id);
	if (borrar.length) await db.delete(s.listaCompra).where(inArray(s.listaCompra.id, borrar));
	const ya = new Set(existentes.map((e) => clave(e.texto)));
	const nuevas = lineas.filter((l) => !ya.has(clave(l)));
	if (nuevas.length) await db.insert(s.listaCompra).values(nuevas.map((t) => ({ texto: t, ...ref })));
}

/** Al cerrar una avería o tarea, lo que no se llegó a comprar sale de la lista. */
export async function cerrarCompras(db: Locals['db'], ref: { pendienteId: number } | { tareaLocalId: number }) {
	const filtro = 'pendienteId' in ref ? eq(s.listaCompra.pendienteId, ref.pendienteId) : eq(s.listaCompra.tareaLocalId, ref.tareaLocalId);
	await db.delete(s.listaCompra).where(and(filtro, eq(s.listaCompra.comprado, false)));
}
