-- E1–E4 son estanterías metálicas tipo Simonrack de 180 × 90 × 40 cm (5 baldas): medidas reales y recolocadas
-- (E1–E3 seguidas en la línea de pilares, dando a Z2; E4 al fondo de limpieza, a la izquierda de la puerta del baño)
UPDATE `muebles` SET `nombre` = 'Estantería metálica Simonrack', `ancho` = 0.9, `fondo` = 0.4, `x` = 3.62, `y` = 8.55 WHERE `codigo` = 'E3' AND `tipo` = 'estanteria';
--> statement-breakpoint
UPDATE `muebles` SET `nombre` = 'Estantería metálica Simonrack', `ancho` = 0.9, `fondo` = 0.4, `x` = 3.62, `y` = 9.45 WHERE `codigo` = 'E2' AND `tipo` = 'estanteria';
--> statement-breakpoint
UPDATE `muebles` SET `nombre` = 'Estantería metálica Simonrack', `ancho` = 0.9, `fondo` = 0.4, `x` = 3.62, `y` = 10.35 WHERE `codigo` = 'E1' AND `tipo` = 'estanteria';
--> statement-breakpoint
UPDATE `muebles` SET `nombre` = 'Estantería metálica Simonrack', `ancho` = 0.9, `fondo` = 0.4, `x` = 3.92, `y` = 14.56 WHERE `codigo` = 'E4' AND `tipo` = 'estanteria';
