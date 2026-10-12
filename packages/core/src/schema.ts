import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { CampoDef, FasePlantilla } from './campos';
import type { LineaFactura } from './facturacion';
import type { DisposicionMueble } from './ubicaciones';

export interface TareaHecha {
	plan: string;
	tarea: string;
	hecha: boolean;
	nota?: string | null;
}

// Convenciones: fechas de negocio como texto ISO 'YYYY-MM-DD', importes en céntimos (entero),
// marcas de tiempo como texto 'YYYY-MM-DD HH:MM:SS' (UTC) generado por SQLite.
const id = () => integer('id').primaryKey({ autoIncrement: true });
const creado = () => text('creado').notNull().default(sql`(datetime('now'))`);
const bool = (nombre: string) => integer(nombre, { mode: 'boolean' });

export const FORMAS_PAGO = ['banco', 'caja', 'socio'] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

/**
 * gasto / ingreso: afectan al resultado.
 * aportacion: entra dinero sin ser ingreso (socio, préstamo…): Debe tesorería / Haber cuenta.
 * retirada: sale dinero sin ser gasto (devolver al socio, sacar a caja…): Debe cuenta / Haber tesorería.
 */
export const TIPOS_MOVIMIENTO = ['gasto', 'ingreso', 'aportacion', 'retirada'] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

// ─── Configuración ────────────────────────────────────────────────────────────

export const tiposVehiculo = sqliteTable('tipos_vehiculo', {
	id: id(),
	nombre: text('nombre').notNull(),
	icono: text('icono').notNull().default('car-front'),
	campos: text('campos', { mode: 'json' }).$type<CampoDef[]>().notNull().default([]),
	orden: integer('orden').notNull().default(0)
});

export const estados = sqliteTable('estados', {
	id: id(),
	nombre: text('nombre').notNull(),
	color: text('color').notNull().default('#8a8f98'),
	/** Estados finales (vendido, entregado…) ocultan el vehículo de la flota activa. */
	final: bool('final').notNull().default(false),
	orden: integer('orden').notNull().default(0)
});

export const categorias = sqliteTable('categorias', {
	id: id(),
	nombre: text('nombre').notNull(),
	tipo: text('tipo', { enum: ['gasto', 'ingreso'] }).notNull().default('gasto'),
	color: text('color').notNull().default('#8a8f98'),
	/** Cuenta del PGC donde se contabiliza (p. ej. 602, 705). */
	cuentaContable: text('cuenta_contable'),
	/** IVA por defecto (%) de los movimientos de esta categoría. */
	ivaPct: integer('iva_pct').notNull().default(21),
	orden: integer('orden').notNull().default(0)
});

export const tiposVencimiento = sqliteTable('tipos_vencimiento', {
	id: id(),
	nombre: text('nombre').notNull(),
	icono: text('icono').notNull().default('calendar-clock'),
	/** Validez por defecto al renovar (null = se indica a mano). */
	mesesValidez: integer('meses_validez'),
	avisosDias: text('avisos_dias', { mode: 'json' }).$type<number[]>().notNull().default([30, 7, 1]),
	/** Tipos de vehículo a los que aplica; vacío = todos. */
	tiposVehiculoIds: text('tipos_vehiculo_ids', { mode: 'json' }).$type<number[]>().notNull().default([]),
	categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
	orden: integer('orden').notNull().default(0),
	activo: bool('activo').notNull().default(true)
});

export const planesMantenimiento = sqliteTable('planes_mantenimiento', {
	id: id(),
	/** Código corto de la revisión (I1, I2…). */
	codigo: text('codigo'),
	nombre: text('nombre').notNull(),
	cadaKm: integer('cada_km'),
	cadaMeses: integer('cada_meses'),
	/** Periodicidad en días (p. ej. 14 = cada dos semanas). Si está, manda sobre los meses. */
	cadaDias: integer('cada_dias'),
	/** Lista de tareas de la revisión. */
	tareas: text('tareas', { mode: 'json' }).$type<string[]>().notNull().default([]),
	/** Otros planes que quedan hechos al hacer este (la I3 incluye la I2 y la I1). */
	incluye: text('incluye', { mode: 'json' }).$type<number[]>().notNull().default([]),
	orden: integer('orden').notNull().default(0),
	/** Ámbito: un tipo de vehículo, un vehículo concreto o (ambos null) todos. */
	tipoVehiculoId: integer('tipo_vehiculo_id').references(() => tiposVehiculo.id, { onDelete: 'cascade' }),
	vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'cascade' }),
	avisoKm: integer('aviso_km').notNull().default(500),
	avisoDias: integer('aviso_dias').notNull().default(30),
	notas: text('notas'),
	activo: bool('activo').notNull().default(true)
});

export const plantillasFases = sqliteTable('plantillas_fases', {
	id: id(),
	nombre: text('nombre').notNull(),
	fases: text('fases', { mode: 'json' }).$type<FasePlantilla[]>().notNull().default([])
});

