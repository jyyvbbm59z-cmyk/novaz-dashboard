-- Cambio de aceite del Ibiza del 04/02/2025 (registro de Odoo), enlazado a la revisión C2 y con su gasto
INSERT INTO `entradas` (`vehiculo_id`, `clase`, `fecha`, `km`, `titulo`, `texto`)
SELECT v.`id`, 'mantenimiento', '2025-02-04', 100616, 'Cambio de aceite', 'Aceite 5W-30. Traído del registro de Odoo: no consta si se cambió también el filtro.'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `entradas` e WHERE e.`vehiculo_id` = v.`id` AND e.`fecha` = '2025-02-04' AND e.`km` = 100616);
--> statement-breakpoint
INSERT INTO `entradas_planes` (`entrada_id`, `plan_id`)
SELECT e.`id`, p.`id`
FROM `entradas` e JOIN `vehiculos` v ON v.`id` = e.`vehiculo_id`
	JOIN `planes_mantenimiento` p ON p.`vehiculo_id` = v.`id` AND p.`codigo` = 'C2'
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND e.`fecha` = '2025-02-04' AND e.`km` = 100616
	AND NOT EXISTS (SELECT 1 FROM `entradas_planes` x WHERE x.`entrada_id` = e.`id` AND x.`plan_id` = p.`id`);
--> statement-breakpoint
INSERT INTO `movimientos` (`fecha`, `tipo`, `importe_cent`, `categoria_id`, `concepto`, `vehiculo_id`, `entrada_id`, `iva_pct`, `pago`)
SELECT '2025-02-04', 'gasto', 3617, (SELECT `id` FROM `categorias` WHERE `nombre` = 'Consumibles' ORDER BY `id` LIMIT 1), 'Aceite 5W-30', v.`id`, e.`id`, 21, 'banco'
FROM `entradas` e JOIN `vehiculos` v ON v.`id` = e.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND e.`fecha` = '2025-02-04' AND e.`km` = 100616
	AND NOT EXISTS (SELECT 1 FROM `movimientos` m WHERE m.`entrada_id` = e.`id`);
