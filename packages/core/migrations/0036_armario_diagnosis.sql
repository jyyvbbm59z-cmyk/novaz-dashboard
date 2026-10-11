-- Armario de diagnosis y motor en la bahía del fondo (zona B), contra la pared izquierda y girado hacia la bahía
INSERT INTO `muebles` (`zona_id`, `codigo`, `nombre`, `tipo`, `x`, `y`, `ancho`, `fondo`, `girado`, `niveles`)
SELECT
	(SELECT `id` FROM `zonas` WHERE `codigo` = 'B'),
	'A' || (SELECT COALESCE(MAX(CAST(SUBSTR(`codigo`, 2) AS INTEGER)), 0) + 1 FROM `muebles` WHERE `codigo` GLOB 'A[0-9]*'),
	'Armario de diagnosis y motor', 'armario', 0, 10.3, 1.0, 0.5, 1, 4
WHERE NOT EXISTS (SELECT 1 FROM `muebles` WHERE `nombre` = 'Armario de diagnosis y motor');
--> statement-breakpoint
-- Lo de la balda de arriba (balda 1); si ya estaba en el inventario, solo se mueve aquí
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`)
SELECT 'herramienta', n, m, c, 'ok', 'ud' FROM (
	SELECT 'Maletín de diagnóstico Launch' AS n, 'Launch' AS m, 'Diagnosis' AS c
	UNION ALL SELECT 'Extractor de válvulas', NULL, 'Motor'
	UNION ALL SELECT 'Medidor de compresión', NULL, 'Medición'
	UNION ALL SELECT 'Bomba de vacío', NULL, 'Medición'
) WHERE n NOT IN (SELECT `nombre` FROM `articulos`);
--> statement-breakpoint
UPDATE `articulos` SET
	`mueble_id` = (SELECT `id` FROM `muebles` WHERE `nombre` = 'Armario de diagnosis y motor'),
	`zona_id` = (SELECT `zona_id` FROM `muebles` WHERE `nombre` = 'Armario de diagnosis y motor'),
	`nivel` = 1,
	`contenedor_id` = NULL
WHERE `nombre` IN ('Maletín de diagnóstico Launch', 'Extractor de válvulas', 'Medidor de compresión', 'Bomba de vacío')
AND (`mueble_id` IS NULL OR `mueble_id` = (SELECT `id` FROM `muebles` WHERE `nombre` = 'Armario de diagnosis y motor'));
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`)
SELECT `id`, date('now'), 1, 'alta' FROM `articulos`
WHERE `nombre` IN ('Maletín de diagnóstico Launch', 'Extractor de válvulas', 'Medidor de compresión', 'Bomba de vacío')
AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
