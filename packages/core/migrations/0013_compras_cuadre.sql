ALTER TABLE `lista_compra` ADD `pendiente_id` integer REFERENCES pendientes(id) ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `lista_compra` ADD `tarea_local_id` integer REFERENCES tareas_local(id) ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `movimientos` ADD `cuadre_saldo_cent` integer;--> statement-breakpoint
-- Los ajustes de cuadre ya hechos pasan a ser «vivos»: guardan el saldo real que se tecleó
UPDATE `movimientos` SET `cuadre_saldo_cent` = CAST(ROUND(CAST(substr(`notas`, instr(`notas`, '(') + 1, instr(`notas`, ' €)') - instr(`notas`, '(') - 1) AS REAL) * 100) AS INTEGER)
WHERE `notas` LIKE 'Ajuste para cuadrar con el saldo real (%€)';
