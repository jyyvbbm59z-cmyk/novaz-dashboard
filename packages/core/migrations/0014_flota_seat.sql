-- Alta de los SEAT de la flota (Ibiza y Marbella). No duplica si ya existe la matrícula.
INSERT INTO `vehiculos` (`tipo_id`, `alias`, `marca`, `modelo`, `anio`, `matricula`, `bastidor`, `estado_id`, `propietario`, `fecha_alta`, `notas`, `campos`)
SELECT 1, 'Ibiza', 'SEAT', 'Ibiza 1.4 TDI 105 CV', 2016, '6780 JNX', 'VSSZZZ6JZGR109035', 1, 'novaz', '2022-04-19',
	'1.4 TDI de 3 cilindros · 1.422 cc · 77 kW (105 CV) · Euro 6 · blanco · 5 plazas
Primera matriculación: 17/05/2016 · a tu nombre desde el 19/04/2022
Tipo 6J/SCCUTA (motor CUTA) · homologación e9*2001/116*0067*36
Neumáticos homologados: 185/60 R15 84H (de serie) · 185/60 R15 88H XL · 215/45 R16 86H/86V · 215/40 R17 87V XL
MMA 1.650 kg · tara 1.161 kg · remolque con freno 1.100 kg, sin freno 580 kg',
	'{"combustible":"Diésel","potencia":105,"neumaticos":"185/60 R15 84H","aceite":"5W-30 VW 507.00"}'
WHERE NOT EXISTS (SELECT 1 FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX');
--> statement-breakpoint
INSERT INTO `lecturas_km` (`vehiculo_id`, `fecha`, `km`, `origen`)
SELECT `id`, '2020-07-13', 47793, 'manual' FROM `vehiculos`
WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX'
	AND NOT EXISTS (SELECT 1 FROM `lecturas_km` l WHERE l.`vehiculo_id` = `vehiculos`.`id` AND l.`km` = 47793);
--> statement-breakpoint
INSERT INTO `vehiculos` (`tipo_id`, `alias`, `marca`, `modelo`, `anio`, `matricula`, `estado_id`, `propietario`, `notas`, `campos`)
SELECT 1, 'Marbella', 'SEAT', 'Marbella', 1997, 'A 9742 DB', 1, 'novaz',
	'Motor 903 cc de 4 cilindros (mecánica Fiat 127/Panda), unos 40 CV: comprobar en la ficha técnica
Más de 10 años: ITV cada año. Al cumplir 30 años (en 2027) puede catalogarse como vehículo histórico',
	'{"combustible":"Gasolina","aceite":"15W-40"}'
WHERE NOT EXISTS (SELECT 1 FROM `vehiculos` WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = 'A9742DB');
