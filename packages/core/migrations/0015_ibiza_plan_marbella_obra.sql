-- Plan «SEAT Ibiza 1.4 TDI (6J/6P, 2015–2017)» para el Ibiza (como «Aplicar plantilla»). No hace nada si ya lo tiene.
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `cada_dias`, `aviso_km`, `aviso_dias`, `tareas`, `incluye`, `vehiculo_id`, `orden`, `notas`, `activo`)
SELECT 'C1', 'Comprobación mensual', NULL, 1, NULL, 0, 5, '["Presión de neumáticos (ver etiqueta del marco de la puerta) y rueda de repuesto o kit","Nivel de aceite (en frío, coche llano)","Nivel de refrigerante y limpiaparabrisas","Luces, intermitentes y luz de freno","Testigos del cuadro al arrancar"]', '[]', v.`id`, 0, NULL, 1
FROM `vehiculos` v WHERE v.`id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX')
	AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = v.`id` AND x.`codigo` = 'C1');
--> statement-breakpoint
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `cada_dias`, `aviso_km`, `aviso_dias`, `tareas`, `incluye`, `vehiculo_id`, `orden`, `notas`, `activo`)
SELECT 'C2', 'Aceite y filtro', 15000, 12, NULL, 1000, 30, '["Cambiar aceite 5W-30 con norma VW 507.00 (obligatoria con filtro de partículas)","Cambiar filtro de aceite","Poner a cero el indicador de servicio"]', '[]', v.`id`, 1, 'Servicio fijo: 15.000 km o 1 año. El servicio flexible (LongLife) permite hasta 30.000 km o 2 años, pero solo con aceite LongLife y uso regular.', 1
FROM `vehiculos` v WHERE v.`id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX')
	AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = v.`id` AND x.`codigo` = 'C2');
--> statement-breakpoint
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `cada_dias`, `aviso_km`, `aviso_dias`, `tareas`, `incluye`, `vehiculo_id`, `orden`, `notas`, `activo`)
SELECT 'C3', 'Inspección', 30000, 24, NULL, 1500, 30, '["Cambiar filtro de polen (habitáculo)","Frenos: grosor de pastillas y discos, latiguillos","Correa auxiliar: grietas y tensor","Suspensión, rótulas y fuelles de transmisión","Escape y filtro de partículas (sin avisos ni fugas)","Batería y bornes","Bajos: fugas de aceite, refrigerante o gasoil","Escobillas del limpiaparabrisas"]', '[]', v.`id`, 2, NULL, 1
FROM `vehiculos` v WHERE v.`id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX')
	AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = v.`id` AND x.`codigo` = 'C3');
--> statement-breakpoint
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `cada_dias`, `aviso_km`, `aviso_dias`, `tareas`, `incluye`, `vehiculo_id`, `orden`, `notas`, `activo`)
SELECT 'C4', 'Líquido de frenos', NULL, 24, NULL, 0, 30, '["Cambiar líquido de frenos DOT 4 y purgar"]', '[]', v.`id`, 3, 'SEAT pide el primer cambio a los 3 años y después cada 2.', 1
FROM `vehiculos` v WHERE v.`id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX')
	AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = v.`id` AND x.`codigo` = 'C4');
--> statement-breakpoint
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `cada_dias`, `aviso_km`, `aviso_dias`, `tareas`, `incluye`, `vehiculo_id`, `orden`, `notas`, `activo`)
SELECT 'C5', 'Filtros de aire y gasoil', 60000, 48, NULL, 2000, 30, '["Cambiar filtro de aire","Cambiar filtro de gasoil y purgar (el plan de SEAT lo pide cada 90.000 km o 6 años; aquí se adelanta con el de aire)"]', '[]', v.`id`, 4, NULL, 1
FROM `vehiculos` v WHERE v.`id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX')
	AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = v.`id` AND x.`codigo` = 'C5');
--> statement-breakpoint
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `cada_dias`, `aviso_km`, `aviso_dias`, `tareas`, `incluye`, `vehiculo_id`, `orden`, `notas`, `activo`)
SELECT 'C6', 'Distribución', 180000, 120, NULL, 5000, 60, '["Cambiar correa de distribución con tensor y rodillos","Cambiar bomba de agua (la mueve la misma correa)","Cambiar correa auxiliar","Cambiar refrigerante G13"]', '[]', v.`id`, 5, 'El fabricante indica 210.000 km. Se adelanta a 180.000 km o 10 años porque tensores y rodillos dan guerra antes y la goma envejece aunque el coche ande poco. Si se rompe, el motor se daña.', 1
FROM `vehiculos` v WHERE v.`id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX')
	AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = v.`id` AND x.`codigo` = 'C6');
