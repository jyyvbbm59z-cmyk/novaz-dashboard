-- Plan de la Bandit (7858 CHK) ajustado al manual (p. 2-2): filtros de aceite y de aire cada 18.000 km / 18 meses
-- en planes propios (F1, F2), la I2 solo cambia aceite y añade el engrase de puntos de lubricación (p. 2-3), y la I3
-- revisa el filtro de aire en vez de cambiarlo. Solo toca las líneas afectadas; se puede aplicar varias veces.

-- I2: fuera el filtro de aceite, aceite con su especificación y engrase de puntos de lubricación
UPDATE `planes_mantenimiento` SET `tareas` = (
	SELECT json_group_array(t) FROM (
		SELECT CASE WHEN value LIKE 'Cambiar aceite de motor%' THEN 'Cambiar aceite de motor: 10W-40 API SF/SG, 3,3 L (3,5 L si toca filtro)' ELSE value END AS t, CAST(key AS INTEGER) AS k
		FROM json_each(`planes_mantenimiento`.`tareas`) WHERE value NOT LIKE 'Cambiar filtro de aceite%'
		UNION ALL
		SELECT 'Engrasar puntos de lubricación: manetas, pedales, reposapiés y caballetes (p. 2-3)', 100000
		WHERE NOT EXISTS (SELECT 1 FROM json_each(`planes_mantenimiento`.`tareas`) WHERE value LIKE 'Engrasar puntos de lubricación%')
		ORDER BY k
	)
)
WHERE `codigo` = 'I2' AND `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '7858CHK');
--> statement-breakpoint
-- I3: el filtro de aire se revisa (se cambia en su propio plan)
UPDATE `planes_mantenimiento` SET `tareas` = (
	SELECT json_group_array(t) FROM (
		SELECT CASE WHEN value LIKE 'Cambiar filtro de aire%' THEN 'Filtro de aire: inspeccionar y soplar por dentro' ELSE value END AS t, CAST(key AS INTEGER) AS k
		FROM json_each(`planes_mantenimiento`.`tareas`) ORDER BY k
	)
)
WHERE `codigo` = 'I3' AND `vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '7858CHK');
--> statement-breakpoint
-- F1 y F2: planes propios de los filtros
INSERT INTO `planes_mantenimiento` (`codigo`, `nombre`, `cada_km`, `cada_meses`, `tareas`, `incluye`, `orden`, `vehiculo_id`, `aviso_km`, `aviso_dias`, `notas`, `activo`)
SELECT x.codigo, x.nombre, 18000, 18, x.tareas, '[]', (SELECT COALESCE(MAX(`orden`), 0) FROM `planes_mantenimiento` WHERE `vehiculo_id` = v.`id`) + x.o, v.`id`, 1000, 30, x.notas, 1
FROM `vehiculos` v, (
	SELECT 'F1' AS codigo, 'Filtro de aceite' AS nombre, '["Cambiar filtro de aceite original Suzuki de moto: junta untada, contacto + 2 vueltas con la llave 09915-40610"]' AS tareas, 'Manual: cada 18.000 km o 18 meses, junto con el cambio de aceite (p. 2-9).' AS notas, 1 AS o
	UNION ALL SELECT 'F2', 'Filtro de aire', '["Cambiar el filtro de aire (marca «*» hacia arriba) y vaciar el tubo de drenaje"]', 'Manual: cada 18.000 km o 18 meses; se revisa en cada servicio (p. 2-7).', 2
) x
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND EXISTS (SELECT 1 FROM `planes_mantenimiento` p WHERE p.`vehiculo_id` = v.`id` AND p.`codigo` = 'I2')
AND NOT EXISTS (SELECT 1 FROM `planes_mantenimiento` p WHERE p.`vehiculo_id` = v.`id` AND p.`codigo` = x.codigo);
--> statement-breakpoint
-- Desde cuándo cuentan: el filtro de aceite se cambiaba en cada servicio (I2) y el de aire en cada revisión anual (I3)
INSERT OR IGNORE INTO `entradas_planes` (`entrada_id`, `plan_id`)
SELECT (
	SELECT ep.`entrada_id` FROM `entradas_planes` ep
	JOIN `entradas` e ON e.`id` = ep.`entrada_id`
	JOIN `planes_mantenimiento` o ON o.`id` = ep.`plan_id`
	WHERE o.`vehiculo_id` = f.`vehiculo_id` AND o.`codigo` = CASE f.`codigo` WHEN 'F1' THEN 'I2' ELSE 'I3' END
	ORDER BY e.`fecha` DESC, e.`id` DESC LIMIT 1
), f.`id`
FROM `planes_mantenimiento` f
WHERE f.`codigo` IN ('F1', 'F2')
AND f.`vehiculo_id` = (SELECT `id` FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '7858CHK')
AND NOT EXISTS (SELECT 1 FROM `entradas_planes` x WHERE x.`plan_id` = f.`id`)
AND EXISTS (
	SELECT 1 FROM `entradas_planes` ep JOIN `planes_mantenimiento` o ON o.`id` = ep.`plan_id`
	WHERE o.`vehiculo_id` = f.`vehiculo_id` AND o.`codigo` = CASE f.`codigo` WHEN 'F1' THEN 'I2' ELSE 'I3' END
);
