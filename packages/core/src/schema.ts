import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { CampoDef, FasePlantilla } from './campos';
import type { LineaFactura } from './facturacion';

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
	nombre: text('nombre').notNull(),
	cadaKm: integer('cada_km'),
	cadaMeses: integer('cada_meses'),
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

export const CLASES_ENTRADA = ['mantenimiento', 'reparacion', 'diario', 'nota'] as const;
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

// ─── Archivos ─────────────────────────────────────────────────────────────────


export const ENTIDADES_ADJUNTO = ['vehiculo', 'entrada', 'vencimiento', 'movimiento', 'restauracion', 'ajuste', 'pendiente'] as const;
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
