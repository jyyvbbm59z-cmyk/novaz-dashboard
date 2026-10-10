-- Datos del Ibiza según la DGT: ITV, seguro, distintivo ambiental y NIVE (sin duplicar)
INSERT INTO `vencimientos` (`vehiculo_id`, `tipo_id`, `fecha_inicio`, `fecha_vence`, `proveedor`, `notas`, `estado`)
SELECT v.`id`, 1, '2026-06-30', '2027-06-30', NULL, 'Favorable · 113.796 km', 'vigente'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `vencimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 1 AND x.`estado` = 'vigente');
--> statement-breakpoint
INSERT INTO `vencimientos` (`vehiculo_id`, `tipo_id`, `fecha_inicio`, `fecha_vence`, `proveedor`, `notas`, `estado`)
SELECT v.`id`, 2, '2026-03-25', '2027-03-25', 'Línea Directa', 'Póliza desde el 25/03/2025, renovación anual: comprueba la fecha y el importe en la póliza', 'vigente'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `vencimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 2 AND x.`estado` = 'vigente');
--> statement-breakpoint
-- Km de la última ITV (fecha aproximada: la de la inspección que da validez hasta el 30/06/2027)
INSERT INTO `lecturas_km` (`vehiculo_id`, `fecha`, `km`, `origen`)
SELECT v.`id`, '2026-06-30', 113796, 'manual' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `lecturas_km` l WHERE l.`vehiculo_id` = v.`id` AND l.`km` = 113796);
--> statement-breakpoint
UPDATE `vehiculos`
SET `notas` = coalesce(`notas` || char(10), '') || 'Distintivo ambiental C · NIVE 742433A1B9D44EF49C6FB4A92B10C412 · municipio fiscal: Moncada (impuesto de circulación)'
WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX' AND coalesce(`notas`, '') NOT LIKE '%NIVE%';
