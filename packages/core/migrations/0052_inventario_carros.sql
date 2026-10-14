-- Inventario de los carros C2 y C3 (lo que el usuario fue encontrando). Idempotente: por el nombre.
-- Los tres DeWalt de prueba pasan a ser los modelos reales.
--> statement-breakpoint
UPDATE `articulos` SET `nombre` = 'Llave de impacto DeWalt DCF899 1/2" 18V' WHERE `nombre` = 'Taladro percutor DeWalt (el grande)' AND NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de impacto DeWalt DCF899 1/2" 18V');
--> statement-breakpoint
UPDATE `articulos` SET `nombre` = 'Taladro percutor DeWalt DCD778 18V' WHERE `nombre` = 'Taladro atornillador DeWalt compacto' AND NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Taladro percutor DeWalt DCD778 18V');
--> statement-breakpoint
UPDATE `articulos` SET `nombre` = 'Llave de impacto compacta DeWalt DCF921 1/2" 18V' WHERE `nombre` = 'Atornillador de impacto DeWalt' AND NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de impacto compacta DeWalt DCF921 1/2" 18V');
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de impacto DeWalt DCF899 1/2" 18V', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de impacto DeWalt DCF899 1/2" 18V');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'DeWalt', `referencia` = 'DCF899', `categoria` = 'Eléctrica', `unidad` = 'ud', `notas` = '18V XR sin escobillas. 950 Nm de apriete, 1625 Nm de aflojado.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de impacto DeWalt DCF899 1/2" 18V';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de impacto DeWalt DCF899 1/2" 18V' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Taladro percutor DeWalt DCD778 18V', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Taladro percutor DeWalt DCD778 18V');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'DeWalt', `referencia` = 'DCD778', `categoria` = 'Eléctrica', `unidad` = 'ud', `notas` = '18V XR compacto, portabrocas 13 mm. 65 Nm (duro) / 26 Nm (blando).', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Taladro percutor DeWalt DCD778 18V';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Taladro percutor DeWalt DCD778 18V' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de impacto compacta DeWalt DCF921 1/2" 18V', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de impacto compacta DeWalt DCF921 1/2" 18V');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'DeWalt', `referencia` = 'DCF921', `categoria` = 'Eléctrica', `unidad` = 'ud', `notas` = '18V XR sin escobillas. ~406 Nm de apriete, ~610 Nm de aflojado.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de impacto compacta DeWalt DCF921 1/2" 18V';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de impacto compacta DeWalt DCF921 1/2" 18V' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Cargador DeWalt DCB113', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Cargador DeWalt DCB113');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'DeWalt', `referencia` = 'DCB113', `categoria` = 'Eléctrica', `unidad` = 'ud', `notas` = 'Para baterías XR de 10,8 a 18V.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Cargador DeWalt DCB113';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Cargador DeWalt DCB113' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Batería DeWalt 18V 1,5 Ah', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Batería DeWalt 18V 1,5 Ah');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'DeWalt', `referencia` = 'DCB181', `categoria` = 'Eléctrica', `unidad` = 'ud', `notas` = 'XR 18V 1,5 Ah. Referencia a confirmar en la pegatina.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Batería DeWalt 18V 1,5 Ah';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 2, 'alta' FROM `articulos` WHERE `nombre` = 'Batería DeWalt 18V 1,5 Ah' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego llaves combinadas de carraca articuladas Facom', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego llaves combinadas de carraca articuladas Facom');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Facom', `referencia` = '467BF', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Cabeza articulada, 72 dientes. Probablemente MOD.467BFJ12PB (12 llaves de 8 a 19 mm), a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego llaves combinadas de carraca articuladas Facom';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego llaves combinadas de carraca articuladas Facom' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego llaves Allen Wera Hex-Plus (1,5-10 mm)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego llaves Allen Wera Hex-Plus (1,5-10 mm)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Wera', `referencia` = '950 PKL/9 SM N', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = '9 llaves de 1,5 a 10 mm (ref. 05073391001). A confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego llaves Allen Wera Hex-Plus (1,5-10 mm)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego llaves Allen Wera Hex-Plus (1,5-10 mm)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego llaves Torx Wera (TX8-TX40)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego llaves Torx Wera (TX8-TX40)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Wera', `referencia` = '967 SPKL/9', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = '9 llaves de TX8 a TX40 (ref. 05073599001). A confirmar si es la versión BO (con agujero, para Torx de seguridad).', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego llaves Torx Wera (TX8-TX40)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego llaves Torx Wera (TX8-TX40)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego llaves Allen en T Facom 84TZSA (3-4-5-6-7-8-10 mm)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego llaves Allen en T Facom 84TZSA (3-4-5-6-7-8-10 mm)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Facom', `referencia` = 'MOD.84TZSAPB', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Punta esférica. Sueltas, sin soporte.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego llaves Allen en T Facom 84TZSA (3-4-5-6-7-8-10 mm)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 7, 'alta' FROM `articulos` WHERE `nombre` = 'Juego llaves Allen en T Facom 84TZSA (3-4-5-6-7-8-10 mm)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Lámpara de taller 230 V', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Lámpara de taller 230 V');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Eléctrica', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C3'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C3'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Lámpara de taller 230 V';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Lámpara de taller 230 V' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Tijeras de manualidades', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tijeras de manualidades');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tijeras de manualidades';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tijeras de manualidades' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Cúter de hoja ancha 18 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Cúter de hoja ancha 18 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = 'Básicos.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Cúter de hoja ancha 18 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 3, 'alta' FROM `articulos` WHERE `nombre` = 'Cúter de hoja ancha 18 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Desbarbador de tubos', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Desbarbador de tubos');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = 'Con cuchillas de recambio.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Desbarbador de tubos';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Desbarbador de tubos' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Rasqueta Wisent', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Rasqueta Wisent');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Wisent', `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Rasqueta Wisent';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Rasqueta Wisent' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Hojas de cúter 18 mm (recambio)', 'ok', 'paquete' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Hojas de cúter 18 mm (recambio)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'paquete', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Hojas de cúter 18 mm (recambio)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 2, 'alta' FROM `articulos` WHERE `nombre` = 'Hojas de cúter 18 mm (recambio)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Cuchillas de recambio rasqueta Wisent', 'ok', 'paquete' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Cuchillas de recambio rasqueta Wisent');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = 'Wisent', `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'paquete', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Cuchillas de recambio rasqueta Wisent';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Cuchillas de recambio rasqueta Wisent' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Rotulador de pintura rojo', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Rotulador de pintura rojo');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Marcado', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Rotulador de pintura rojo';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Rotulador de pintura rojo' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Marcador de pintura Fixolid', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Marcador de pintura Fixolid');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = 'Fixolid', `referencia` = NULL, `categoria` = 'Marcado', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Marcador de pintura Fixolid';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Marcador de pintura Fixolid' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Marcador de cera amarillo', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Marcador de cera amarillo');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Marcado', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Marcador de cera amarillo';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Marcador de cera amarillo' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Soldadura en frío para plástico (2 componentes)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Soldadura en frío para plástico (2 componentes)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Adhesivos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Soldadura en frío para plástico (2 componentes)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Soldadura en frío para plástico (2 componentes)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Tipp-Ex corrector en bote', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tipp-Ex corrector en bote');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = 'Tipp-Ex', `referencia` = NULL, `categoria` = 'Marcado', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tipp-Ex corrector en bote';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tipp-Ex corrector en bote' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Agujas de limpieza de carburador', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Agujas de limpieza de carburador');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Agujas de limpieza de carburador';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Agujas de limpieza de carburador' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Cepillos de limpieza de carburador', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Cepillos de limpieza de carburador');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Cepillos de limpieza de carburador';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Cepillos de limpieza de carburador' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Pinzas', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Pinzas');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Manual', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Pinzas';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Pinzas' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Destornillador acodado', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Destornillador acodado');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Destornillador acodado';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Destornillador acodado' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Sacapines (botador)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Sacapines (botador)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Manual', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Sacapines (botador)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Sacapines (botador)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Mando de la alarma Ajax', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Mando de la alarma Ajax');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Ajax', `referencia` = NULL, `categoria` = 'Local', `unidad` = 'ud', `notas` = 'Mando de la alarma del local.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Mando de la alarma Ajax';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Mando de la alarma Ajax' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave descodificadora grupo VAG', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave descodificadora grupo VAG');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = 'HU66', `categoria` = 'Cerrajería', `unidad` = 'ud', `notas` = 'Perfil HU66 a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave descodificadora grupo VAG';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave descodificadora grupo VAG' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Protector de llanta para desmontar', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Protector de llanta para desmontar');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Protector de llanta para desmontar';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 4, 'alta' FROM `articulos` WHERE `nombre` = 'Protector de llanta para desmontar' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Desmontable de neumático 12"', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Desmontable de neumático 12"');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Desmontable de neumático 12"';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 3, 'alta' FROM `articulos` WHERE `nombre` = 'Desmontable de neumático 12"' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Desmontable de neumático grande', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Desmontable de neumático grande');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Desmontable de neumático grande';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Desmontable de neumático grande' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Tira-válvulas (útil para montar válvulas)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tira-válvulas (útil para montar válvulas)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tira-válvulas (útil para montar válvulas)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tira-válvulas (útil para montar válvulas)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Contrapesos adhesivos negros para equilibrado', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Contrapesos adhesivos negros para equilibrado');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Contrapesos adhesivos negros para equilibrado';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Contrapesos adhesivos negros para equilibrado' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Candado transparente de práctica de ganzúas', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Candado transparente de práctica de ganzúas');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Cerrajería', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Candado transparente de práctica de ganzúas';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Candado transparente de práctica de ganzúas' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Engrasador de cables de moto', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Engrasador de cables de moto');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Moto', `unidad` = 'ud', `notas` = 'Para cables de acelerador y embrague.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Engrasador de cables de moto';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Engrasador de cables de moto' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego brocas Bosch madera (3-4-5-6-7-8-10 mm)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego brocas Bosch madera (3-4-5-6-7-8-10 mm)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Bosch', `referencia` = NULL, `categoria` = 'Brocas', `unidad` = 'ud', `notas` = '7 brocas.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego brocas Bosch madera (3-4-5-6-7-8-10 mm)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego brocas Bosch madera (3-4-5-6-7-8-10 mm)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego brocas Bosch piedra (4-5-6-6-7-8-10 mm)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego brocas Bosch piedra (4-5-6-6-7-8-10 mm)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Bosch', `referencia` = NULL, `categoria` = 'Brocas', `unidad` = 'ud', `notas` = '7 brocas (dos de 6).', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego brocas Bosch piedra (4-5-6-6-7-8-10 mm)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego brocas Bosch piedra (4-5-6-6-7-8-10 mm)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego brocas Bosch HSS metal 1-10 mm (19 pzas, de 0,5 en 0,5)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego brocas Bosch HSS metal 1-10 mm (19 pzas, de 0,5 en 0,5)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Bosch', `referencia` = '2608577351', `categoria` = 'Brocas', `unidad` = 'ud', `notas` = 'PointTeQ, DIN 338, punta 135°, en estuche: 1-1,5-2-2,5-3-3,5-4-4,5-5-5,5-6-6,5-7-7,5-8-8,5-9-9,5-10 mm.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego brocas Bosch HSS metal 1-10 mm (19 pzas, de 0,5 en 0,5)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego brocas Bosch HSS metal 1-10 mm (19 pzas, de 0,5 en 0,5)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Medidor de espesor de pintura PCE-CT 25FN', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Medidor de espesor de pintura PCE-CT 25FN');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'PCE', `referencia` = 'PCE-CT 25FN', `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = 'Sensor Fe/NFe (acero y aluminio).', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Medidor de espesor de pintura PCE-CT 25FN';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Medidor de espesor de pintura PCE-CT 25FN' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Galga de bujías', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Galga de bujías');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Galga de bujías';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Galga de bujías' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Peine de roscas métrico 60°', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Peine de roscas métrico 60°');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Peine de roscas métrico 60°';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Peine de roscas métrico 60°' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Peine de roscas Whitworth 55°', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Peine de roscas Whitworth 55°');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Peine de roscas Whitworth 55°';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Peine de roscas Whitworth 55°' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Comprobador de chispa de bobinas', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Comprobador de chispa de bobinas');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = 'Tipo bujía con distancia regulable.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Comprobador de chispa de bobinas';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Comprobador de chispa de bobinas' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Escuadra 25 cm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Escuadra 25 cm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Escuadra 25 cm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Escuadra 25 cm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Escuadra 30 cm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Escuadra 30 cm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Escuadra 30 cm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Escuadra 30 cm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Pie de rey manual 150 mm Dexter', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Pie de rey manual 150 mm Dexter');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Dexter', `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Pie de rey manual 150 mm Dexter';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Pie de rey manual 150 mm Dexter' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Pie de rey digital 150 mm Alpha Tools', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Pie de rey digital 150 mm Alpha Tools');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Alpha Tools', `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Pie de rey digital 150 mm Alpha Tools';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Pie de rey digital 150 mm Alpha Tools' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Pie de rey electrónico Limit', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Pie de rey electrónico Limit');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Limit', `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = '150 mm, a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Pie de rey electrónico Limit';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Pie de rey electrónico Limit' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Micrómetro de exteriores 0-25 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Micrómetro de exteriores 0-25 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Micrómetro de exteriores 0-25 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Micrómetro de exteriores 0-25 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Transportador de ángulos Dexter', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Transportador de ángulos Dexter');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Dexter', `referencia` = NULL, `categoria` = 'Medición', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Transportador de ángulos Dexter';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Transportador de ángulos Dexter' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Comprobador de humedad del líquido de frenos', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Comprobador de humedad del líquido de frenos');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = 'Electrónico.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Comprobador de humedad del líquido de frenos';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Comprobador de humedad del líquido de frenos' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Termómetro de infrarrojos ST390+', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Termómetro de infrarrojos ST390+');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = 'ST390+', `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = 'De −50 a 390 °C.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Termómetro de infrarrojos ST390+';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Termómetro de infrarrojos ST390+' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Abocardador de tubos de freno', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Abocardador de tubos de freno');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Frenos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Abocardador de tubos de freno';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Abocardador de tubos de freno' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'recambio', 'Racores macho de freno M10x1', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Racores macho de freno M10x1');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'recambio', `marca` = NULL, `referencia` = 'M10x1', `categoria` = 'Frenos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Racores macho de freno M10x1';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Racores macho de freno M10x1' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'recambio', 'Racores hembra de freno M10x1', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Racores hembra de freno M10x1');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'recambio', `marca` = NULL, `referencia` = 'M10x1', `categoria` = 'Frenos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Racores hembra de freno M10x1';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Racores hembra de freno M10x1' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'recambio', 'Tubo de cobre para frenos 4,75 mm (3/16")', 'ok', 'm' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tubo de cobre para frenos 4,75 mm (3/16")');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'recambio', `marca` = NULL, `referencia` = NULL, `categoria` = 'Frenos', `unidad` = 'm', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tubo de cobre para frenos 4,75 mm (3/16")';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 3, 'alta' FROM `articulos` WHERE `nombre` = 'Tubo de cobre para frenos 4,75 mm (3/16")' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Curvadora de tubos de cobre', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Curvadora de tubos de cobre');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Frenos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Curvadora de tubos de cobre';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Curvadora de tubos de cobre' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Bici: útil de cassette', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bici: útil de cassette');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Bici', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Bici: útil de cassette';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Bici: útil de cassette' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Bici: alicates de eslabón rápido', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bici: alicates de eslabón rápido');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Bici', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Bici: alicates de eslabón rápido';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Bici: alicates de eslabón rápido' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'recambio', 'Bici: eslabón rápido de cadena', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bici: eslabón rápido de cadena');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'recambio', `marca` = NULL, `referencia` = NULL, `categoria` = 'Bici', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Bici: eslabón rápido de cadena';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 2, 'alta' FROM `articulos` WHERE `nombre` = 'Bici: eslabón rápido de cadena' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Bici: desmontable de cubierta', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bici: desmontable de cubierta');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Bici', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Bici: desmontable de cubierta';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 2, 'alta' FROM `articulos` WHERE `nombre` = 'Bici: desmontable de cubierta' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Bici: kit de purgado de frenos hidráulicos', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bici: kit de purgado de frenos hidráulicos');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Bici', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 7, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Bici: kit de purgado de frenos hidráulicos';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Bici: kit de purgado de frenos hidráulicos' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Pasta de esmerilar válvulas fina', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Pasta de esmerilar válvulas fina');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Pasta de esmerilar válvulas fina';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Pasta de esmerilar válvulas fina' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Pasta de esmerilar válvulas gruesa', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Pasta de esmerilar válvulas gruesa');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = NULL, `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Pasta de esmerilar válvulas gruesa';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Pasta de esmerilar válvulas gruesa' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Esmerilador de válvulas de ventosa fino', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Esmerilador de válvulas de ventosa fino');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = 'Palo con ventosa doble.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Esmerilador de válvulas de ventosa fino';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Esmerilador de válvulas de ventosa fino' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Esmerilador de válvulas de ventosa grueso', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Esmerilador de válvulas de ventosa grueso');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = 'Palo con ventosa doble.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Esmerilador de válvulas de ventosa grueso';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Esmerilador de válvulas de ventosa grueso' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Comprobador de inyectores de gasolina 12 V', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Comprobador de inyectores de gasolina 12 V');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = 'CNBJ 620', `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = 'Pulsos cortos, medios, largos y continuos.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Comprobador de inyectores de gasolina 12 V';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Comprobador de inyectores de gasolina 12 V' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Kit de pastillas de reglaje de válvulas Hot Cams', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Kit de pastillas de reglaje de válvulas Hot Cams');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Hot Cams', `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = 'Honda, Kawasaki y Suzuki. Diámetro probablemente 7,48 mm. Usado en una Suzuki GSR y una Hyosung Comet.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Kit de pastillas de reglaje de válvulas Hot Cams';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Kit de pastillas de reglaje de válvulas Hot Cams' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Útil de horquilla 41 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Útil de horquilla 41 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Moto', `unidad` = 'ud', `notas` = 'Introductor de retenes, a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 8, `contenedor_id` = NULL, `ubicacion` = NULL, `vehiculo_ids` = CASE WHEN (SELECT CASE WHEN COUNT(*) = 1 THEN MAX(`id`) END FROM `vehiculos` WHERE lower(`alias`) LIKE '%bandit%' OR `modelo` LIKE '%GSF%') IS NOT NULL THEN json_array((SELECT CASE WHEN COUNT(*) = 1 THEN MAX(`id`) END FROM `vehiculos` WHERE lower(`alias`) LIKE '%bandit%' OR `modelo` LIKE '%GSF%')) ELSE `vehiculo_ids` END WHERE `nombre` = 'Útil de horquilla 41 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Útil de horquilla 41 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave dinamométrica Teng Tools 1/4" 5-25 Nm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave dinamométrica Teng Tools 1/4" 5-25 Nm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Teng Tools', `referencia` = '1492AG-E', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Con escala de ángulo. Referencia a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 9, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave dinamométrica Teng Tools 1/4" 5-25 Nm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave dinamométrica Teng Tools 1/4" 5-25 Nm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave dinamométrica Teng Tools 3/8" 20-110 Nm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave dinamométrica Teng Tools 3/8" 20-110 Nm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Teng Tools', `referencia` = '3892AG-E3', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Referencia a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 9, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave dinamométrica Teng Tools 3/8" 20-110 Nm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave dinamométrica Teng Tools 3/8" 20-110 Nm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave dinamométrica Facom J.209-50 3/8" 10-50 Nm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave dinamométrica Facom J.209-50 3/8" 10-50 Nm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Facom', `referencia` = 'J.209-50', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = '±4 %.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 9, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave dinamométrica Facom J.209-50 3/8" 10-50 Nm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave dinamométrica Facom J.209-50 3/8" 10-50 Nm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Comprobador de baterías Ancel BA201', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Comprobador de baterías Ancel BA201');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Ancel', `referencia` = 'BA201', `categoria` = 'Medición y diagnóstico', `unidad` = 'ud', `notas` = '12 V.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C2'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C2'), `nivel` = 9, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Comprobador de baterías Ancel BA201';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Comprobador de baterías Ancel BA201' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Mango articulado (breaker bar) BGS 267 1/2" 610 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Mango articulado (breaker bar) BGS 267 1/2" 610 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = '267', `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Sin sitio todavía.', `mueble_id` = NULL, `zona_id` = NULL, `nivel` = NULL, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Mango articulado (breaker bar) BGS 267 1/2" 610 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Mango articulado (breaker bar) BGS 267 1/2" 610 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
