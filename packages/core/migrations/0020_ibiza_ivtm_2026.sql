-- Impuesto de circulación 2026 del Ibiza (Moncada, recibo domiciliado del 04/05/2026), sin duplicar
INSERT INTO `vencimientos` (`vehiculo_id`, `tipo_id`, `fecha_inicio`, `fecha_vence`, `proveedor`, `referencia`, `importe_cent`, `notas`, `estado`)
SELECT v.`id`, 3, '2026-05-04', '2027-05-04', 'Diputación de Valencia (Moncada)', '005287906076', 5896,
	'IVTM 2026 domiciliado, cargado el 04/05/2026. El de 2027 llegará por las mismas fechas.', 'vigente'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `vencimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 3 AND x.`estado` = 'vigente');
--> statement-breakpoint
INSERT INTO `movimientos` (`fecha`, `tipo`, `importe_cent`, `categoria_id`, `concepto`, `proveedor`, `vehiculo_id`, `vencimiento_id`, `iva_pct`, `pago`)
SELECT '2026-05-04', 'gasto', 5896, (SELECT `id` FROM `categorias` WHERE `nombre` = 'Impuestos y tasas' ORDER BY `id` LIMIT 1),
	'Impuesto de circulación 2026', 'Diputación de Valencia', v.`id`, x.`id`, 0, 'banco'
FROM `vehiculos` v JOIN `vencimientos` x ON x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 3 AND x.`referencia` = '005287906076'
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `movimientos` m WHERE m.`vencimiento_id` = x.`id`);
