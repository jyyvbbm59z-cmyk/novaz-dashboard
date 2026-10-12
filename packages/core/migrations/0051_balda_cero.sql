-- Estanterías y armarios tienen balda 0: lo de encima. Lo que estaba apuntado como «Encima del armario», ahí.
UPDATE `articulos` SET `nivel` = 0, `ubicacion` = NULL
WHERE `ubicacion` = 'Encima del armario' AND `nivel` IS NULL AND `mueble_id` IN (SELECT `id` FROM `muebles` WHERE `tipo` IN ('estanteria', 'armario'));
