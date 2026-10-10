-- Lecturas de km del Ibiza traídas del registro de odómetros de Odoo (sin duplicar)
INSERT INTO `lecturas_km` (`vehiculo_id`, `fecha`, `km`, `origen`)
SELECT v.`id`, d.`fecha`, d.`km`, 'manual'
FROM `vehiculos` v
	JOIN (SELECT '2024-08-24' AS `fecha`, 95000 AS `km` UNION ALL SELECT '2025-02-04', 100616 UNION ALL SELECT '2025-12-16', 110960) d
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `lecturas_km` l WHERE l.`vehiculo_id` = v.`id` AND l.`fecha` = d.`fecha` AND l.`km` = d.`km`);
