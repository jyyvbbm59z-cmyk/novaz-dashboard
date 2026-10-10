-- Ibiza: importe del seguro (póliza Línea Directa) y de la ITV, con sus gastos (sin duplicar)
UPDATE `vencimientos`
SET `importe_cent` = 26901, `referencia` = '46209528', `proveedor` = 'Línea Directa',
	`notas` = 'Terceros, robo, incendio y lunas · pago anual · recibo 46209528001-01 · vigencia 25/03/2026 al 25/03/2027'
WHERE `tipo_id` = 2 AND `estado` = 'vigente' AND `importe_cent` IS NULL
	AND `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX');
--> statement-breakpoint
UPDATE `vencimientos` SET `importe_cent` = 5615
WHERE `tipo_id` = 1 AND `estado` = 'vigente' AND `importe_cent` IS NULL
	AND `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX');
--> statement-breakpoint
INSERT INTO `movimientos` (`fecha`, `tipo`, `importe_cent`, `categoria_id`, `concepto`, `proveedor`, `vehiculo_id`, `vencimiento_id`, `iva_pct`, `pago`)
SELECT '2026-03-25', 'gasto', 26901, (SELECT `id` FROM `categorias` WHERE `nombre` = 'Seguros' ORDER BY `id` LIMIT 1),
	'Seguro 2026-2027 (terceros, robo, incendio y lunas)', 'Línea Directa', v.`id`, x.`id`, 0, 'banco'
FROM `vehiculos` v JOIN `vencimientos` x ON x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 2 AND x.`estado` = 'vigente'
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `movimientos` m WHERE m.`vencimiento_id` = x.`id`);
--> statement-breakpoint
INSERT INTO `movimientos` (`fecha`, `tipo`, `importe_cent`, `categoria_id`, `concepto`, `vehiculo_id`, `vencimiento_id`, `iva_pct`, `pago`)
SELECT x.`fecha_inicio`, 'gasto', 5615, (SELECT `id` FROM `categorias` WHERE `nombre` = 'ITV' ORDER BY `id` LIMIT 1),
	'ITV 2026', v.`id`, x.`id`, 21, 'banco'
FROM `vehiculos` v JOIN `vencimientos` x ON x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 1 AND x.`estado` = 'vigente'
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `movimientos` m WHERE m.`vencimiento_id` = x.`id`);
