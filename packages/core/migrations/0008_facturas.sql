CREATE TABLE `facturas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text DEFAULT 'factura' NOT NULL,
	`serie` text NOT NULL,
	`anio` integer NOT NULL,
	`numero` integer NOT NULL,
	`fecha` text NOT NULL,
	`vehiculo_id` integer,
	`contacto_id` integer,
	`cliente` text,
	`vehiculo` text,
	`km` integer,
	`lineas` text DEFAULT '[]' NOT NULL,
	`iva_pct` integer DEFAULT 21 NOT NULL,
	`base_cent` integer DEFAULT 0 NOT NULL,
	`iva_cent` integer DEFAULT 0 NOT NULL,
	`total_cent` integer DEFAULT 0 NOT NULL,
	`notas` text,
	`entradas` text DEFAULT '[]' NOT NULL,
	`movimiento_id` integer,
	`anulada` integer DEFAULT false NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facturas_numero_idx` ON `facturas` (`serie`,`anio`,`numero`);--> statement-breakpoint
CREATE INDEX `facturas_vehiculo_idx` ON `facturas` (`vehiculo_id`);--> statement-breakpoint
ALTER TABLE `contactos` ADD `nif` text;--> statement-breakpoint
ALTER TABLE `contactos` ADD `direccion` text;