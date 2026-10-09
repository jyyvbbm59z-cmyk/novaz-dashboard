ALTER TABLE `entradas` ADD `checklist` text;--> statement-breakpoint
ALTER TABLE `planes_mantenimiento` ADD `codigo` text;--> statement-breakpoint
ALTER TABLE `planes_mantenimiento` ADD `cada_dias` integer;--> statement-breakpoint
ALTER TABLE `planes_mantenimiento` ADD `tareas` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `planes_mantenimiento` ADD `incluye` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `planes_mantenimiento` ADD `orden` integer DEFAULT 0 NOT NULL;