export const ajustes = sqliteTable('ajustes', {
	clave: text('clave').primaryKey(),
	valor: text('valor', { mode: 'json' }).$type<unknown>()
});

// ─── Núcleo ───────────────────────────────────────────────────────────────────

export const contactos = sqliteTable('contactos', {
	id: id(),
	nombre: text('nombre').notNull(),
	telefono: text('telefono'),
	email: text('email'),
	nif: text('nif'),
	direccion: text('direccion'),
	notas: text('notas'),
	creado: creado()
});

export const vehiculos = sqliteTable(
	'vehiculos',
	{
		id: id(),
		tipoId: integer('tipo_id')
			.notNull()
			.references(() => tiposVehiculo.id),
		alias: text('alias').notNull(),
		marca: text('marca'),
		modelo: text('modelo'),
		anio: integer('anio'),
		matricula: text('matricula'),
		bastidor: text('bastidor'),
		estadoId: integer('estado_id').references(() => estados.id, { onDelete: 'set null' }),
		propietario: text('propietario', { enum: ['novaz', 'tercero'] }).notNull().default('novaz'),
		contactoId: integer('contacto_id').references(() => contactos.id, { onDelete: 'set null' }),
		fechaAlta: text('fecha_alta'),
		notas: text('notas'),
		campos: text('campos', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
		portadaId: integer('portada_id'),
		/** Dueño del vehículo si es privado (solo él lo edita; los demás lo ven en solo lectura). Null = del taller (común). */
		usuarioId: integer('usuario_id'),
		/** Lo que valdría hoy (para restauraciones: comparar inversión con valor de venta). */
		valorEstimadoCent: integer('valor_estimado_cent'),
		creado: creado(),
		actualizado: text('actualizado').notNull().default(sql`(datetime('now'))`)
	},
	(t) => [index('vehiculos_tipo_idx').on(t.tipoId), index('vehiculos_estado_idx').on(t.estadoId)]
);

export const lecturasKm = sqliteTable(
	'lecturas_km',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		fecha: text('fecha').notNull(),
		km: integer('km').notNull(),
		origen: text('origen', { enum: ['manual', 'entrada'] }).notNull().default('manual'),
		creado: creado()
	},
	(t) => [index('lecturas_vehiculo_idx').on(t.vehiculoId, t.fecha)]
);

export const vencimientos = sqliteTable(
	'vencimientos',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		tipoId: integer('tipo_id')
			.notNull()
			.references(() => tiposVencimiento.id),
		fechaInicio: text('fecha_inicio'),
		fechaVence: text('fecha_vence').notNull(),
		proveedor: text('proveedor'),
		referencia: text('referencia'),
		importeCent: integer('importe_cent'),
		notas: text('notas'),
		estado: text('estado', { enum: ['vigente', 'renovado', 'anulado'] }).notNull().default('vigente'),
		creado: creado()
	},
	(t) => [index('vencimientos_vehiculo_idx').on(t.vehiculoId), index('vencimientos_fecha_idx').on(t.estado, t.fechaVence)]
);

// ─── Restauraciones ───────────────────────────────────────────────────────────

export const restauraciones = sqliteTable('restauraciones', {
	id: id(),
	vehiculoId: integer('vehiculo_id')
		.notNull()
		.references(() => vehiculos.id, { onDelete: 'cascade' }),
	nombre: text('nombre').notNull(),
	descripcion: text('descripcion'),
	fechaInicio: text('fecha_inicio'),
	fechaFin: text('fecha_fin'),
	presupuestoCent: integer('presupuesto_cent'),
	estado: text('estado', { enum: ['planificada', 'en_curso', 'pausada', 'terminada'] })
		.notNull()
		.default('en_curso'),
	creado: creado()
});

export const fases = sqliteTable(
	'fases',
	{
		id: id(),
		restauracionId: integer('restauracion_id')
			.notNull()
			.references(() => restauraciones.id, { onDelete: 'cascade' }),
		nombre: text('nombre').notNull(),
		orden: integer('orden').notNull().default(0),
		fechaFin: text('fecha_fin')
	},
	(t) => [index('fases_restauracion_idx').on(t.restauracionId)]
);

export const tareas = sqliteTable(
	'tareas',
	{
		id: id(),
		faseId: integer('fase_id')
			.notNull()
			.references(() => fases.id, { onDelete: 'cascade' }),
		titulo: text('titulo').notNull(),
		hecha: bool('hecha').notNull().default(false),
		horasEstimadas: real('horas_estimadas'),
		orden: integer('orden').notNull().default(0),
		fechaHecha: text('fecha_hecha')
	},
	(t) => [index('tareas_fase_idx').on(t.faseId)]
);

// ─── Historial ────────────────────────────────────────────────────────────────

export const CLASES_ENTRADA = ['mantenimiento', 'reparacion', 'mejora', 'diario', 'nota'] as const;
export type ClaseEntrada = (typeof CLASES_ENTRADA)[number];

