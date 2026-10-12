CREATE TABLE `gastos_personales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehiculo_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`concepto` text NOT NULL,
	`categoria` text DEFAULT 'otros' NOT NULL,
	`importe_cent` integer NOT NULL,
	`km` integer,
	`litros` real,
	`entrada_id` integer,
	`notas` text,
	`creado` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entrada_id`) REFERENCES `entradas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `gastos_personales_vehiculo_idx` ON `gastos_personales` (`vehiculo_id`,`fecha`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nombre` text NOT NULL,
	`permisos` text DEFAULT '[]' NOT NULL,
	`telegram_chat_id` text,
	`alcance` text DEFAULT 'todos' NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);--> statement-breakpoint
ALTER TABLE `vehiculos` ADD `usuario_id` integer;