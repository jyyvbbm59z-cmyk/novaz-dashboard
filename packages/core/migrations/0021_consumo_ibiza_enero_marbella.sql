-- Campo «Consumo medio» (L/100 km) en coches, motos y furgonetas, para el coste de uso
UPDATE `tipos_vehiculo`
SET `campos` = json_insert(`campos`, '$[#]', json('{"clave":"consumo","etiqueta":"Consumo medio","tipo":"numero","unidad":"L/100 km"}'))
WHERE `id` IN (1, 2, 3) AND `campos` NOT LIKE '%"consumo"%';
--> statement-breakpoint
-- Ibiza: consumo real típico del 1.4 TDI 105 CV (ajústalo con tus repostajes)
UPDATE `vehiculos` SET `campos` = json_set(`campos`, '$.consumo', 4.8)
WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX' AND json_extract(`campos`, '$.consumo') IS NULL;
--> statement-breakpoint
-- Ibiza: mantenimiento grande del 12/01/2026 (km estimados entre las lecturas de 16/12/2025 y 30/06/2026)
INSERT INTO `entradas` (`vehiculo_id`, `clase`, `fecha`, `km`, `titulo`, `texto`)
SELECT v.`id`, 'mantenimiento', '2026-01-12', 111350, 'Mantenimiento completo: distribución, bomba de agua, filtros y aceite',
	'Kit de distribución (correa, tensor y rodillos), bomba de agua, refrigerante, filtros, aceite y filtro de aceite, etc. Km estimados (~111.350) a partir de las lecturas del 16/12/2025 y del 30/06/2026.'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `entradas` e WHERE e.`vehiculo_id` = v.`id` AND e.`fecha` = '2026-01-12');
--> statement-breakpoint
INSERT INTO `entradas_planes` (`entrada_id`, `plan_id`)
SELECT e.`id`, p.`id`
FROM `entradas` e JOIN `vehiculos` v ON v.`id` = e.`vehiculo_id`
	JOIN `planes_mantenimiento` p ON p.`vehiculo_id` = v.`id` AND p.`codigo` IN ('C2', 'C5', 'C6')
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND e.`fecha` = '2026-01-12'
	AND NOT EXISTS (SELECT 1 FROM `entradas_planes` x WHERE x.`entrada_id` = e.`id` AND x.`plan_id` = p.`id`);
--> statement-breakpoint
-- Marbella: datos de la DGT
UPDATE `vehiculos`
SET `bastidor` = 'VSS028A00VD001647',
	`notas` = 'Motor 899 cc de 4 cilindros con inyección monopunto y catalizador (mecánica Fiat 127/Panda), gasolina
Primera matriculación: 12/12/1996 · distintivo ambiental: SIN etiqueta (ojo con las zonas de bajas emisiones)
Cumple 30 años el 12/12/2026: desde entonces puede catalogarse como vehículo histórico'
WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = 'A9742DB' AND `bastidor` IS NULL;
--> statement-breakpoint
INSERT INTO `lecturas_km` (`vehiculo_id`, `fecha`, `km`, `origen`)
SELECT v.`id`, '2021-07-03', 72666, 'manual' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = 'A9742DB'
	AND NOT EXISTS (SELECT 1 FROM `lecturas_km` l WHERE l.`vehiculo_id` = v.`id` AND l.`km` = 72666);
--> statement-breakpoint
INSERT INTO `vencimientos` (`vehiculo_id`, `tipo_id`, `fecha_inicio`, `fecha_vence`, `notas`, `estado`)
SELECT v.`id`, 1, '2021-07-03', '2022-07-03', 'Última ITV: favorable, 72.666 km. Caducada: hay que pasarla al terminar la restauración.', 'vigente'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = 'A9742DB'
	AND NOT EXISTS (SELECT 1 FROM `vencimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 1);
--> statement-breakpoint
INSERT INTO `vencimientos` (`vehiculo_id`, `tipo_id`, `fecha_inicio`, `fecha_vence`, `proveedor`, `notas`, `estado`)
SELECT v.`id`, 2, '2026-05-29', '2026-05-30', 'Welcome Seguros', 'Seguro temporal de un día (29 al 30/05/2026).', 'vigente'
FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = 'A9742DB'
	AND NOT EXISTS (SELECT 1 FROM `vencimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`tipo_id` = 2);