export const entradas = sqliteTable(
	'entradas',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		clase: text('clase', { enum: CLASES_ENTRADA }).notNull().default('nota'),
		fecha: text('fecha').notNull(),
		km: integer('km'),
		titulo: text('titulo').notNull(),
		texto: text('texto'),
		horas: real('horas'),
		/** Tareas de las revisiones hechas en esta entrada, con su resultado. */
		checklist: text('checklist', { mode: 'json' }).$type<TareaHecha[]>(),
		/** Obsoleto: sustituido por `entradasPlanes` (una entrada puede renovar varios planes). */
		planId: integer('plan_id').references(() => planesMantenimiento.id, { onDelete: 'set null' }),
		restauracionId: integer('restauracion_id').references(() => restauraciones.id, { onDelete: 'set null' }),
		faseId: integer('fase_id').references(() => fases.id, { onDelete: 'set null' }),
		creado: creado()
	},
	(t) => [index('entradas_vehiculo_idx').on(t.vehiculoId, t.fecha), index('entradas_plan_idx').on(t.planId)]
);

/** Planes de mantenimiento que renueva cada entrada (aceite + filtro + frenos en una revisión). */
export const entradasPlanes = sqliteTable(
	'entradas_planes',
	{
		entradaId: integer('entrada_id')
			.notNull()
			.references(() => entradas.id, { onDelete: 'cascade' }),
		planId: integer('plan_id')
			.notNull()
			.references(() => planesMantenimiento.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.entradaId, t.planId] }), index('entradas_planes_plan_idx').on(t.planId)]
);

// ─── Por reparar ──────────────────────────────────────────────────────────────

export const PRIORIDADES = ['alta', 'media', 'baja'] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

/** Averías y trabajos pendientes detectados en un vehículo (p. ej. una fuga en una revisión). */
export const pendientes = sqliteTable(
	'pendientes',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		titulo: text('titulo').notNull(),
		detalle: text('detalle'),
		/** Avería (algo roto) o mejora (algo que quieres hacerle: ruedas, suspensión…). */
		tipo: text('tipo', { enum: ['averia', 'mejora'] }).notNull().default('averia'),
		presupuestoCent: integer('presupuesto_cent'),
		prioridad: text('prioridad', { enum: PRIORIDADES }).notNull().default('media'),
		fechaDetectado: text('fecha_detectado').notNull(),
		kmDetectado: integer('km_detectado'),
		estado: text('estado', { enum: ['pendiente', 'hecho', 'descartado'] }).notNull().default('pendiente'),
		fechaCierre: text('fecha_cierre'),
		/** Entrada de reparación con la que se resolvió. */
		entradaId: integer('entrada_id').references(() => entradas.id, { onDelete: 'set null' }),
		creado: creado()
	},
	(t) => [index('pendientes_vehiculo_idx').on(t.vehiculoId, t.estado)]
);

// ─── Dinero ───────────────────────────────────────────────────────────────────

export const movimientos = sqliteTable(
	'movimientos',
	{
		id: id(),
		fecha: text('fecha').notNull(),
		tipo: text('tipo', { enum: TIPOS_MOVIMIENTO }).notNull().default('gasto'),
		importeCent: integer('importe_cent').notNull(),
		categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
		concepto: text('concepto').notNull(),
		proveedor: text('proveedor'),
		vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'set null' }),
		entradaId: integer('entrada_id').references(() => entradas.id, { onDelete: 'set null' }),
		vencimientoId: integer('vencimiento_id').references(() => vencimientos.id, { onDelete: 'set null' }),
		restauracionId: integer('restauracion_id').references(() => restauraciones.id, { onDelete: 'set null' }),
		notas: text('notas'),
		/** IVA incluido en el importe (%). */
		ivaPct: integer('iva_pct').notNull().default(21),
		/** De dónde sale o adónde entra el dinero. */
		pago: text('pago', { enum: FORMAS_PAGO }).notNull().default('banco'),
		/** Cuenta contable propia; si es null, la de la categoría. */
		cuentaContable: text('cuenta_contable'),
		/** Generado por una operación recurrente (p. ej. la aportación mensual). */
		recurrenteId: integer('recurrente_id'),
		/** Gasto de una tarea del local (pintura, reparación de humedad…). */
		tareaLocalId: integer('tarea_local_id'),
		/** Ajuste de cuadre «vivo»: el saldo real de la cuenta ese día. El importe se recalcula solo. */
		cuadreSaldoCent: integer('cuadre_saldo_cent'),
		creado: creado()
	},
	(t) => [index('movimientos_fecha_idx').on(t.fecha), index('movimientos_vehiculo_idx').on(t.vehiculoId)]
);

// ─── Contabilidad ─────────────────────────────────────────────────────────────

