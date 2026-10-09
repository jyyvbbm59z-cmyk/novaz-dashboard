CREATE TABLE `entradas_planes` (
	`entrada_id` integer NOT NULL,
	`plan_id` integer NOT NULL,
	PRIMARY KEY(`entrada_id`, `plan_id`),
	FOREIGN KEY (`entrada_id`) REFERENCES `entradas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `planes_mantenimiento`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entradas_planes_plan_idx` ON `entradas_planes` (`plan_id`);--> statement-breakpoint
-- Los enlaces que ya existían pasan a la tabla nueva
INSERT INTO `entradas_planes` (`entrada_id`, `plan_id`) SELECT `id`, `plan_id` FROM `entradas` WHERE `plan_id` IS NOT NULL;
