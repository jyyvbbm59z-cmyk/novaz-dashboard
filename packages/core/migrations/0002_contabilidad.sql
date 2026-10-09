CREATE TABLE `apuntes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asiento_id` integer NOT NULL,
	`cuenta` text NOT NULL,
	`debe_cent` integer DEFAULT 0 NOT NULL,
	`haber_cent` integer DEFAULT 0 NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`asiento_id`) REFERENCES `asientos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `apuntes_asiento_idx` ON `apuntes` (`asiento_id`);--> statement-breakpoint
CREATE INDEX `apuntes_cuenta_idx` ON `apuntes` (`cuenta`);--> statement-breakpoint
CREATE TABLE `asientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`concepto` text NOT NULL,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `asientos_fecha_idx` ON `asientos` (`fecha`);--> statement-breakpoint
CREATE TABLE `cuentas` (
	`codigo` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text
);
--> statement-breakpoint
CREATE TABLE `inmovilizado` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`cuenta` text DEFAULT '213' NOT NULL,
	`fecha_alta` text NOT NULL,
	`valor_cent` integer NOT NULL,
	`valor_residual_cent` integer DEFAULT 0 NOT NULL,
	`vida_util_meses` integer DEFAULT 120 NOT NULL,
	`fecha_baja` text,
	`movimiento_id` integer,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `categorias` ADD `iva_pct` integer DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE `movimientos` ADD `iva_pct` integer DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE `movimientos` ADD `pago` text DEFAULT 'banco' NOT NULL;--> statement-breakpoint
ALTER TABLE `movimientos` ADD `cuenta_contable` text;