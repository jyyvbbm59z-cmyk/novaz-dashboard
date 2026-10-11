CREATE TABLE `contenedores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mueble_id` integer NOT NULL,
	`nivel` integer,
	`letra` text NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text DEFAULT 'cubo' NOT NULL,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`mueble_id`) REFERENCES `muebles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contenedores_sitio_idx` ON `contenedores` (`mueble_id`,`nivel`,`letra`);--> statement-breakpoint
ALTER TABLE `articulos` ADD `contenedor_id` integer REFERENCES contenedores(id) ON DELETE SET NULL;