/** Operaciones que se repiten cada mes: se convierten en movimientos reales al llegar su fecha. */
export const recurrentes = sqliteTable('recurrentes', {
	id: id(),
	concepto: text('concepto').notNull(),
	tipo: text('tipo', { enum: TIPOS_MOVIMIENTO }).notNull().default('gasto'),
	importeCent: integer('importe_cent').notNull(),
	ivaPct: integer('iva_pct').notNull().default(0),
	pago: text('pago', { enum: FORMAS_PAGO }).notNull().default('banco'),
	cuentaContable: text('cuenta_contable'),
	categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
	proveedor: text('proveedor'),
	/** Día del mes (si el mes es más corto, el último día). */
	dia: integer('dia').notNull().default(1),
	desde: text('desde').notNull(),
	hasta: text('hasta'),
	/** Última fecha ya convertida en movimiento: lo borrado a mano no se vuelve a crear. */
	ultimaGenerada: text('ultima_generada'),
	activo: bool('activo').notNull().default(true),
	creado: creado()
});

/** Plan de cuentas (PGC PYMES simplificado). Admite subcuentas libres: 5720001… */
export const cuentas = sqliteTable('cuentas', {
	codigo: text('codigo').primaryKey(),
	nombre: text('nombre').notNull(),
	descripcion: text('descripcion')
});

/** Asientos manuales. Los de movimientos, amortizaciones e IVA se derivan al vuelo. */
export const asientos = sqliteTable(
	'asientos',
	{
		id: id(),
		fecha: text('fecha').notNull(),
		concepto: text('concepto').notNull(),
		notas: text('notas'),
		creado: creado()
	},
	(t) => [index('asientos_fecha_idx').on(t.fecha)]
);

export const apuntes = sqliteTable(
	'apuntes',
	{
		id: id(),
		asientoId: integer('asiento_id')
			.notNull()
			.references(() => asientos.id, { onDelete: 'cascade' }),
		cuenta: text('cuenta').notNull(),
		debeCent: integer('debe_cent').notNull().default(0),
		haberCent: integer('haber_cent').notNull().default(0),
		orden: integer('orden').notNull().default(0)
	},
	(t) => [index('apuntes_asiento_idx').on(t.asientoId), index('apuntes_cuenta_idx').on(t.cuenta)]
);

/** Bienes amortizables del taller (elevador, compresor, furgoneta…). */
export const inmovilizado = sqliteTable('inmovilizado', {
	id: id(),
	nombre: text('nombre').notNull(),
	cuenta: text('cuenta').notNull().default('213'),
	fechaAlta: text('fecha_alta').notNull(),
	valorCent: integer('valor_cent').notNull(),
	valorResidualCent: integer('valor_residual_cent').notNull().default(0),
	vidaUtilMeses: integer('vida_util_meses').notNull().default(120),
	fechaBaja: text('fecha_baja'),
	movimientoId: integer('movimiento_id').references(() => movimientos.id, { onDelete: 'set null' }),
	notas: text('notas'),
	creado: creado()
});

// ─── Facturas ─────────────────────────────────────────────────────────────────

/** Facturas e informes de trabajos. Guardan una "foto" de los datos: no cambian si luego editas algo. */
export const facturas = sqliteTable(
	'facturas',
	{
		id: id(),
		tipo: text('tipo', { enum: ['factura', 'informe'] }).notNull().default('factura'),
		serie: text('serie').notNull(),
		anio: integer('anio').notNull(),
		numero: integer('numero').notNull(),
		fecha: text('fecha').notNull(),
		vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'set null' }),
		contactoId: integer('contacto_id').references(() => contactos.id, { onDelete: 'set null' }),
		cliente: text('cliente', { mode: 'json' }).$type<{ nombre: string; nif?: string | null; direccion?: string | null; email?: string | null; telefono?: string | null }>(),
		vehiculo: text('vehiculo', { mode: 'json' }).$type<{ alias: string; marca?: string | null; modelo?: string | null; anio?: number | null; matricula?: string | null; bastidor?: string | null }>(),
		km: integer('km'),
		lineas: text('lineas', { mode: 'json' }).$type<LineaFactura[]>().notNull().default([]),
		ivaPct: integer('iva_pct').notNull().default(21),
		baseCent: integer('base_cent').notNull().default(0),
		ivaCent: integer('iva_cent').notNull().default(0),
		totalCent: integer('total_cent').notNull().default(0),
		notas: text('notas'),
		entradas: text('entradas', { mode: 'json' }).$type<number[]>().notNull().default([]),
		/** Ingreso registrado al cobrarla. */
		movimientoId: integer('movimiento_id').references(() => movimientos.id, { onDelete: 'set null' }),
		anulada: bool('anulada').notNull().default(false),
		creado: creado()
	},
	(t) => [uniqueIndex('facturas_numero_idx').on(t.serie, t.anio, t.numero), index('facturas_vehiculo_idx').on(t.vehiculoId)]
);

// ─── Inventario ───────────────────────────────────────────────────────────────

export const TIPOS_ARTICULO = ['herramienta', 'recambio', 'consumible'] as const;
export type TipoArticulo = (typeof TIPOS_ARTICULO)[number];
export const ESTADOS_HERRAMIENTA = ['ok', 'reparar', 'prestada', 'perdida', 'baja'] as const;
export type EstadoHerramienta = (typeof ESTADOS_HERRAMIENTA)[number];