--> statement-breakpoint
UPDATE `planes_mantenimiento` SET `incluye` = json_array((SELECT x.`id` FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = `planes_mantenimiento`.`vehiculo_id` AND x.`codigo` = 'C1'))
WHERE `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX') AND `codigo` = 'C2' AND `incluye` = '[]';
--> statement-breakpoint
UPDATE `planes_mantenimiento` SET `incluye` = json_array((SELECT x.`id` FROM `planes_mantenimiento` x WHERE x.`vehiculo_id` = `planes_mantenimiento`.`vehiculo_id` AND x.`codigo` = 'C2'))
WHERE `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX') AND `codigo` = 'C3' AND `incluye` = '[]';
--> statement-breakpoint
-- El Ibiza tiene unos 117.000 km (si no se ha apuntado ya una lectura así)
INSERT INTO `lecturas_km` (`vehiculo_id`, `fecha`, `km`, `origen`)
SELECT v.`id`, date('now'), 117000, 'manual' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `lecturas_km` l WHERE l.`vehiculo_id` = v.`id` AND l.`km` >= 110000);
--> statement-breakpoint
-- El Marbella está en restauración
UPDATE `vehiculos` SET `estado_id` = 2 WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = 'A9742DB' AND (`estado_id` = 1 OR `estado_id` IS NULL);
--> statement-breakpoint
INSERT INTO `restauraciones` (`vehiculo_id`, `nombre`, `fecha_inicio`, `estado`)
SELECT v.`id`, 'Restauración SEAT Marbella', date('now'), 'en_curso' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = 'A9742DB' AND NOT EXISTS (SELECT 1 FROM `restauraciones` r WHERE r.`vehiculo_id` = v.`id`);
--> statement-breakpoint
-- Fases y tareas de la plantilla «Restauración completa»
INSERT INTO `fases` (`restauracion_id`, `nombre`, `orden`)
SELECT r.`id`, json_extract(f.`value`, '$.nombre'), CAST(f.`key` AS INTEGER)
FROM `restauraciones` r JOIN `vehiculos` v ON v.`id` = r.`vehiculo_id`
	JOIN `plantillas_fases` pf ON pf.`id` = (SELECT `id` FROM `plantillas_fases` WHERE `nombre` = 'Restauración completa' ORDER BY `id` LIMIT 1)
	JOIN json_each(pf.`fases`) f
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = 'A9742DB' AND r.`nombre` = 'Restauración SEAT Marbella'
	AND NOT EXISTS (SELECT 1 FROM `fases` x WHERE x.`restauracion_id` = r.`id`);
--> statement-breakpoint
INSERT INTO `tareas` (`fase_id`, `titulo`, `orden`)
SELECT fa.`id`, t.`value`, CAST(t.`key` AS INTEGER)
FROM `fases` fa JOIN `restauraciones` r ON r.`id` = fa.`restauracion_id` JOIN `vehiculos` v ON v.`id` = r.`vehiculo_id`
	JOIN `plantillas_fases` pf ON pf.`id` = (SELECT `id` FROM `plantillas_fases` WHERE `nombre` = 'Restauración completa' ORDER BY `id` LIMIT 1)
	JOIN json_each(pf.`fases`) f ON CAST(f.`key` AS INTEGER) = fa.`orden`
	JOIN json_each(json_extract(f.`value`, '$.tareas')) t
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = 'A9742DB' AND r.`nombre` = 'Restauración SEAT Marbella'
	AND NOT EXISTS (SELECT 1 FROM `tareas` y WHERE y.`fase_id` = fa.`id`);
