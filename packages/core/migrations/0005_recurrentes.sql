CREATE TABLE `recurrentes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concepto` text NOT NULL,
	`tipo` text DEFAULT 'gasto' NOT NULL,
	`importe_cent` integer NOT NULL,
	`iva_pct` integer DEFAULT 0 NOT NULL,
	`pago` text DEFAULT 'banco' NOT NULL,
	`cuenta_contable` text,
	`categoria_id` integer,
	`proveedor` text,
	`dia` integer DEFAULT 1 NOT NULL,
	`desde` text NOT NULL,
	`hasta` text,
	`ultima_generada` text,
	`activo` integer DEFAULT true NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `movimientos` ADD `recurrente_id` integer;