/** Herramientas, recambios y consumibles del taller. La cantidad sale de `stock`. */
// ─── El local: zonas del plano y muebles (dónde está cada cosa) ───────────────

/** Una zona del local dibujada en el plano (metros, con el origen en la esquina interior izquierda de la fachada). */
export const zonas = sqliteTable('zonas', {
	id: id(),
	/** Código corto que la identifica en los códigos de ubicación («Z1·E2·3»). */
	codigo: text('codigo').notNull().unique(),
	nombre: text('nombre').notNull(),
	color: text('color').notNull().default('#7c8aa0'),
	x: real('x').notNull(),
	y: real('y').notNull(),
	ancho: real('ancho').notNull(),
	alto: real('alto').notNull(),
	notas: text('notas'),
	orden: integer('orden').notNull().default(0),
	creado: creado()
});

export const TIPOS_MUEBLE = ['estanteria', 'armario', 'cajonera', 'panel', 'banco', 'carro', 'equipo', 'otro'] as const;
export type TipoMueble = (typeof TIPOS_MUEBLE)[number];

/** Un mueble colocado en el plano (estantería, cajonera, panel…) con sus baldas o cajones. */
export const muebles = sqliteTable('muebles', {
	id: id(),
	zonaId: integer('zona_id').references(() => zonas.id, { onDelete: 'set null' }),
	/** Único en todo el local: E1, C2, P1… */
	codigo: text('codigo').notNull().unique(),
	nombre: text('nombre').notNull(),
	tipo: text('tipo', { enum: TIPOS_MUEBLE }).notNull().default('estanteria'),
	x: real('x').notNull(),
	y: real('y').notNull(),
	ancho: real('ancho').notNull(),
	fondo: real('fondo').notNull(),
	/** Girado 90° en el plano. */
	girado: bool('girado').notNull().default(false),
	/** Baldas, cajones o filas (0 = sin niveles: un equipo, un hueco en el suelo). */
	niveles: integer('niveles').notNull().default(1),
	/** A medida: filas de distinto alto, partidas en cajones, huecos (null = todos los niveles iguales). `niveles` es su total. */
	disposicion: text('disposicion', { mode: 'json' }).$type<DisposicionMueble>(),
	notas: text('notas'),
	creado: creado()
});
export const TIPOS_CONTENEDOR = ['cubo', 'maletin', 'caja', 'bandeja', 'bolsa', 'mochila', 'otro'] as const;
export type TipoContenedor = (typeof TIPOS_CONTENEDOR)[number];

/** Un cubo, maletín o caja dentro de una balda: un sitio más pequeño con su letra (A, B, C… de izquierda a derecha). */
export const contenedores = sqliteTable(
	'contenedores',
	{
		id: id(),
		muebleId: integer('mueble_id')
			.notNull()
			.references(() => muebles.id, { onDelete: 'cascade' }),
		nivel: integer('nivel'),
		letra: text('letra').notNull(),
		nombre: text('nombre').notNull(),
		tipo: text('tipo', { enum: TIPOS_CONTENEDOR }).notNull().default('cubo'),
		// Sitio en la balda: 3 tercios a lo ancho × 3 alturas de caja baja (null = sin colocar: se reparten a lo ancho)
		/** Tercio desde la izquierda (1–3). */
		columna: integer('columna'),
		/** Cuántos tercios ocupa (1–3). */
		ancho: integer('ancho'),
		/** Alturas por debajo (0 = sobre la balda). */
		piso: integer('piso'),
		/** Alturas que ocupa: 1 caja baja, 2 alta, 3 toda la balda. */
		alto: integer('alto'),
		notas: text('notas'),
		creado: creado()
	},
	(t) => [uniqueIndex('contenedores_sitio_idx').on(t.muebleId, t.nivel, t.letra)]
);
export type Contenedor = typeof contenedores.$inferSelect;
export type Zona = typeof zonas.$inferSelect;
export type Mueble = typeof muebles.$inferSelect;

export const articulos = sqliteTable(
	'articulos',
	{
		id: id(),
		tipo: text('tipo', { enum: TIPOS_ARTICULO }).notNull().default('herramienta'),
		nombre: text('nombre').notNull(),
		marca: text('marca'),
		referencia: text('referencia'),
		categoria: text('categoria'),
		/** Detalle libre de dónde está (caja roja, hueco de la izquierda…); el sitio va en zona/mueble/nivel. */
		ubicacion: text('ubicacion'),
		zonaId: integer('zona_id').references(() => zonas.id, { onDelete: 'set null' }),
		muebleId: integer('mueble_id').references(() => muebles.id, { onDelete: 'set null' }),
		/** Balda, cajón o fila dentro del mueble: se numeran siempre de arriba a abajo (1 = la de arriba). */
		nivel: integer('nivel'),
		/** Cubo, maletín o caja de esa balda donde está guardado. */
		contenedorId: integer('contenedor_id').references(() => contenedores.id, { onDelete: 'set null' }),
		unidad: text('unidad').notNull().default('ud'),
		/** Por debajo de esto, a la lista de la compra. */
		stockMinimo: real('stock_minimo'),
		estado: text('estado', { enum: ESTADOS_HERRAMIENTA }).notNull().default('ok'),
		prestadaA: text('prestada_a'),
		/** Precio de compra unitario. */
		valorCent: integer('valor_cent'),
		fechaCompra: text('fecha_compra'),
		proveedor: text('proveedor'),
		numeroSerie: text('numero_serie'),
		/** Vehículos para los que sirve (recambios específicos). */
		vehiculoIds: text('vehiculo_ids', { mode: 'json' }).$type<number[]>().notNull().default([]),
		notas: text('notas'),
		portadaId: integer('portada_id'),
		/** Última vez que se comprobó en un recuento que estaba en su sitio. */
		ultimoRecuento: text('ultimo_recuento'),
		creado: creado()
	},
	(t) => [index('articulos_tipo_idx').on(t.tipo)]
);

