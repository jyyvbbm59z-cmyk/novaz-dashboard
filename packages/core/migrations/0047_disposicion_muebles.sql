ALTER TABLE `muebles` ADD `disposicion` text;--> statement-breakpoint
-- C1: carro Jomafa, 4 cajones pequeños (de espuma) y 2 grandes
UPDATE `muebles` SET `tipo` = 'carro', `nombre` = 'Carro de herramientas Jomafa', `niveles` = 6,
	`disposicion` = '{"filas":[{"alto":1,"cajones":1},{"alto":1,"cajones":1},{"alto":1,"cajones":1},{"alto":1,"cajones":1},{"alto":2,"cajones":1},{"alto":2,"cajones":1}],"nivel":"cajón"}'
WHERE `codigo` = 'C1' AND `disposicion` IS NULL;
--> statement-breakpoint
-- C2: cofre (fila 1 partida en izquierdo, central y derecho; 2.ª y 3.ª enteras; 4.ª doble) sobre el carro (2 cajones dobles y un hueco triple)
UPDATE `muebles` SET `tipo` = 'carro', `nombre` = 'Carro de herramientas con cofre', `niveles` = 9,
	`disposicion` = '{"filas":[{"alto":1,"cajones":3},{"alto":1,"cajones":1},{"alto":1,"cajones":1},{"alto":2,"cajones":1},{"alto":2,"cajones":1,"aparte":true},{"alto":2,"cajones":1},{"alto":3,"cajones":1,"hueco":true}],"nivel":"cajón"}'
WHERE `codigo` = 'C2' AND `disposicion` IS NULL;
--> statement-breakpoint
-- Lo que estuviera en un cajón que ya no existe se queda en el carro, sin cajón
UPDATE `articulos` SET `nivel` = NULL WHERE `mueble_id` IN (SELECT `id` FROM `muebles` WHERE `codigo` IN ('C1', 'C2')) AND `nivel` > (SELECT `niveles` FROM `muebles` WHERE `muebles`.`id` = `articulos`.`mueble_id`);
--> statement-breakpoint
UPDATE `contenedores` SET `nivel` = NULL WHERE `mueble_id` IN (SELECT `id` FROM `muebles` WHERE `codigo` IN ('C1', 'C2')) AND `nivel` > (SELECT `niveles` FROM `muebles` WHERE `muebles`.`id` = `contenedores`.`mueble_id`);
--> statement-breakpoint
-- C3: Råskog de Ikea, 3 cestas, para llevar herramienta de un sitio a otro (se mueve arrastrándolo en el plano)
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`, `disposicion`)
SELECT (SELECT `id` FROM `zonas` WHERE `codigo` = 'Z1'), 'C3', 'Carro Råskog', 'carro', 3.0, 5.55, 0.45, 0.35, 0, 3,
	'{"filas":[{"alto":1,"cajones":1},{"alto":1,"cajones":1},{"alto":1,"cajones":1}],"nivel":"cesta"}'
WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `codigo` = 'C3');
