CREATE TABLE `repostajes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`km` integer,
	`litros` real NOT NULL,
	`importe_cent` integer NOT NULL,
	`lleno` integer DEFAULT true NOT NULL,
	`gasolinera` text,
	`movimiento_id` integer,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `repostajes_vehiculo_idx` ON `repostajes` (`vehiculo_id`,`fecha`);