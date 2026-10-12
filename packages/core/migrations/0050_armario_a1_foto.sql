-- Experimento: todo lo que se ve en la foto del armario A1, dado de alta y colocado balda a balda (la 1, la de arriba).
-- Lo de encima del armario va sin balda («Encima del armario»). Si ya existía (por el nombre), solo se recoloca.
--> statement-breakpoint
UPDATE `muebles` SET `niveles` = 5 WHERE `codigo` = 'A1' AND `niveles` < 5;
--> statement-breakpoint
INSERT INTO `contenedores` (`mueble_id`, `nivel`, `letra`, `nombre`, `tipo`, `columna`, `ancho`, `piso`, `alto`) SELECT (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), 4, 'A', 'Spray color', 'caja', 1, 1, 1, 1 WHERE (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `contenedores` WHERE `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') AND `nivel` = 4 AND `letra` = 'A');
--> statement-breakpoint
INSERT INTO `contenedores` (`mueble_id`, `nivel`, `letra`, `nombre`, `tipo`, `columna`, `ancho`, `piso`, `alto`) SELECT (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), 4, 'B', 'Spray especiales', 'caja', 1, 1, 0, 1 WHERE (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `contenedores` WHERE `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') AND `nivel` = 4 AND `letra` = 'B');
--> statement-breakpoint
INSERT INTO `contenedores` (`mueble_id`, `nivel`, `letra`, `nombre`, `tipo`, `columna`, `ancho`, `piso`, `alto`) SELECT (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), 4, 'C', 'Aceites', 'caja', 2, 1, 0, 1 WHERE (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `contenedores` WHERE `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') AND `nivel` = 4 AND `letra` = 'C');
--> statement-breakpoint
INSERT INTO `contenedores` (`mueble_id`, `nivel`, `letra`, `nombre`, `tipo`, `columna`, `ancho`, `piso`, `alto`) SELECT (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), 4, 'D', 'Miscelánea', 'caja', 3, 1, 1, 1 WHERE (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `contenedores` WHERE `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') AND `nivel` = 4 AND `letra` = 'D');
--> statement-breakpoint
INSERT INTO `contenedores` (`mueble_id`, `nivel`, `letra`, `nombre`, `tipo`, `columna`, `ancho`, `piso`, `alto`) SELECT (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), 4, 'E', 'Pintura poliuretano', 'caja', 3, 1, 0, 1 WHERE (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `contenedores` WHERE `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') AND `nivel` = 4 AND `letra` = 'E');
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Sincronizador de carburadores', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín azul «Carb. Sync.»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Sincronizador de carburadores');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = NULL, `contenedor_id` = NULL, `ubicacion` = 'Encima del armario', `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Carb. Sync.»') WHERE `nombre` = 'Sincronizador de carburadores' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Sincronizador de carburadores' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Maletín de diagnóstico Launch', 'Launch', 'Medición y diagnóstico', 'ok', 'ud', NULL WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Maletín de diagnóstico Launch');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, NULL) WHERE `nombre` = 'Maletín de diagnóstico Launch' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Maletín de diagnóstico Launch' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Medidor de presión de aceite', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín negro «Presión aceite»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Medidor de presión de aceite');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín negro «Presión aceite»') WHERE `nombre` = 'Medidor de presión de aceite' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Medidor de presión de aceite' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Manómetro diferencial (fugas de cilindro)', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín rojo «Manómetro diferencial»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Manómetro diferencial (fugas de cilindro)');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín rojo «Manómetro diferencial»') WHERE `nombre` = 'Manómetro diferencial (fugas de cilindro)' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Manómetro diferencial (fugas de cilindro)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Medidor de compresión', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín negro «Compresión»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Medidor de compresión');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín negro «Compresión»') WHERE `nombre` = 'Medidor de compresión' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Medidor de compresión' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Medidor de compresión (maletín azul)', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín azul «Compresión»: el segundo' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Medidor de compresión (maletín azul)');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Compresión»: el segundo') WHERE `nombre` = 'Medidor de compresión (maletín azul)' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Medidor de compresión (maletín azul)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Bomba de vacío', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín azul «Bomba de vacío»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bomba de vacío');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Bomba de vacío»') WHERE `nombre` = 'Bomba de vacío' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Bomba de vacío' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Reloj comparador', NULL, 'Medición y diagnóstico', 'ok', 'ud', 'Maletín azul «Reloj comparador»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Reloj comparador');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Reloj comparador»') WHERE `nombre` = 'Reloj comparador' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Reloj comparador' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Tronchacadenas', NULL, 'Motor', 'ok', 'ud', 'Maletín azul «Tronchacadenas»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Tronchacadenas');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Motor', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Tronchacadenas»') WHERE `nombre` = 'Tronchacadenas' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Tronchacadenas' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Útil de distribución Toyota', NULL, 'Motor', 'ok', 'ud', 'Caja de cartón «Distr. Toy» (a confirmar)' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Útil de distribución Toyota');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Motor', `categoria`), `notas` = COALESCE(`notas`, 'Caja de cartón «Distr. Toy» (a confirmar)') WHERE `nombre` = 'Útil de distribución Toyota' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Útil de distribución Toyota' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Soldador de plásticos', NULL, 'Carrocería', 'ok', 'ud', 'Maletín negro «Soldador plástico»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Soldador de plásticos');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Carrocería', `categoria`), `notas` = COALESCE(`notas`, 'Maletín negro «Soldador plástico»') WHERE `nombre` = 'Soldador de plásticos' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Soldador de plásticos' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Extractor de válvulas', NULL, 'Motor', 'ok', 'ud', 'Maletín azul «Extractor de válvulas»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Extractor de válvulas');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Motor', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Extractor de válvulas»') WHERE `nombre` = 'Extractor de válvulas' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Extractor de válvulas' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Extractor de válvulas (maletín rojo)', NULL, 'Motor', 'ok', 'ud', 'Maletín rojo «Extractor de válvulas»: el segundo' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Extractor de válvulas (maletín rojo)');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Motor', `categoria`), `notas` = COALESCE(`notas`, 'Maletín rojo «Extractor de válvulas»: el segundo') WHERE `nombre` = 'Extractor de válvulas (maletín rojo)' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Extractor de válvulas (maletín rojo)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Útiles de calado de distribución (furgo)', NULL, 'Motor', 'ok', 'ud', 'Maletín azul «Distribución furgo» (a confirmar)' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Útiles de calado de distribución (furgo)');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Motor', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Distribución furgo» (a confirmar)') WHERE `nombre` = 'Útiles de calado de distribución (furgo)' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Útiles de calado de distribución (furgo)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Útiles de calado de distribución VAG', NULL, 'Motor', 'ok', 'ud', 'Maletín azul «Distribución VAG»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Útiles de calado de distribución VAG');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 1, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Motor', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Distribución VAG»') WHERE `nombre` = 'Útiles de calado de distribución VAG' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Útiles de calado de distribución VAG' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de termorretráctil', NULL, 'Electricidad', 'ok', 'ud', 'Caja «Termo»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de termorretráctil');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Electricidad', `categoria`), `notas` = COALESCE(`notas`, 'Caja «Termo»') WHERE `nombre` = 'Surtido de termorretráctil' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de termorretráctil' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de conectores JST', NULL, 'Electricidad', 'ok', 'ud', 'Caja «JST»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de conectores JST');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Electricidad', `categoria`), `notas` = COALESCE(`notas`, 'Caja «JST»') WHERE `nombre` = 'Surtido de conectores JST' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de conectores JST' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de terminales Faston', NULL, 'Electricidad', 'ok', 'ud', 'Caja «Faston»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de terminales Faston');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Electricidad', `categoria`), `notas` = COALESCE(`notas`, 'Caja «Faston»') WHERE `nombre` = 'Surtido de terminales Faston' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de terminales Faston' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido varios', NULL, NULL, 'ok', 'ud', 'Caja «Varios»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido varios');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE(NULL, `categoria`), `notas` = COALESCE(`notas`, 'Caja «Varios»') WHERE `nombre` = 'Surtido varios' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido varios' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de pasadores', NULL, 'Fijaciones', 'ok', 'ud', 'Caja «Pasadores» (a confirmar)' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de pasadores');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Fijaciones', `categoria`), `notas` = COALESCE(`notas`, 'Caja «Pasadores» (a confirmar)') WHERE `nombre` = 'Surtido de pasadores' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de pasadores' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de circlips', NULL, 'Fijaciones', 'ok', 'ud', 'Dos cajas «Circlip»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de circlips');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Fijaciones', `categoria`), `notas` = COALESCE(`notas`, 'Dos cajas «Circlip»') WHERE `nombre` = 'Surtido de circlips' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 2, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de circlips' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de chavetas', NULL, 'Fijaciones', 'ok', 'ud', 'Caja «Chavetas»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de chavetas');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Fijaciones', `categoria`), `notas` = COALESCE(`notas`, 'Caja «Chavetas»') WHERE `nombre` = 'Surtido de chavetas' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de chavetas' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Juego de vasos multipunto', NULL, 'Llaves y vasos', 'ok', 'ud', 'Maletín azul «Vasos multipunto»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de vasos multipunto');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Llaves y vasos', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul «Vasos multipunto»') WHERE `nombre` = 'Juego de vasos multipunto' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de vasos multipunto' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Puntas Allen de impacto', NULL, 'Llaves y vasos', 'ok', 'ud', 'Maletín azul (a confirmar)' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Puntas Allen de impacto');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Llaves y vasos', `categoria`), `notas` = COALESCE(`notas`, 'Maletín azul (a confirmar)') WHERE `nombre` = 'Puntas Allen de impacto' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Puntas Allen de impacto' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Nivel láser Bosch', 'Bosch', 'Medición y diagnóstico', 'ok', 'ud', 'Caja «Lasers»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Nivel láser Bosch');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 2, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Medición y diagnóstico', `categoria`), `notas` = COALESCE(`notas`, 'Caja «Lasers»') WHERE `nombre` = 'Nivel láser Bosch' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Nivel láser Bosch' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Bomba de vacío de aire acondicionado', NULL, 'Aire acondicionado', 'ok', 'ud', 'La naranja' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Bomba de vacío de aire acondicionado');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Aire acondicionado', `categoria`), `notas` = COALESCE(`notas`, 'La naranja') WHERE `nombre` = 'Bomba de vacío de aire acondicionado' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Bomba de vacío de aire acondicionado' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Aceite para bombas de vacío', NULL, 'Aire acondicionado', 'ok', 'ud', 'Botella «Aceite especial bombas vacío»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Aceite para bombas de vacío');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Aire acondicionado', `categoria`), `notas` = COALESCE(`notas`, 'Botella «Aceite especial bombas vacío»') WHERE `nombre` = 'Aceite para bombas de vacío' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Aceite para bombas de vacío' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Juego de manómetros de aire acondicionado', NULL, 'Aire acondicionado', 'ok', 'ud', 'La bolsa con las mangueras (a confirmar)' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Juego de manómetros de aire acondicionado');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Aire acondicionado', `categoria`), `notas` = COALESCE(`notas`, 'La bolsa con las mangueras (a confirmar)') WHERE `nombre` = 'Juego de manómetros de aire acondicionado' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Juego de manómetros de aire acondicionado' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'consumible', 'Surtido de válvulas y juntas de aire acondicionado', NULL, 'Aire acondicionado', 'ok', 'ud', 'Cajitas «Válvulas juntas»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Surtido de válvulas y juntas de aire acondicionado');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Aire acondicionado', `categoria`), `notas` = COALESCE(`notas`, 'Cajitas «Válvulas juntas»') WHERE `nombre` = 'Surtido de válvulas y juntas de aire acondicionado' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Surtido de válvulas y juntas de aire acondicionado' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Generador de ozono Sailnovo', 'Sailnovo', 'Aire acondicionado', 'ok', 'ud', NULL WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Generador de ozono Sailnovo');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Aire acondicionado', `categoria`), `notas` = COALESCE(`notas`, NULL) WHERE `nombre` = 'Generador de ozono Sailnovo' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Generador de ozono Sailnovo' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
--> statement-breakpoint
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`, `notas`) SELECT 'herramienta', 'Kit varillero (quitabollos)', 'Vevor', 'Carrocería', 'ok', 'ud', 'Caja de cartón «Kit varillero»' WHERE NOT EXISTS (SELECT 1 FROM `articulos` WHERE `nombre` = 'Kit varillero (quitabollos)');
--> statement-breakpoint
UPDATE `articulos` SET `mueble_id` = (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1'), `zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `codigo` = 'A1'), `nivel` = 3, `contenedor_id` = NULL, `ubicacion` = NULL, `categoria` = COALESCE('Carrocería', `categoria`), `notas` = COALESCE(`notas`, 'Caja de cartón «Kit varillero»') WHERE `nombre` = 'Kit varillero (quitabollos)' AND (SELECT `id` FROM `muebles` WHERE `codigo` = 'A1') IS NOT NULL;
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`) SELECT `id`, date('now'), 1, 'alta' FROM `articulos` WHERE `nombre` = 'Kit varillero (quitabollos)' AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
