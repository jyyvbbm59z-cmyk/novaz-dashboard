-- Ajustes del plano tras repasar el croquis:
-- E1–E3 dan a Z2 (las cajoneras C1–C2 siguen en Z1); paneles más gruesos para que se lean; CT es el baño.
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z2') WHERE `codigo` IN ('E1', 'E2', 'E3') AND EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'Z2');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `muebles`.`id` = `articulos`.`mueble_id`) WHERE `mueble_id` IN (SELECT `id` FROM `muebles` WHERE `codigo` IN ('E1', 'E2', 'E3'));
--> statement-breakpoint
UPDATE `muebles` SET `fondo` = 0.25 WHERE `codigo` IN ('P1', 'P2', 'P3') AND `fondo` < 0.25;
--> statement-breakpoint
UPDATE `muebles` SET `x` = 6.98 WHERE `codigo` = 'P3' AND `x` = 7.11;
--> statement-breakpoint
UPDATE `zonas` SET `codigo` = 'BA', `nombre` = 'Baño', `notas` = 'Puerta corredera' WHERE `codigo` = 'CT' AND NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'BA');
