-- Taladros DeWalt del taller (sin ubicar: se colocan desde el plano del local)
INSERT INTO `articulos` (`tipo`, `nombre`, `marca`, `categoria`, `estado`, `unidad`)
SELECT 'herramienta', n, 'DeWalt', 'Eléctrica', 'ok', 'ud' FROM (
	SELECT 'Taladro percutor DeWalt (el grande)' AS n
	UNION ALL SELECT 'Taladro atornillador DeWalt compacto'
	UNION ALL SELECT 'Atornillador de impacto DeWalt'
) WHERE n NOT IN (SELECT `nombre` FROM `articulos`);
--> statement-breakpoint
INSERT INTO `stock` (`articulo_id`, `fecha`, `cantidad`, `motivo`)
SELECT `id`, date('now'), 1, 'alta' FROM `articulos`
WHERE `nombre` IN ('Taladro percutor DeWalt (el grande)', 'Taladro atornillador DeWalt compacto', 'Atornillador de impacto DeWalt')
AND `id` NOT IN (SELECT `articulo_id` FROM `stock`);
