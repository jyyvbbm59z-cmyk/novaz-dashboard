CREATE TABLE `pendientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`titulo` text NOT NULL,
	`detalle` text,
	`prioridad` text DEFAULT 'media' NOT NULL,
	`fecha_detectado` text NOT NULL,
	`km_detectado` integer,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`fecha_cierre` text,
	`entrada_id` integer,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entrada_id`) REFERENCES `entradas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pendientes_vehiculo_idx` ON `pendientes` (`vehiculo_id`,`estado`);