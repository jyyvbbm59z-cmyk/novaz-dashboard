-- El local según el croquis: zonas nuevas (Entrada, Pintura y madera, Z1, Z2, Electrónica, Limpieza)
-- y los muebles con sus códigos. Lo ya colocado conserva su mueble y pasa a la zona nueva equivalente.
--> statement-breakpoint
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`) SELECT 'EN', 'Entrada', '#4f86c6', 0, 0, 3.82, 4.59, 'Junto a la persiana', 0 WHERE NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'EN');
--> statement-breakpoint
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`) SELECT 'PM', 'Pintura y madera', '#d08c3a', 3.82, 0, 3.41, 4.59, NULL, 1 WHERE NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'PM');
--> statement-breakpoint
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`) SELECT 'Z1', 'Z1', '#5aa17f', 0, 4.59, 3.82, 7.11, NULL, 2 WHERE NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'Z1');
--> statement-breakpoint
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`) SELECT 'Z2', 'Z2', '#c45d5d', 3.82, 4.59, 3.41, 7.11, NULL, 3 WHERE NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'Z2');
--> statement-breakpoint
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`) SELECT 'EL', 'Electrónica', '#8a6fbf', 0, 11.7, 3.82, 3.26, 'Cuarto con tabiques', 4 WHERE NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'EL');
--> statement-breakpoint
INSERT INTO `zonas` (`codigo`, `nombre`, `color`, `x`, `y`, `ancho`, `alto`, `notas`, `orden`) SELECT 'LI', 'Limpieza', '#3fa6a6', 3.82, 11.7, 3.41, 3.26, NULL, 5 WHERE NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'LI');
--> statement-breakpoint
UPDATE `zonas` SET `codigo` = 'CT', `orden` = 6 WHERE `codigo` = 'G' AND NOT EXISTS (SELECT 1 FROM `zonas` WHERE `codigo` = 'CT');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'EN') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'A');
--> statement-breakpoint
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'EN') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'A');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'B');
--> statement-breakpoint
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'B');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'C');
--> statement-breakpoint
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'C');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z2') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'D');
--> statement-breakpoint
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z2') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'D');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z2') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'E');
--> statement-breakpoint
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z2') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'E');
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'LI') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'F');
--> statement-breakpoint
UPDATE `muebles` SET `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'LI') WHERE `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'F');
--> statement-breakpoint
DELETE FROM `zonas` WHERE `codigo` IN ('A', 'B', 'C', 'D', 'E', 'F');
--> statement-breakpoint
-- Muebles del croquis: si ya existe ese código se recoloca (conserva nombre, baldas y contenido); si no, se crea
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'armario', `x` = 5.95, `y` = 0.2, `ancho` = 1.0, `fondo` = 0.5, `girado` = 0, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM') WHERE `codigo` = 'A1';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM'), 'A1', 'Armario', 'armario', 5.95, 0.2, 1.0, 0.5, 0, 4 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'A1');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'banco', `x` = 4.05, `y` = 0.3, `ancho` = 1.85, `fondo` = 0.7, `girado` = 0, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM') WHERE `codigo` = 'B1';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM'), 'B1', 'Banco de trabajo', 'banco', 4.05, 0.3, 1.85, 0.7, 0, 3 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'B1');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'panel', `x` = 7.11, `y` = 0.8, `ancho` = 2.4, `fondo` = 0.12, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM') WHERE `codigo` = 'P3';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'PM'), 'P3', 'Panel de pared', 'panel', 7.11, 0.8, 2.4, 0.12, 1, 4 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'P3');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'panel', `x` = 0, `y` = 4.95, `ancho` = 2.8, `fondo` = 0.12, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'P2';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'P2', 'Panel de pared', 'panel', 0, 4.95, 2.8, 0.12, 1, 4 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'P2');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'panel', `x` = 0, `y` = 8.55, `ancho` = 2.6, `fondo` = 0.12, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'P1';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'P1', 'Panel de pared', 'panel', 0, 8.55, 2.6, 0.12, 1, 4 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'P1');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'banco', `x` = 0.45, `y` = 10.9, `ancho` = 2.0, `fondo` = 0.7, `girado` = 0, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'B2';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'B2', 'Banco de trabajo', 'banco', 0.45, 10.9, 2.0, 0.7, 0, 3 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'B2');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'cajonera', `x` = 3.59, `y` = 5.5, `ancho` = 0.8, `fondo` = 0.46, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'C2';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'C2', 'Cajonera', 'cajonera', 3.59, 5.5, 0.8, 0.46, 1, 7 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'C2');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'cajonera', `x` = 3.59, `y` = 6.75, `ancho` = 0.8, `fondo` = 0.46, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'C1';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'C1', 'Cajonera', 'cajonera', 3.59, 6.75, 0.8, 0.46, 1, 7 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'C1');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'estanteria', `x` = 3.6, `y` = 8.7, `ancho` = 0.8, `fondo` = 0.45, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'E3';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'E3', 'Estantería', 'estanteria', 3.6, 8.7, 0.8, 0.45, 1, 5 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'E3');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'estanteria', `x` = 3.6, `y` = 9.55, `ancho` = 0.8, `fondo` = 0.45, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'E2';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'E2', 'Estantería', 'estanteria', 3.6, 9.55, 0.8, 0.45, 1, 5 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'E2');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'estanteria', `x` = 3.6, `y` = 10.4, `ancho` = 0.8, `fondo` = 0.45, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1') WHERE `codigo` = 'E1';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'E1', 'Estantería', 'estanteria', 3.6, 10.4, 0.8, 0.45, 1, 5 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'E1');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'estanteria', `x` = 3.92, `y` = 14.51, `ancho` = 0.85, `fondo` = 0.45, `girado` = 0, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'LI') WHERE `codigo` = 'E4';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'LI'), 'E4', 'Estantería', 'estanteria', 3.92, 14.51, 0.85, 0.45, 0, 5 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'E4');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'banco', `x` = 6.53, `y` = 12.45, `ancho` = 2.3, `fondo` = 0.7, `girado` = 1, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'LI') WHERE `codigo` = 'B3';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'LI'), 'B3', 'Banco de trabajo', 'banco', 6.53, 12.45, 2.3, 0.7, 1, 3 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'B3');
--> statement-breakpoint
UPDATE `muebles` SET `tipo` = 'banco', `x` = 0.6, `y` = 14.26, `ancho` = 2.6, `fondo` = 0.7, `girado` = 0, `zona_id` = (SELECT `id` FROM `zonas` WHERE `codigo` = 'EL') WHERE `codigo` = 'B4';
--> statement-breakpoint
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`) SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'EL'), 'B4', 'Banco de trabajo', 'banco', 0.6, 14.26, 2.6, 0.7, 0, 3 WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'B4');
--> statement-breakpoint
-- Lo que esté en un mueble, en la zona de su mueble
--> statement-breakpoint
UPDATE `articulos` SET `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `muebles`.`id` = `articulos`.`mueble_id`) WHERE `mueble_id` IS NOT NULL;