/** Entradas y salidas de inventario. La cantidad de un artículo = suma de sus movimientos. */
export const stock = sqliteTable(
	'stock',
	{
		id: id(),
		articuloId: integer('articulo_id')
			.notNull()
			.references(() => articulos.id, { onDelete: 'cascade' }),
		fecha: text('fecha').notNull(),
		cantidad: real('cantidad').notNull(),
		motivo: text('motivo', { enum: ['alta', 'compra', 'uso', 'ajuste'] }).notNull(),
		/** Uso en una operación de un vehículo. */
		entradaId: integer('entrada_id').references(() => entradas.id, { onDelete: 'set null' }),
		/** Gasto de la compra. */
		movimientoId: integer('movimiento_id').references(() => movimientos.id, { onDelete: 'set null' }),
		tareaLocalId: integer('tarea_local_id'),
		notas: text('notas'),
		creado: creado()
	},
	(t) => [index('stock_articulo_idx').on(t.articuloId), index('stock_entrada_idx').on(t.entradaId)]
);

/** Cosas apuntadas a mano en la lista de la compra (las automáticas se calculan). */
export const listaCompra = sqliteTable('lista_compra', {
	id: id(),
	texto: text('texto').notNull(),
	cantidad: real('cantidad'),
	unidad: text('unidad'),
	/** Lo que se calcula que costará (total de la línea). */
	precioEstimadoCent: integer('precio_estimado_cent'),
	articuloId: integer('articulo_id').references(() => articulos.id, { onDelete: 'set null' }),
	vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'set null' }),
	/** Para qué es: una avería por reparar o una tarea del local. */
	pendienteId: integer('pendiente_id').references(() => pendientes.id, { onDelete: 'cascade' }),
	tareaLocalId: integer('tarea_local_id').references(() => tareasLocal.id, { onDelete: 'cascade' }),
	notas: text('notas'),
	comprado: bool('comprado').notNull().default(false),
	creado: creado()
});

// ─── Repostajes ───────────────────────────────────────────────────────────────

export const repostajes = sqliteTable(
	'repostajes',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		fecha: text('fecha').notNull(),
		km: integer('km'),
		litros: real('litros').notNull(),
		importeCent: integer('importe_cent').notNull(),
		/** Depósito lleno: el consumo real se mide entre dos llenados. */
		lleno: bool('lleno').notNull().default(true),
		gasolinera: text('gasolinera'),
		/** El gasto que se apuntó en la contabilidad. */
		movimientoId: integer('movimiento_id').references(() => movimientos.id, { onDelete: 'set null' }),
		creado: creado()
	},
	(t) => [index('repostajes_vehiculo_idx').on(t.vehiculoId, t.fecha)]
);

// ─── Uso de la app (métricas propias, para ver dónde hay fricción) ────────────

export const uso = sqliteTable(
	'uso',
	{
		id: id(),
		momento: text('momento').notNull().default(sql`(datetime('now'))`),
		/** Pestaña del navegador (para seguir un recorrido). */
		sesion: text('sesion'),
		/** Ruta normalizada: /flota/[id]?pestana=papeles */
		ruta: text('ruta'),
		/** vista, hoja_abierta, hoja_completada, hoja_abandonada, envio_ok, envio_error, accion_ok, accion_error, ticket_ok, ticket_error, ticket_revisado, error_js */
		evento: text('evento').notNull(),
		/** Qué: el título de la hoja, la acción del formulario… */
		nombre: text('nombre'),
		duracionMs: integer('duracion_ms'),
		datos: text('datos', { mode: 'json' }).$type<Record<string, unknown>>(),
		movil: bool('movil')
	},
	(t) => [index('uso_momento_idx').on(t.momento), index('uso_evento_idx').on(t.evento, t.momento)]
);

// ─── Local ────────────────────────────────────────────────────────────────────

export const ESTADOS_TAREA_LOCAL = ['pendiente', 'en_curso', 'hecha', 'descartada'] as const;
export type EstadoTareaLocal = (typeof ESTADOS_TAREA_LOCAL)[number];

