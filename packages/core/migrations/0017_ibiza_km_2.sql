-- Más lecturas reales del Ibiza (sin duplicar)
INSERT INTO `lecturas_km` (`vehiculo_id`, `fecha`, `km`, `origen`)
SELECT v.`id`, d.`fecha`, d.`km`, 'manual'
FROM `vehiculos` v
	JOIN (SELECT '2025-04-13' AS `fecha`, 102605 AS `km` UNION ALL SELECT '2025-12-16', 110960 UNION ALL SELECT '2026-09-29', 116032) d
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `lecturas_km` l WHERE l.`vehiculo_id` = v.`id` AND l.`fecha` = d.`fecha` AND l.`km` = d.`km`);
--> statement-breakpoint
-- Fuera la estimación «unos 117.000 km» de la migración 0015: hay lecturas reales y falseaba el ritmo
DELETE FROM `lecturas_km`
WHERE `km` = 117000 AND `origen` = 'manual'
	AND `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX');
