CREATE TABLE `adjuntos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clave` text NOT NULL,
	`nombre` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`entidad` text NOT NULL,
	`entidad_id` integer NOT NULL,
	`vehiculo_id` integer,
	`pie` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adjuntos_clave_unique` ON `adjuntos` (`clave`);--> statement-breakpoint
CREATE INDEX `adjuntos_entidad_idx` ON `adjuntos` (`entidad`,`entidad_id`);--> statement-breakpoint
CREATE INDEX `adjuntos_vehiculo_idx` ON `adjuntos` (`vehiculo_id`);--> statement-breakpoint
CREATE TABLE `ajustes` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text
);
--> statement-breakpoint
CREATE TABLE `avisos_enviados` (
	`clave` text PRIMARY KEY NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text DEFAULT 'gasto' NOT NULL,
	`color` text DEFAULT '#8a8f98' NOT NULL,
	`cuenta_contable` text,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contactos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`telefono` text,
	`email` text,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entradas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`clase` text DEFAULT 'nota' NOT NULL,
	`fecha` text NOT NULL,
	`km` integer,
	`titulo` text NOT NULL,
	`texto` text,
	`horas` real,
	`plan_id` integer,
	`restauracion_id` integer,
	`fase_id` integer,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `planes_mantenimiento`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`restauracion_id`) REFERENCES `restauraciones`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`fase_id`) REFERENCES `fases`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `entradas_vehiculo_idx` ON `entradas` (`vehiculo_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `entradas_plan_idx` ON `entradas` (`plan_id`);--> statement-breakpoint
CREATE TABLE `estados` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`color` text DEFAULT '#8a8f98' NOT NULL,
	`final` integer DEFAULT false NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restauracion_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`fecha_fin` text,
	FOREIGN KEY (`restauracion_id`) REFERENCES `restauraciones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fases_restauracion_idx` ON `fases` (`restauracion_id`);--> statement-breakpoint
CREATE TABLE `lecturas_km` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`km` integer NOT NULL,
	`origen` text DEFAULT 'manual' NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lecturas_vehiculo_idx` ON `lecturas_km` (`vehiculo_id`,`fecha`);--> statement-breakpoint
CREATE TABLE `movimientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`tipo` text DEFAULT 'gasto' NOT NULL,
	`importe_cent` integer NOT NULL,
	`categoria_id` integer,
	`concepto` text NOT NULL,
	`proveedor` text,
	`vehiculo_id` integer,
	`entrada_id` integer,
	`vencimiento_id` integer,
	`restauracion_id` integer,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`entrada_id`) REFERENCES `entradas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vencimiento_id`) REFERENCES `vencimientos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`restauracion_id`) REFERENCES `restauraciones`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `movimientos_fecha_idx` ON `movimientos` (`fecha`);--> statement-breakpoint
CREATE INDEX `movimientos_vehiculo_idx` ON `movimientos` (`vehiculo_id`);--> statement-breakpoint
CREATE TABLE `planes_mantenimiento` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`cada_km` integer,
	`cada_meses` integer,
	`tipo_vehiculo_id` integer,
	`vehiculo_id` integer,
	`aviso_km` integer DEFAULT 500 NOT NULL,
	`aviso_dias` integer DEFAULT 30 NOT NULL,
	`notas` text,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`tipo_vehiculo_id`) REFERENCES `tipos_vehiculo`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plantillas_fases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`fases` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `restauraciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`fecha_inicio` text,
	`fecha_fin` text,
	`presupuesto_cent` integer,
	`estado` text DEFAULT 'en_curso' NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tareas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fase_id` integer NOT NULL,
	`titulo` text NOT NULL,
	`hecha` integer DEFAULT false NOT NULL,
	`horas_estimadas` real,
	`orden` integer DEFAULT 0 NOT NULL,
	`fecha_hecha` text,
	FOREIGN KEY (`fase_id`) REFERENCES `fases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tareas_fase_idx` ON `tareas` (`fase_id`);--> statement-breakpoint
CREATE TABLE `tipos_vehiculo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`icono` text DEFAULT 'car-front' NOT NULL,
	`campos` text DEFAULT '[]' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tipos_vencimiento` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`icono` text DEFAULT 'calendar-clock' NOT NULL,
	`meses_validez` integer,
	`avisos_dias` text DEFAULT '[30,7,1]' NOT NULL,
	`tipos_vehiculo_ids` text DEFAULT '[]' NOT NULL,
	`categoria_id` integer,
	`orden` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `vehiculos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo_id` integer NOT NULL,
	`alias` text NOT NULL,
	`marca` text,
	`modelo` text,
	`anio` integer,
	`matricula` text,
	`bastidor` text,
	`estado_id` integer,
	`propietario` text DEFAULT 'novaz' NOT NULL,
	`contacto_id` integer,
	`fecha_alta` text,
	`notas` text,
	`campos` text DEFAULT '{}' NOT NULL,
	`portada_id` integer,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	`actualizado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tipo_id`) REFERENCES `tipos_vehiculo`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`estado_id`) REFERENCES `estados`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `vehiculos_tipo_idx` ON `vehiculos` (`tipo_id`);--> statement-breakpoint
CREATE INDEX `vehiculos_estado_idx` ON `vehiculos` (`estado_id`);--> statement-breakpoint
CREATE TABLE `vencimientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`tipo_id` integer NOT NULL,
	`fecha_inicio` text,
	`fecha_vence` text NOT NULL,
	`proveedor` text,
	`referencia` text,
	`importe_cent` integer,
	`notas` text,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tipo_id`) REFERENCES `tipos_vencimiento`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vencimientos_vehiculo_idx` ON `vencimientos` (`vehiculo_id`);--> statement-breakpoint
CREATE INDEX `vencimientos_fecha_idx` ON `vencimientos` (`estado`,`fecha_vence`);