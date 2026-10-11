ALTER TABLE `tareas_local` ADD `tipo` text DEFAULT 'mantenimiento' NOT NULL;--> statement-breakpoint
-- Reformas del local: inversión (cuenta 215, Otras instalaciones), se amortiza en varios años
INSERT INTO `categorias` (`nombre`, `tipo`, `color`, `cuenta_contable`, `iva_pct`, `orden`)
SELECT 'Reformas del local', 'gasto', '#b98a56', '215', 21, 21
WHERE NOT EXISTS (SELECT 1 FROM `categorias` WHERE `nombre` = 'Reformas del local');
