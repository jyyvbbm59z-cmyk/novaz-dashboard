CREATE TABLE `bot_acciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orden` text NOT NULL,
	`hecho` text DEFAULT '[]' NOT NULL,
	`estado` text DEFAULT 'esperando' NOT NULL,
	`creado` text DEFAULT (datetime('now')) NOT NULL
);
