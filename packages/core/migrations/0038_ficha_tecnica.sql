CREATE TABLE `datos_tecnicos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`seccion` text DEFAULT 'otros' NOT NULL,
	`clave` text NOT NULL,
	`nombre` text NOT NULL,
	`valor` text NOT NULL,
	`unidad` text,
	`detalle` text,
	`fuente` text,
	`verificado` integer DEFAULT false NOT NULL,
	`actualizado` text DEFAULT (datetime('now')) NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `datos_tecnicos_clave_idx` ON `datos_tecnicos` (`vehiculo_id`,`clave`);--> statement-breakpoint
CREATE TABLE `procedimientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`titulo` text NOT NULL,
	`tiempo_min` integer,
	`herramientas` text DEFAULT '[]' NOT NULL,
	`pasos` text DEFAULT '[]' NOT NULL,
	`entrada_id` integer,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entrada_id`) REFERENCES `entradas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `procedimientos_vehiculo_idx` ON `procedimientos` (`vehiculo_id`);