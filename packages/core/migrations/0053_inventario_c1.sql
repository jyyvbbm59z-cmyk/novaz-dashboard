-- Inventario del carro C1 (Jomafa), cajones 1 a 6. Idempotente: por el nombre.
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de vasos 1/4", 3/8" y 1/2" (bandeja C1)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de vasos 1/4", 3/8" y 1/2" (bandeja C1)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Bandeja de espuma: vasos 1/4" 4–14, 3/8" 8–24 y 1/2" hasta 32; 3 carracas (1/4", 3/8", 1/2"), alargos, cardanes, barra T deslizante, mango giratorio y todos los adaptadores 1/4↔3/8↔1/2. Faltan los vasos de 1/2" del 16 al 19.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de vasos 1/4", 3/8" y 1/2" (bandeja C1)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de vasos 1/4", 3/8" y 1/2" (bandeja C1)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Carraca Facom 1/4"', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Carraca Facom 1/4"');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Facom', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Carraca Facom 1/4"';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Carraca Facom 1/4"' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Vasos E-Torx Matador 1/2" (E10, E12, E14, E16, E18)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Vasos E-Torx Matador 1/2" (E10, E12, E14, E16, E18)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Matador', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Super Chrom.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Vasos E-Torx Matador 1/2" (E10, E12, E14, E16, E18)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 5, 'alta' FROM `articulos` WHERE `nombre` = 'Vasos E-Torx Matador 1/2" (E10, E12, E14, E16, E18)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Vaso Proxxon 32 mm 1/2"', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Vaso Proxxon 32 mm 1/2"');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Proxxon', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Vaso Proxxon 32 mm 1/2"';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Vaso Proxxon 32 mm 1/2"' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alargador largo articulado 1/2"', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alargador largo articulado 1/2"');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alargador largo articulado 1/2"';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alargador largo articulado 1/2"' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de llaves combinadas de carraca 8–22 mm (bandeja C1)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de llaves combinadas de carraca 8–22 mm (bandeja C1)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = '8 a 19, 21 y 22 mm (el juego no trae la de 20).', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de llaves combinadas de carraca 8–22 mm (bandeja C1)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de llaves combinadas de carraca 8–22 mm (bandeja C1)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de vasos largos 1/4" 4–12 mm (bandeja C1)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de vasos largos 1/4" 4–12 mm (bandeja C1)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de vasos largos 1/4" 4–12 mm (bandeja C1)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de vasos largos 1/4" 4–12 mm (bandeja C1)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de puntas (bandeja C1): Allen, planas, PZ, PH y Torx', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de puntas (bandeja C1): Allen, planas, PZ, PH y Torx');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = 'Allen HW3–8, planas SL3–6, PZ1–3, PH1–3, Torx T8–T40.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de puntas (bandeja C1): Allen, planas, PZ, PH y Torx';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de puntas (bandeja C1): Allen, planas, PZ, PH y Torx' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Puntas Izar PH2 25 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Puntas Izar PH2 25 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = 'Izar', `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = 'DIN 3126, 1/4" C6,3.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Puntas Izar PH2 25 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 5, 'alta' FROM `articulos` WHERE `nombre` = 'Puntas Izar PH2 25 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'consumible', 'Puntas Izar PZ2 25 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Puntas Izar PZ2 25 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'consumible', `marca` = 'Izar', `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = 'DIN 3126, 1/4" C6,3.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Puntas Izar PZ2 25 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 5, 'alta' FROM `articulos` WHERE `nombre` = 'Puntas Izar PZ2 25 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Puntas Torx de 5 puntas (TS) magnéticas T27–T50', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Puntas Torx de 5 puntas (TS) magnéticas T27–T50');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = '8 piezas, en bolsa.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Puntas Torx de 5 puntas (TS) magnéticas T27–T50';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Puntas Torx de 5 puntas (TS) magnéticas T27–T50' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de bujías tubular', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de bujías tubular');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de bujías tubular';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de bujías tubular' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de tubo hexagonal', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de tubo hexagonal');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de tubo hexagonal';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de tubo hexagonal' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de cuadradillo Southco', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de cuadradillo Southco');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Southco', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Para cierres de paneles.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de cuadradillo Southco';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de cuadradillo Southco' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave contrasoporte de amortiguador BGS 1301', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave contrasoporte de amortiguador BGS 1301');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = '1301', `categoria` = 'Suspensión', `unidad` = 'ud', `notas` = 'Sujeta el vástago al aflojar la tuerca superior. Espigas ovaladas 5×8 y 6×9 mm, 182 mm.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave contrasoporte de amortiguador BGS 1301';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave contrasoporte de amortiguador BGS 1301' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Rodillo para aislante (tipo Kaiflex)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Rodillo para aislante (tipo Kaiflex)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Carrocería', `unidad` = 'ud', `notas` = 'Mango de madera. Para aislante térmico/acústico del vehículo.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Rodillo para aislante (tipo Kaiflex)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Rodillo para aislante (tipo Kaiflex)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de destornilladores PH y planos (bandeja C1)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de destornilladores PH y planos (bandeja C1)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = 'PH0×75, PH1×100, PH2×38, PH2×100, PH3×150, PH3×200, SL3×75, SL5×100, SL6×38, SL6×100, SL6×150, SL8×175. El SL3×75 no está en su hueco.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de destornilladores PH y planos (bandeja C1)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de destornilladores PH y planos (bandeja C1)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de llaves Allen en T H2–H6 (bandeja C1)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de llaves Allen en T H2–H6 (bandeja C1)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'H2×100, H2,5×100, H3×100, H4×150, H5×150, H6×150.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de llaves Allen en T H2–H6 (bandeja C1)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de llaves Allen en T H2–H6 (bandeja C1)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave en T de vaso Bahco', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave en T de vaso Bahco');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Bahco', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave en T de vaso Bahco';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave en T de vaso Bahco' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'otro', 'Cordón recordatorio de candado de disco de moto', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Cordón recordatorio de candado de disco de moto');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'otro', `marca` = NULL, `referencia` = NULL, `categoria` = 'Moto', `unidad` = 'ud', `notas` = 'Espiral amarillo.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Cordón recordatorio de candado de disco de moto';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Cordón recordatorio de candado de disco de moto' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Palanca metálica para desmontar interiores', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Palanca metálica para desmontar interiores');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Carrocería', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Palanca metálica para desmontar interiores';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Palanca metálica para desmontar interiores' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de alicates de circlips (bandeja C1)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de alicates de circlips (bandeja C1)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Alicates', `unidad` = 'ud', `notas` = 'Exteriores e interiores, rectos y acodados (4).', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de alicates de circlips (bandeja C1)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de alicates de circlips (bandeja C1)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates de punta larga', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates de punta larga');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Alicates', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates de punta larga';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates de punta larga' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates de corte diagonal', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates de corte diagonal');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Alicates', `unidad` = 'ud', `notas` = 'Genéricos; uno rojo/azul de gran palanca.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates de corte diagonal';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 3, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates de corte diagonal' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates de corte inclinado', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates de corte inclinado');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Alicates', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates de corte inclinado';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates de corte inclinado' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Tijeras multiuso de electricista', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tijeras multiuso de electricista');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tijeras multiuso de electricista';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tijeras multiuso de electricista' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Tijeras de podar Dexter', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tijeras de podar Dexter');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Dexter', `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tijeras de podar Dexter';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tijeras de podar Dexter' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Tijeras de podar Finder', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tijeras de podar Finder');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Finder', `referencia` = NULL, `categoria` = 'Corte', `unidad` = 'ud', `notas` = 'Gris, palanca compuesta.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Tijeras de podar Finder';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tijeras de podar Finder' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates BGS para retenes de válvula', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates BGS para retenes de válvula');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = '8668', `categoria` = 'Motor', `unidad` = 'ud', `notas` = 'Mordazas largas para sacar retenes de válvula. Referencia probable (270 mm), a confirmar; la de 250 mm es la 1780.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates BGS para retenes de válvula';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates BGS para retenes de válvula' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates de presión Stanley', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates de presión Stanley');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Stanley', `referencia` = NULL, `categoria` = 'Alicates', `unidad` = 'ud', `notas` = 'Mordaza curva.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates de presión Stanley';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates de presión Stanley' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Palanca de plástico para desmontar tapicería', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Palanca de plástico para desmontar tapicería');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Carrocería', `unidad` = 'ud', `notas` = 'Naranja.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 4, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Palanca de plástico para desmontar tapicería';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Palanca de plástico para desmontar tapicería' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de vasos XZN BGS 1/2" M5–M16', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de vasos XZN BGS 1/2" M5–M16');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = 'Multidiente (12 puntas), en raíl.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de vasos XZN BGS 1/2" M5–M16';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de vasos XZN BGS 1/2" M5–M16' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Kit de vasos XZN Norauto M5–M12 (cortos y largos)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Kit de vasos XZN Norauto M5–M12 (cortos y largos)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Norauto', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Kit de vasos XZN Norauto M5–M12 (cortos y largos)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Kit de vasos XZN Norauto M5–M12 (cortos y largos)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave inglesa Facom 12"', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave inglesa Facom 12"');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Facom', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave inglesa Facom 12"';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave inglesa Facom 12"' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave inglesa Facom 15"', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave inglesa Facom 15"');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Facom', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave inglesa Facom 15"';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave inglesa Facom 15"' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates para abrazaderas de cable flexible', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates para abrazaderas de cable flexible');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Alicates', `unidad` = 'ud', `notas` = 'Con cable telescópico.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates para abrazaderas de cable flexible';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates para abrazaderas de cable flexible' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Revienta-tuercas Matador', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Revienta-tuercas Matador');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Matador', `referencia` = NULL, `categoria` = 'Manual', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Revienta-tuercas Matador';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Revienta-tuercas Matador' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave dinamométrica electrónica SHAHE 1/2" 10–340 Nm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave dinamométrica electrónica SHAHE 1/2" 10–340 Nm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'SHAHE', `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave dinamométrica electrónica SHAHE 1/2" 10–340 Nm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave dinamométrica electrónica SHAHE 1/2" 10–340 Nm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Útil para retraer pistones de pinza de freno', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Útil para retraer pistones de pinza de freno');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Frenos', `unidad` = 'ud', `notas` = 'Para meter pastillas nuevas.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Útil para retraer pistones de pinza de freno';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Útil para retraer pistones de pinza de freno' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave fija 30 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave fija 30 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave fija 30 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave fija 30 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave fija 36 mm', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave fija 36 mm');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Llaves y vasos', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 5, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave fija 36 mm';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave fija 36 mm' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de extractores de rótulas BGS (3 pzas)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de extractores de rótulas BGS (3 pzas)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = '6787', `categoria` = 'Suspensión', `unidad` = 'ud', `notas` = 'Referencia probable, a confirmar: extractor de 2 pasos 16–20 mm, extractor de terminales 19 mm y extractor 20 mm.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de extractores de rótulas BGS (3 pzas)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de extractores de rótulas BGS (3 pzas)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Remachadora Rapid', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Remachadora Rapid');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Rapid', `referencia` = NULL, `categoria` = 'Manual', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Remachadora Rapid';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Remachadora Rapid' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Grapadora', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Grapadora');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Manual', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Grapadora';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Grapadora' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Destornillador de golpe Bahco', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Destornillador de golpe Bahco');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Bahco', `referencia` = NULL, `categoria` = 'Destornilladores', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Destornillador de golpe Bahco';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Destornillador de golpe Bahco' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de filtro de aceite 65 mm 14 caras', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite 65 mm 14 caras');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Mantenimiento', `unidad` = 'ud', `notas` = 'De copa.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de filtro de aceite 65 mm 14 caras';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite 65 mm 14 caras' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de filtro de aceite 66–67 mm 14 caras', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite 66–67 mm 14 caras');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Mantenimiento', `unidad` = 'ud', `notas` = 'De copa.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de filtro de aceite 66–67 mm 14 caras';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite 66–67 mm 14 caras' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de filtro de aceite 68 mm 14 caras', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite 68 mm 14 caras');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Mantenimiento', `unidad` = 'ud', `notas` = 'De copa.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de filtro de aceite 68 mm 14 caras';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite 68 mm 14 caras' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de filtro de aceite BGS 1046 (76 mm 14 caras)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite BGS 1046 (76 mm 14 caras)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = '1046', `categoria` = 'Mantenimiento', `unidad` = 'ud', `notas` = 'De copa. VW, Porsche, Mercedes-Benz, BMW, Audi, Opel.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de filtro de aceite BGS 1046 (76 mm 14 caras)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite BGS 1046 (76 mm 14 caras)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de filtro de aceite H903 (de muescas)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite H903 (de muescas)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = 'H903', `categoria` = 'Mantenimiento', `unidad` = 'ud', `notas` = 'De copa con muescas, no poligonal.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de filtro de aceite H903 (de muescas)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite H903 (de muescas)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Llave de filtro de aceite H903-6 (de muescas)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite H903-6 (de muescas)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = 'H903-6', `categoria` = 'Mantenimiento', `unidad` = 'ud', `notas` = 'De copa con muescas, no poligonal.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Llave de filtro de aceite H903-6 (de muescas)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Llave de filtro de aceite H903-6 (de muescas)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Kit reparapinchazos de neumáticos Norauto', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Kit reparapinchazos de neumáticos Norauto');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'Norauto', `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Kit reparapinchazos de neumáticos Norauto';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Kit reparapinchazos de neumáticos Norauto' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Kit reparapinchazos de neumáticos (AliExpress)', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Kit reparapinchazos de neumáticos (AliExpress)');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Ruedas', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Kit reparapinchazos de neumáticos (AliExpress)';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Kit reparapinchazos de neumáticos (AliExpress)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Útil fijador de poleas CCLIFE', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Útil fijador de poleas CCLIFE');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'CCLIFE', `referencia` = NULL, `categoria` = 'Motor', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Útil fijador de poleas CCLIFE';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Útil fijador de poleas CCLIFE' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Extractor de rodamientos de pista interior', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Extractor de rodamientos de pista interior');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Manual', `unidad` = 'ud', `notas` = NULL, `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Extractor de rodamientos de pista interior';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Extractor de rodamientos de pista interior' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Alicates para abrazaderas de fuelle BGS 161', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Alicates para abrazaderas de fuelle BGS 161');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = 'BGS', `referencia` = '161', `categoria` = 'Transmisión', `unidad` = 'ud', `notas` = '235 mm. Abrazaderas de fuelles de transmisión.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Alicates para abrazaderas de fuelle BGS 161';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Alicates para abrazaderas de fuelle BGS 161' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `estado`, `unidad`) SELECT 'herramienta', 'Juego de llaves de racores para tubería hidráulica', 'ok', 'ud' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de llaves de racores para tubería hidráulica');
--> statement-breakpoint
UPDATE `articulos` SET `tipo` = 'herramienta', `marca` = NULL, `referencia` = NULL, `categoria` = 'Frenos', `unidad` = 'ud', `notas` = 'En bolsa. Silvercrest o BGS, medidas a confirmar.', `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'C1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'C1'), `nivel` = 6, `contenedor_id` = NULL, `ubicacion` = NULL WHERE `nombre` = 'Juego de llaves de racores para tubería hidráulica';
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de llaves de racores para tubería hidráulica' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