/** Tareas del propio local: pintar, humedades, extintores… */
export const tareasLocal = sqliteTable('tareas_local', {
	id: id(),
	titulo: text('titulo').notNull(),
	/** Mantenimiento (gasto del año) o reforma (inversión: se reparte en varios años). */
	tipo: text('tipo', { enum: ['mantenimiento', 'reforma'] }).notNull().default('mantenimiento'),
	detalle: text('detalle'),
	zona: text('zona'),
	prioridad: text('prioridad', { enum: PRIORIDADES }).notNull().default('media'),
	estado: text('estado', { enum: ESTADOS_TAREA_LOCAL }).notNull().default('pendiente'),
	fechaLimite: text('fecha_limite'),
	fechaHecha: text('fecha_hecha'),
	/** Si se repite: al hacerla se crea la siguiente dentro de N meses. */
	cadaMeses: integer('cada_meses'),
	pasos: text('pasos', { mode: 'json' }).$type<{ texto: string; hecho: boolean }[]>().notNull().default([]),
	creado: creado()
});

// ─── Archivos ─────────────────────────────────────────────────────────────────


export const ENTIDADES_ADJUNTO = ['vehiculo', 'entrada', 'vencimiento', 'movimiento', 'restauracion', 'ajuste', 'pendiente', 'articulo', 'local'] as const;
export type EntidadAdjunto = (typeof ENTIDADES_ADJUNTO)[number];

export const adjuntos = sqliteTable(
	'adjuntos',
	{
		id: id(),
		clave: text('clave').notNull().unique(),
		nombre: text('nombre').notNull(),
		mime: text('mime').notNull(),
		bytes: integer('bytes').notNull(),
		entidad: text('entidad', { enum: ENTIDADES_ADJUNTO }).notNull(),
		entidadId: integer('entidad_id').notNull(),
		/** Vehículo al que pertenece (para la galería), aunque cuelgue de una entrada, etc. */
		vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'cascade' }),
		pie: text('pie'),
		creado: creado()
	},
	(t) => [index('adjuntos_entidad_idx').on(t.entidad, t.entidadId), index('adjuntos_vehiculo_idx').on(t.vehiculoId)]
);

// ─── Avisos ───────────────────────────────────────────────────────────────────

export const avisosEnviados = sqliteTable('avisos_enviados', {
	clave: text('clave').primaryKey(),
	enviado: creado()
});

export type TipoVehiculo = typeof tiposVehiculo.$inferSelect;
export type Estado = typeof estados.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type TipoVencimiento = typeof tiposVencimiento.$inferSelect;
export type PlanMantenimiento = typeof planesMantenimiento.$inferSelect;
export type PlantillaFases = typeof plantillasFases.$inferSelect;
export type Contacto = typeof contactos.$inferSelect;
export type Vehiculo = typeof vehiculos.$inferSelect;
export type LecturaKm = typeof lecturasKm.$inferSelect;
export type Vencimiento = typeof vencimientos.$inferSelect;
export type Restauracion = typeof restauraciones.$inferSelect;
export type Fase = typeof fases.$inferSelect;
export type Tarea = typeof tareas.$inferSelect;
export type Entrada = typeof entradas.$inferSelect;
export type Movimiento = typeof movimientos.$inferSelect;
export type Adjunto = typeof adjuntos.$inferSelect;
export type Cuenta = typeof cuentas.$inferSelect;
export type AsientoManual = typeof asientos.$inferSelect;
export type ApunteManual = typeof apuntes.$inferSelect;
export type Inmovilizado = typeof inmovilizado.$inferSelect;
export type Recurrente = typeof recurrentes.$inferSelect;
export type Pendiente = typeof pendientes.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
export type Articulo = typeof articulos.$inferSelect;
export type MovimientoStock = typeof stock.$inferSelect;
export type ItemCompra = typeof listaCompra.$inferSelect;
export type TareaLocal = typeof tareasLocal.$inferSelect;
export type Repostaje = typeof repostajes.$inferSelect;

// ─── Bot de Telegram ──────────────────────────────────────────────────────────

/** Lo que el bot creó en la app, para poder deshacerlo. */
export interface HechoBot {
	t: 'repostaje' | 'movimiento' | 'entrada' | 'pendiente' | 'tarea_local' | 'compra' | 'km' | 'gasto_personal' | 'mover_contenedor' | 'mover_articulo';
	id: number;
	/** Al mover algo: dónde estaba (para deshacerlo). */
	antes?: Record<string, unknown>;
}

export const ESTADOS_BOT = ['esperando', 'hecha', 'deshecha', 'cancelada'] as const;
export type EstadoBot = (typeof ESTADOS_BOT)[number];

