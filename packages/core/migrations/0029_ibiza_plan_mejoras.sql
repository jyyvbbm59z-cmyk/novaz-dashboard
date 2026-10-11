-- Plan de mejoras del Ibiza, en el orden acordado (sin duplicar si ya están)
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Aceite y filtros antes del remap', 'Paso 1 de 5 del plan de mejoras. Al hacerlo, marca también la revisión C2 (y la C5 si cambias el filtro de aire).', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Aceite y filtros antes del remap');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Aditivo limpiador de inyectores', 'Paso 2 de 5. Un depósito con el aditivo antes del remap.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Aditivo limpiador de inyectores');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Revisar embrague y volante bimasa', 'Paso 3 de 5, antes del remap: con más par, un embrague o un bimasa tocados no aguantan.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Revisar embrague y volante bimasa');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Stage 1 en Reprocar Valencia', 'Paso 3 de 5. Objetivo: 125–135 CV y 300–320 Nm, con DPF y EGR intactos.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Stage 1 en Reprocar Valencia');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Revisión completa de suspensión y amortiguación', 'Paso 4 de 5. Se hace al desmontar, antes de montar nada nuevo. Revisar:
- Rótulas, bieletas y brazos o trapecios
- Silentblocks y gomas de la barra estabilizadora
- Copelas y rodamientos de los amortiguadores
- Topes y fuelles
- Rodamientos de rueda y estado de la tornillería
Descartado por ahora: barra de torreta y refuerzo trasero (este, hasta probar cómo queda con lo nuevo).', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Revisión completa de suspensión y amortiguación');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Amortiguadores Bilstein B12', 'Paso 4 de 5. Ojo: el kit Bilstein B12 Pro-Kit ya trae los amortiguadores (B8) y los muelles Eibach Pro-Kit.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Amortiguadores Bilstein B12');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Muelles Eibach Pro-Kit (bajada de 25–30 mm)', 'Paso 4 de 5. Vienen en el kit Bilstein B12 Pro-Kit si lo compras como kit.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Muelles Eibach Pro-Kit (bajada de 25–30 mm)');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Recambios que salgan de la revisión', 'Paso 4 de 5. Las gomas de la barra estabilizadora casi seguro; el resto, según el estado.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Recambios que salgan de la revisión');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Geometría en taller', 'Paso 4 de 5, lo último de ese paso. En un taller: no la haces tú.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Geometría en taller');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Llantas de 17" del Ibiza FR', 'Paso 5 de 5.', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Llantas de 17" del Ibiza FR');
--> statement-breakpoint
INSERT INTO `pendientes` (`vehiculo_id`, `titulo`, `detalle`, `tipo`, `prioridad`, `fecha_detectado`, `estado`)
SELECT v.`id`, 'Neumáticos Michelin Pilot Sport 5 215/40 ZR17 87Y XL', 'Paso 5 de 5. Medida homologada en la ficha técnica (215/40 R17 87V XL; el índice Y es superior).', 'mejora', 'media', date('now'), 'pendiente' FROM `vehiculos` v
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND NOT EXISTS (SELECT 1 FROM `pendientes` p WHERE p.`vehiculo_id` = v.`id` AND p.`titulo` = 'Neumáticos Michelin Pilot Sport 5 215/40 ZR17 87Y XL');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Aceite 5W-30 VW 507.00', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Aceite y filtros antes del remap' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Aceite 5W-30 VW 507.00');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Filtro de aceite', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Aceite y filtros antes del remap' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Filtro de aceite');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Filtro de aire', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Aceite y filtros antes del remap' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Filtro de aire');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Aditivo limpiador de inyectores diésel', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Aditivo limpiador de inyectores' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Aditivo limpiador de inyectores diésel');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Kit Bilstein B12 Pro-Kit (amortiguadores B8 + muelles Eibach Pro-Kit)', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Amortiguadores Bilstein B12' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Kit Bilstein B12 Pro-Kit (amortiguadores B8 + muelles Eibach Pro-Kit)');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Gomas de la barra estabilizadora', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Recambios que salgan de la revisión' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Gomas de la barra estabilizadora');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Llantas 17" Ibiza FR (4)', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Llantas de 17" del Ibiza FR' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Llantas 17" Ibiza FR (4)');
--> statement-breakpoint
INSERT INTO `lista_compra` (`texto`, `pendiente_id`, `vehiculo_id`)
SELECT 'Michelin Pilot Sport 5 215/40 ZR17 87Y XL (4)', p.`id`, p.`vehiculo_id` FROM `pendientes` p JOIN `vehiculos` v ON v.`id` = p.`vehiculo_id`
WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '6780JNX' AND p.`titulo` = 'Neumáticos Michelin Pilot Sport 5 215/40 ZR17 87Y XL' AND p.`estado` = 'pendiente'
	AND NOT EXISTS (SELECT 1 FROM `lista_compra` l WHERE l.`pendiente_id` = p.`id` AND l.`texto` = 'Michelin Pilot Sport 5 215/40 ZR17 87Y XL (4)');
