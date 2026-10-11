CREATE TABLE `uso` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`momento` text DEFAULT (datetime('now')) NOT NULL,
	`sesion` text,
	`ruta` text,
	`evento` text NOT NULL,
	`nombre` text,
	`duracion_ms` integer,
	`datos` text,
	`movil` integer
);
--> statement-breakpoint
CREATE INDEX `uso_momento_idx` ON `uso` (`momento`);--> statement-breakpoint
CREATE INDEX `uso_evento_idx` ON `uso` (`evento`,`momento`);