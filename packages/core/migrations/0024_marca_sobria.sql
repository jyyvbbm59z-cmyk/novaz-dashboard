-- Color de marca: el amarillo del logo de Novaz (si seguía el naranja por defecto)
UPDATE `ajustes` SET `valor` = '"#ebab00"' WHERE `clave` = 'acento' AND lower(`valor`) = '"#f2a33a"';
--> statement-breakpoint
-- Sin confeti ni sonidos por defecto: la app pasa a un tono sobrio (se pueden activar en Ajustes)
INSERT INTO `ajustes` (`clave`, `valor`) VALUES ('momentosActivos', 'false')
ON CONFLICT (`clave`) DO UPDATE SET `valor` = 'false';
