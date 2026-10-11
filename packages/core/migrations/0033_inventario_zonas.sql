CREATE TABLE `muebles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zona_id` integer,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text DEFAULT 'estanteria' NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`ancho` real NOT NULL,
	`fondo` real NOT NULL,
	`girado` integer DEFAULT false NOT NULL,
	`niveles` integer DEFAULT 1 NOT NULL,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`zona_id`) REFERENCES `zonas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `muebles_codigo_unique` ON `muebles` (`codigo`);--> statement-breakpoint
CREATE TABLE `zonas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`color` text DEFAULT '#7c8aa0' NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`ancho` real NOT NULL,
	`alto` real NOT NULL,
	`notas` text,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `zonas_codigo_unique` ON `zonas` (`codigo`);--> statement-breakpoint
ALTER TABLE `articulos` ADD `zona_id` integer REFERENCES zonas(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `articulos` ADD `mueble_id` integer REFERENCES muebles(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `articulos` ADD `nivel` integer;--> statement-breakpoint
-- Zonas de partida del local (según el plano); se pueden cambiar desde la app
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`)
SELECT * FROM (VALUES
	('A', 'Bahía delantera', '#4f86c6', 0, 0, 3.62, 7.96, 'Vehículo en trabajo, junto a la entrada', 0),
	('B', 'Bahía del fondo', '#5aa17f', 0, 7.96, 3.62, 7.0, 'Restauraciones largas', 1),
	('C', 'Banco de trabajo', '#d08c3a', 3.62, 0, 3.61, 4.39, 'Banco, tornillo y lo que se usa a diario', 2),
	('D', 'Herramientas', '#c45d5d', 3.62, 4.39, 3.61, 3.97, 'Paneles y cajoneras, a mano de las dos bahías', 3),
	('E', 'Almacén', '#8a6fbf', 3.62, 8.36, 3.61, 3.54, 'Recambios y piezas desmontadas', 4),
	('F', 'Limpieza y pintura', '#3fa6a6', 3.62, 11.9, 3.61, 3.06, 'Junto a la puerta del fondo (ventila)', 5),
	('G', 'Cuarto trasero', '#9a8f6a', 3.83, 15.18, 3.4, 1.25, 'Consumibles y químicos', 6)
) WHERE NOT EXISTS (SELECT 1 FROM `zonas`);
