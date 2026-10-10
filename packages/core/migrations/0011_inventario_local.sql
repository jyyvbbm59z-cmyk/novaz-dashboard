CREATE TABLE `articulos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text DEFAULT 'herramienta' NOT NULL,
	`nombre` text NOT NULL,
	`marca` text,
	`referencia` text,
	`categoria` text,
	`ubicacion` text,
	`unidad` text DEFAULT 'ud' NOT NULL,
	`stock_minimo` real,
	`estado` text DEFAULT 'ok' NOT NULL,
	`prestada_a` text,
	`valor_cent` integer,
	`fecha_compra` text,
	`proveedor` text,
	`numero_serie` text,
	`vehiculo_ids` text DEFAULT '[]' NOT NULL,
	`notas` text,
	`portada_id` integer,
	`ultimo_recuento` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `articulos_tipo_idx` ON `articulos` (`tipo`);--> statement-breakpoint
CREATE TABLE `lista_compra` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`texto` text NOT NULL,
	`cantidad` real,
	`unidad` text,
	`articulo_id` integer,
	`vehiculo_id` integer,
	`notas` text,
	`comprado` integer DEFAULT false NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`articulo_id`) REFERENCES `articulos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`articulo_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`cantidad` real NOT NULL,
	`motivo` text NOT NULL,
	`entrada_id` integer,
	`movimiento_id` integer,
	`tarea_local_id` integer,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`articulo_id`) REFERENCES `articulos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entrada_id`) REFERENCES `entradas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `stock_articulo_idx` ON `stock` (`articulo_id`);--> statement-breakpoint
CREATE INDEX `stock_entrada_idx` ON `stock` (`entrada_id`);--> statement-breakpoint
CREATE TABLE `tareas_local` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`detalle` text,
	`zona` text,
	`prioridad` text DEFAULT 'media' NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`fecha_limite` text,
	`fecha_hecha` text,
	`cada_meses` integer,
	`pasos` text DEFAULT '[]' NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `movimientos` ADD `tarea_local_id` integer;--> statement-breakpoint
ALTER TABLE `vehiculos` ADD `valor_estimado_cent` integer;