/** Cada mensaje que el bot convierte en acción (o que espera a que elijas el vehículo). */
export const botAcciones = sqliteTable('bot_acciones', {
	id: id(),
	/** Lo que entendió (la intención y extras: foto del ticket, notas…). */
	orden: text('orden', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
	hecho: text('hecho', { mode: 'json' }).$type<HechoBot[]>().notNull().default([]),
	estado: text('estado', { enum: ESTADOS_BOT }).notNull().default('esperando'),
	creado: creado()
});

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export interface PreferenciasUsuario {
	tema?: 'oscuro' | 'claro' | 'sistema';
	acento?: string;
	/** Qué le manda el bot cada mañana: el parte, solo los avisos de vencimientos o nada. */
	avisos?: 'parte' | 'umbrales' | 'ninguno';
	resumenSemanal?: boolean;
}

/** Quién entra (por su email de Cloudflare Access) y qué puede ver. */
export const usuarios = sqliteTable('usuarios', {
	id: id(),
	email: text('email').notNull().unique(),
	nombre: text('nombre').notNull(),
	/** Áreas que puede ver y tocar (vehiculos, inventario, local, dinero, ajustes). */
	permisos: text('permisos', { mode: 'json' }).$type<string[]>().notNull().default([]),
	/** Su chat de Telegram: el bot le hace caso y le manda su parte, con solo lo suyo. */
	telegramChatId: text('telegram_chat_id'),
	/** Obsoleto (ya no se usa): ahora los vehículos son del taller o privados de su dueño, y los privados de otros se ven en solo lectura. */
	alcance: text('alcance', { enum: ['todos', 'suyos'] }).notNull().default('todos'),
	/** Sus preferencias: apariencia (tema, color) y notificaciones (parte diario, solo avisos o nada; resumen de los lunes). */
	preferencias: text('preferencias', { mode: 'json' }).$type<PreferenciasUsuario>().notNull().default({}),
	activo: bool('activo').notNull().default(true),
	creado: creado()
});
export type Usuario = typeof usuarios.$inferSelect;

export const CATEGORIAS_GASTO_SIMPLE = ['combustible', 'mantenimiento', 'reparacion', 'seguro', 'itv', 'impuestos', 'otros'] as const;
export type CategoriaGastoSimple = (typeof CATEGORIAS_GASTO_SIMPLE)[number];

/** La libreta de gastos de un usuario con sus propios vehículos: sencilla y aparte de la contabilidad del taller. */
export const gastosPersonales = sqliteTable(
	'gastos_personales',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		usuarioId: integer('usuario_id')
			.notNull()
			.references(() => usuarios.id, { onDelete: 'cascade' }),
		fecha: text('fecha').notNull(),
		concepto: text('concepto').notNull(),
		categoria: text('categoria', { enum: CATEGORIAS_GASTO_SIMPLE }).notNull().default('otros'),
		importeCent: integer('importe_cent').notNull(),
		km: integer('km'),
		litros: real('litros'),
		/** Entrada del historial a la que corresponde (un mantenimiento, una reparación). */
		entradaId: integer('entrada_id').references(() => entradas.id, { onDelete: 'set null' }),
		notas: text('notas'),
		creado: creado()
	},
	(t) => [index('gastos_personales_vehiculo_idx').on(t.vehiculoId, t.fecha)]
);
export type GastoPersonal = typeof gastosPersonales.$inferSelect;

// ─── Ficha técnica y procedimientos (nuestro manual) ──────────────────────────

/** Un dato técnico de un vehículo (aceite, presiones, pares…), verificado o pendiente de comprobar. */
export const datosTecnicos = sqliteTable(
	'datos_tecnicos',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		seccion: text('seccion').notNull().default('otros'),
		clave: text('clave').notNull(),
		nombre: text('nombre').notNull(),
		valor: text('valor').notNull(),
		unidad: text('unidad'),
		detalle: text('detalle'),
		/** De dónde sale: «Manual, pág. 34», «Pegatina del vano», «IA (sin verificar)»… */
		fuente: text('fuente'),
		verificado: bool('verificado').notNull().default(false),
		actualizado: text('actualizado').notNull().default(sql`(datetime('now'))`),
		creado: creado()
	},
	(t) => [uniqueIndex('datos_tecnicos_clave_idx').on(t.vehiculoId, t.clave)]
);
export type DatoTecnico = typeof datosTecnicos.$inferSelect;

/** Un procedimiento propio paso a paso (cambio de aceite, purgar frenos…), con sus herramientas y pares. */
export const procedimientos = sqliteTable(
	'procedimientos',
	{
		id: id(),
		vehiculoId: integer('vehiculo_id')
			.notNull()
			.references(() => vehiculos.id, { onDelete: 'cascade' }),
		titulo: text('titulo').notNull(),
		tiempoMin: integer('tiempo_min'),
		herramientas: text('herramientas', { mode: 'json' }).$type<string[]>().notNull().default([]),
		pasos: text('pasos', { mode: 'json' }).$type<{ texto: string; par?: string | null; foto?: string | null }[]>().notNull().default([]),
		/** Entrada del diario de la que salió (con sus fotos). */
		entradaId: integer('entrada_id').references(() => entradas.id, { onDelete: 'set null' }),
		notas: text('notas'),
		creado: creado()
	},
	(t) => [index('procedimientos_vehiculo_idx').on(t.vehiculoId)]
);
export type Procedimiento = typeof procedimientos.$inferSelect;
