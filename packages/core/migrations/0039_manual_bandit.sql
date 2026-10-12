-- Manual de servicio Suzuki GSF600 Bandit (99500-36102-01E) → ficha técnica y procedimientos de la Bandit (7858 CHK).
-- Todo verificado con su página del manual. Lo que ya hubieras verificado tú no se pisa; los procedimientos no se duplican.
-- Fuente: docs/manuales/suzuki-gsf600-bandit.novaz-ficha.json
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'aceite_motor', 'Aceite de motor', 'SAE 10W-40 · API SF/SG', NULL, 'Se cambia en caliente', 'Manual Suzuki 99500-36102-01E, p. 2-9', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'aceite_motor_litros', 'Cantidad de aceite (con filtro)', '3,5', 'L', 'Solo aceite: 3,3 L · tras revisión completa: 4,6 L', 'Manual Suzuki 99500-36102-01E, p. 2-10', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'bujias', 'Bujías', 'NGK CR9EK / DENSO U27ETR', NULL, 'Separación 0,6–0,7 mm · fría CR10EK/U31ETR · caliente CR8EK/U24ETR', 'Manual Suzuki 99500-36102-01E, p. 2-6', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'holgura_valvulas', 'Holgura de válvulas', 'ADM 0,10–0,15 · ESC 0,18–0,23', 'mm', 'En frío, con la marca «T» del rotor alineada con la captadora; dos posiciones (360°)', 'Manual Suzuki 99500-36102-01E, p. 2-4', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'ralenti', 'Ralentí', '1.200 ± 100', 'rpm', 'Con el motor caliente', 'Manual Suzuki 99500-36102-01E, p. 2-11', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'orden_de_encendido', 'Orden de encendido', '1-2-4-3', NULL, 'Cilindro 1 = el de la izquierda visto desde el asiento', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'compresion', 'Compresión', '10–15', 'bar', 'Límite 8 bar · diferencia máxima entre cilindros 2 bar', 'Manual Suzuki 99500-36102-01E, p. 2-24', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'presion_de_aceite', 'Presión de aceite', '3,0–6,0', 'bar', 'A 3.000 rpm con el aceite a 60 °C', 'Manual Suzuki 99500-36102-01E, p. 2-25', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'sincronizacion_de_carburadores', 'Sincronización de carburadores', '1.750', 'rpm', 'Con vacuómetro 09913-13121; tornillos en orden 1 → 2 → 3', 'Manual Suzuki 99500-36102-01E, p. 4-23', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'holgura_del_acelerador', 'Holgura del acelerador', '2–4', 'mm', 'En el puño', 'Manual Suzuki 99500-36102-01E, p. 2-12', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'holgura_del_cable_del_estarter', 'Holgura del cable del estárter', '0,5–1,0', 'mm', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-39', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'combustible', 'Combustible', 'Sin plomo, 91 RON o más (vale la 95)', NULL, 'Depósito 20 L · reserva 4,5 L', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'carburadores', 'Carburadores', '4 × Keihin CVR32SS (32 mm)', NULL, 'Principal #92 · aguja N1QL · surtidor de aguja Ø3,4 · baja #35 · tornillo de mezcla 1¾ vueltas (E-19 versión U: 1⅞) · flotador 17 ± 1 mm · mariposa 11°', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'motor', 'regimen_maximo', 'Régimen máximo', '12.000', 'rpm', 'No superar', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'transmision', 'kit_transmision', 'Kit de transmisión', 'Cadena RK50MFOZ1 · 112 eslabones · piñón 15 / corona 47', NULL, 'Cambiar cadena, piñón y corona juntos', 'Manual Suzuki 99500-36102-01E, p. 2-15', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'transmision', 'holgura_cadena', 'Holgura de la cadena', '25–35', 'mm', 'A mitad de tramo, con la moto en la pata lateral; marcas de los tensores iguales a ambos lados', 'Manual Suzuki 99500-36102-01E, p. 2-15', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'transmision', 'desgaste_de_la_cadena_20_pasos', 'Desgaste de la cadena (20 pasos)', '319,4', 'mm', 'Límite: medido sobre 21 bulones con la cadena tensa', 'Manual Suzuki 99500-36102-01E, p. 2-14', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'transmision', 'engrase_de_la_cadena', 'Engrase de la cadena', 'Cada 1.000 km', NULL, 'Limpiar solo con queroseno y engrasar con aceite de motor espeso; nada de «chain oil» comercial (daña las juntas tóricas)', 'Manual Suzuki 99500-36102-01E, p. 2-15', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'transmision', 'holgura_del_embrague', 'Holgura del embrague', '10–15', 'mm', 'En la maneta. Tornillo de desembrague: hasta notar resistencia y ¼ de vuelta atrás', 'Manual Suzuki 99500-36102-01E, p. 2-13', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'transmision', 'relaciones', 'Relaciones', '1.ª 3,083 · 2.ª 2,062 · 3.ª 1,647 · 4.ª 1,400 · 5.ª 1,227 · 6.ª 1,095', NULL, 'Primaria 1,744 · final 3,133', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'frenos', 'liquido_frenos', 'Líquido de frenos', 'DOT 4', NULL, 'De glicol: no mezclar con otros tipos. Cambiar cada 2 años; latiguillos cada 4', 'Manual Suzuki 99500-36102-01E, p. 2-16', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'frenos', 'disco_del_min', 'Espesor mínimo disco delantero', '4,0', 'mm', 'Estándar 4,5 ± 0,2 mm · alabeo máximo 0,30 mm', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'frenos', 'disco_tras_min', 'Espesor mínimo disco trasero', '4,5', 'mm', 'Estándar 5,0 ± 0,2 mm · alabeo máximo 0,30 mm', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'frenos', 'pastillas', 'Pastillas', 'Hasta la ranura testigo', NULL, 'Cambiarlas siempre por juegos', 'Manual Suzuki 99500-36102-01E, p. 2-17', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'frenos', 'altura_del_pedal_de_freno', 'Altura del pedal de freno', '50', 'mm', 'Por debajo de la parte de arriba del reposapiés', 'Manual Suzuki 99500-36102-01E, p. 2-17', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'ruedas', 'neumatico_del', 'Neumático delantero', '120/60 ZR17 (55W)', NULL, 'Llanta J17×MT3.50 · dibujo mínimo 1,6 mm · de serie Bridgestone BT56F', 'Manual Suzuki 99500-36102-01E, p. 2-20', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'ruedas', 'neumatico_tras', 'Neumático trasero', '160/60 ZR17 (69W)', NULL, 'Llanta J17×MT4.50 · dibujo mínimo 2,0 mm · de serie Bridgestone BT56R', 'Manual Suzuki 99500-36102-01E, p. 2-20', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'ruedas', 'presion_del', 'Presión delantera', '2,25', 'bar', 'En frío, solo o con pasajero', 'Manual Suzuki 99500-36102-01E, p. 2-20', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'ruedas', 'presion_tras', 'Presión trasera', '2,50', 'bar', 'En frío, solo o con pasajero', 'Manual Suzuki 99500-36102-01E, p. 2-20', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'ruedas', 'alabeo_maximo_de_llanta', 'Alabeo máximo de llanta', '2,0', 'mm', 'Axial y radial · alabeo del eje 0,25 mm', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'bateria', 'Batería', 'YTX9-BS (sin mantenimiento) · 12 V 8 Ah', NULL, 'Cargada ≥ 12,5 V en reposo; por debajo de 12,0 V, recargar. Carga 0,9 A 5–10 h o 4 A 1 h (nunca más de 4 A)', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'tension_de_carga', 'Tensión de carga', '13,6–14,4', 'V', 'A 5.000 rpm con las largas puestas', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'consumo_en_reposo', 'Consumo en reposo', '< 1', 'mA', 'Fuga máxima a la batería con todo apagado', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'bombilla_cruce', 'Bombilla de cruce', 'H4 60/55 W', NULL, 'Naked (N). La semicarenada (S) lleva 60 + 51/51 W', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'otras_lamparas', 'Otras lámparas', 'Freno/posición 21/5 W ×2 · intermitentes 21 W ×4 · matrícula 5 W', NULL, NULL, 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'fusibles', 'Fusibles', 'Principal 30 A · faro largo/corto 15/15 A · intermitentes 15 A · encendido 10 A · piloto trasero 10 A', NULL, NULL, 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'bobina_de_encendido', 'Bobina de encendido', 'Primario 2–4 Ω · secundario 30–40 kΩ', NULL, 'Pico en el primario > 140 V', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'electricidad', 'bobina_captadora', 'Bobina captadora', '135–200 Ω', NULL, 'Entre amarillo y azul · pico > 1,0 V', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_carter', 'Tapón del cárter', '23', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 2-9', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_bujias', 'Bujías', '11', 'N·m', 'Primero a mano y luego con la llave', 'Manual Suzuki 99500-36102-01E, p. 2-6', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_eje_del', 'Eje delantero', '65', 'N·m', 'Tornillo de apriete del eje: 23 N·m', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_eje_tras', 'Eje trasero', '100', 'N·m', 'La p. 2-15 dice 65 N·m, pero las tablas (p. 7-33 y 2-22) y la p. 5-31 dicen 100: usa 100', 'Manual Suzuki 99500-36102-01E, p. 5-31', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_filtro_aceite', 'Filtro de aceite', 'Contacto + 2 vueltas', NULL, 'Con la llave 09915-40610; nunca solo a mano', 'Manual Suzuki 99500-36102-01E, p. 2-10', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tapa_de_culata_10_tornillos', 'Tapa de culata (10 tornillos)', '14', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 2-5', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuercas_de_culata_m10', 'Tuercas de culata M10', '38', 'N·m', '12 tuercas', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornillo_de_culata_m6', 'Tornillo de culata M6', '10', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuerca_de_la_base_del_cilindro', 'Tuerca de la base del cilindro', '9', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_contratuerca_del_reglaje_de_valvulas', 'Contratuerca del reglaje de válvulas', '10', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_sombreretes_del_arbol_de_levas', 'Sombreretes del árbol de levas', '10', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_pinones_de_levas', 'Piñones de levas', '25', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tensor_de_la_distribucion_montaje', 'Tensor de la distribución (montaje)', '7', 'N·m', 'Porta-muelle: 35 N·m', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuercas_de_biela', 'Tuercas de biela', '20 → 35', 'N·m', 'En dos fases', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_bancada_m8', 'Bancada M8', '13 → 23', 'N·m', 'En dos fases y en orden numérico', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_bancada_m6', 'Bancada M6', '6 → 11', 'N·m', 'En dos fases', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tapon_de_la_galeria_principal_de_ace', 'Tapón de la galería principal de aceite', '40', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornillos_del_carter_de_aceite', 'Tornillos del cárter de aceite', '14', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuerca_del_buje_del_embrague', 'Tuerca del buje del embrague', '95', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornillos_de_los_muelles_del_embragu', 'Tornillos de los muelles del embrague', '12', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuerca_del_pinon_de_salida', 'Tuerca del piñón de salida', '115', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornillo_del_embrague_de_arranque', 'Tornillo del embrague de arranque', '150', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_rotor_del_generador_de_senal', 'Rotor del generador de señal', '25', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_colector_de_escape', 'Colector de escape', '23', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 2-7', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_silencioso', 'Silencioso', '29', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 2-7', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_anclajes_del_motor', 'Anclajes del motor', '55 / 75', 'N·m', 'L 50/55: 55 · L 130/175: 75', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_alternador', 'Alternador', '55 / 25', 'N·m', 'Tuerca del engranaje 55 · tornillos 25', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_interruptor_de_presion_de_aceite', 'Interruptor de presión de aceite', '14', 'N·m', 'Regulador de presión: 28 N·m', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_racores_del_radiador_de_aceite', 'Racores del radiador de aceite', '23', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuerca_de_la_tija_superior', 'Tuerca de la tija superior', '65', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_abrazaderas_de_la_horquilla_y_tapon', 'Abrazaderas de la horquilla y tapón', '23', 'N·m', 'Superiores e inferiores', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornillo_del_fondo_de_la_barra', 'Tornillo del fondo de la barra', '30', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_soportes_del_manillar', 'Soportes del manillar', '23', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_pinza_de_freno_delantera', 'Pinza de freno delantera', '39', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_bomba_de_freno_delantera', 'Bomba de freno delantera', '10', 'N·m', 'Abrazadera', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_banjos_de_freno', 'Banjos de freno', '23', 'N·m', 'Delanteros y traseros', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_purgadores_de_freno', 'Purgadores de freno', '8', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 2-18', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornillos_de_los_discos', 'Tornillos de los discos', '23', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_pinza_trasera', 'Pinza trasera', '25 / 30', 'N·m', 'Montaje 25 · carcasa 30', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_bomba_de_freno_trasera', 'Bomba de freno trasera', '23', 'N·m', 'Contratuerca del vástago: 18 N·m', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_eje_del_basculante', 'Eje del basculante', '100', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_amortiguador_trasero', 'Amortiguador trasero', '50', 'N·m', 'Arriba y abajo', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_bieletas_de_la_suspension', 'Bieletas de la suspensión', '78', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tuercas_de_la_corona', 'Tuercas de la corona', '50', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tirante_de_la_pinza_trasera', 'Tirante de la pinza trasera', '35', 'N·m', NULL, 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_reposapies_delantero', 'Reposapiés delantero', '39', 'N·m', 'Soporte: 23 N·m', 'Manual Suzuki 99500-36102-01E, p. 7-33', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'pares', 'par_tornilleria_generica', 'Tornillería genérica', 'M5 3/5 · M6 6/10 · M8 13/23 · M10 29/50 · M12 45/85', NULL, 'Tornillo sin marca o con marca «4» / con marca «7»', 'Manual Suzuki 99500-36102-01E, p. 7-34', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'recambios', 'filtro_aceite_ref', 'Filtro de aceite', 'Original Suzuki de moto', NULL, 'El manual exige filtro original Suzuki de moto: otros pueden cambiar la rosca o el filtrado (ni siquiera el de coche de Suzuki)', 'Manual Suzuki 99500-36102-01E, p. 2-10', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'recambios', 'cadena', 'Cadena', 'RK50MFOZ1 · 112 eslabones', NULL, NULL, 'Manual Suzuki 99500-36102-01E, p. 2-15', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'otros', 'aceite_de_horquilla', 'Aceite de horquilla', 'Fork oil #10', NULL, 'Por barra: 508 ml (N) / 510 ml (S). Nivel sin muelle y barra comprimida: 114 mm (N) / 112 mm (S). Muelle: longitud libre mínima 358 mm (N) / 356 mm (S)', 'Manual Suzuki 99500-36102-01E, p. 5-18', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'otros', 'amortiguador_trasero_estandar', 'Amortiguador trasero (estándar)', 'Precarga 4.ª de 7 · extensión 2.ª de 4', NULL, NULL, 'Manual Suzuki 99500-36102-01E, p. 5-40', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'otros', 'direccion', 'Dirección', '200–500 g', NULL, 'Fuerza inicial en el extremo del manillar', 'Manual Suzuki 99500-36102-01E, p. 5-25', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'otros', 'discos_de_embrague_friccion', 'Discos de embrague (fricción)', '2,62 mm (límite)', NULL, 'Estándar 2,92–3,08 mm · muelle del embrague: longitud libre mínima 47,6 mm', 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'otros', 'peso_en_seco', 'Peso en seco', '204 kg (N) · 208 kg (S)', NULL, NULL, 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `datos_tecnicos` (`vehiculo_id`, `seccion`, `clave`, `nombre`, `valor`, `unidad`, `detalle`, `fuente`, `verificado`)
SELECT v.`id`, 'otros', 'herramientas_especiales_suzuki', 'Herramientas especiales Suzuki', '09915-40610 filtro · 09917-14910 válvulas · 09900-20803 galgas · 09930-10121 bujías · 09913-13121 vacuómetro · 09915-64510 compresímetro · 09915-74510 manómetro de aceite · 09943-74111 nivel horquilla', NULL, NULL, 'Manual Suzuki 99500-36102-01E', 1 FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
ON CONFLICT(`vehiculo_id`, `clave`) DO UPDATE SET `seccion` = excluded.`seccion`, `nombre` = excluded.`nombre`, `valor` = excluded.`valor`, `unidad` = excluded.`unidad`, `detalle` = excluded.`detalle`, `fuente` = excluded.`fuente`, `verificado` = 1, `actualizado` = datetime('now')
WHERE `datos_tecnicos`.`verificado` = 0;
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Cambio de aceite y filtro', 45, '["Bandeja de aceite", "Llave de vaso para el tapón del cárter", "Llave de filtro 09915-40610", "Embudo"]', '[{"texto": "Calienta el motor unos minutos: el aceite se cambia en caliente.", "par": null}, {"texto": "Pon la moto recta (caballete central) y la bandeja debajo del motor.", "par": null}, {"texto": "Quita el tapón de llenado y el tapón de vaciado y deja que escurra todo.", "par": null}, {"texto": "Si toca filtro: quítalo con la llave especial.", "par": null}, {"texto": "Unta con un poco de aceite la junta tórica del filtro nuevo (original Suzuki de moto).", "par": null}, {"texto": "Rosca el filtro a mano hasta que la junta toque y dale 2 vueltas completas con la llave.", "par": "Contacto + 2 vueltas"}, {"texto": "Pon el tapón de vaciado.", "par": "23 N·m"}, {"texto": "Llena con 10W-40 API SF/SG: 3,3 L si solo cambias aceite, 3,5 L con filtro.", "par": null}, {"texto": "Arranca y déjala al ralentí unos minutos.", "par": null}, {"texto": "Para el motor, espera 3 minutos y mira el visor: el nivel entre «L» y «F»; si falta, rellena hasta «F».", "par": null}]', 'Aceite cada 6.000 km o 6 meses; filtro cada 18.000 km o 18 meses (y siempre a los primeros 1.000). → p. 2-9 y 2-10' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Cambio de aceite y filtro');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Reglaje de válvulas', 180, '["Galgas 09900-20803", "Llave de reglaje 09917-14910", "Llave fija de 19", "Llave de bujías", "Suzuki Bond 1207B"]', '[{"texto": "Quita el asiento y el depósito (→ p. 4-3).", "par": null}, {"texto": "Quita las cuatro bujías.", "par": null}, {"texto": "Quita la tapa de culata y la tapa del generador de señal (→ p. 3-12 y 3-13).", "par": null}, {"texto": "Gira el cigüeñal en sentido horario con la llave de 19 hasta alinear la marca «T» del rotor con la bobina captadora y las muescas de los árboles de levas en la posición A.", "par": null}, {"texto": "Mide en esa posición: admisión y escape del cilindro 1, escape del 2 y admisión del 3 (galga entre el vástago y el tornillo de reglaje).", "par": null}, {"texto": "Si alguna está fuera de medida: sujeta la contratuerca y ajusta con la llave especial; deja izquierda y derecha lo más iguales posible.", "par": "Contratuerca 10 N·m"}, {"texto": "Gira el cigüeñal una vuelta completa (360°) hasta la posición B y mide y ajusta el resto de válvulas.", "par": null}, {"texto": "Pon Suzuki Bond 1207B en la ranura de la tapa y en los tapones de los árboles de levas, y monta la tapa de culata.", "par": "14 N·m"}, {"texto": "Monta la tapa del generador de señal y las bujías (primero a mano).", "par": "Bujías 11 N·m"}]', 'En frío. A los 1.000 km y cada 12.000 km o 12 meses. ADM 0,10–0,15 mm · ESC 0,18–0,23 mm. → p. 2-4 y 2-5' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Reglaje de válvulas');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Bujías: revisar y cambiar', 30, '["Llave de bujías 09930-10121", "Galgas 09900-20803", "Destornillador plano"]', '[{"texto": "Quita las pipas (si cuesta, haz palanca con un destornillador) y saca las bujías.", "par": null}, {"texto": "Mira la carbonilla y el electrodo: si está muy gastado o quemado, el aislante roto o la rosca dañada, cámbiala.", "par": null}, {"texto": "Mide la separación de los electrodos con las galgas y ajústala si hace falta.", "par": "0,6–0,7 mm"}, {"texto": "Rosca cada bujía a mano hasta el fondo para no dañar la rosca de la culata.", "par": null}, {"texto": "Apriétala con la llave de bujías.", "par": "11 N·m"}]', 'Revisar cada 6.000 km; cambiar cada 12.000 km. NGK CR9EK o DENSO U27ETR. → p. 2-5 y 2-6' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Bujías: revisar y cambiar');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Filtro de aire', 40, '["Destornillador", "Aire a presión"]', '[{"texto": "Quita el asiento y el depósito (→ p. 4-3).", "par": null}, {"texto": "Quita el soporte del depósito y la tapa del filtro.", "par": null}, {"texto": "Saca el elemento filtrante.", "par": null}, {"texto": "Límpialo con aire a presión SIEMPRE desde dentro hacia fuera (desde fuera mete la suciedad en los poros).", "par": null}, {"texto": "Monta el elemento limpio o nuevo con la marca «*» hacia arriba y cierra en orden inverso.", "par": null}, {"texto": "Quita el tapón del tubo de drenaje de la caja del filtro para vaciar el agua que haya.", "par": null}]', 'Revisar cada 6.000 km; cambiar cada 18.000 km (antes si ruedas con polvo). → p. 2-7 y 2-8' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Filtro de aire');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Cadena: revisar, tensar y engrasar', 30, '["Caballete central", "Llave del eje trasero", "Llave dinamométrica", "Cinta métrica", "Queroseno y brocha", "Aceite de motor espeso"]', '[{"texto": "En punto muerto y con la moto en el caballete central, gira la rueda a mano y busca bulones flojos, rodillos dañados, eslabones secos, oxidados o duros y juntas tóricas que falten.", "par": null}, {"texto": "Para medir el desgaste: afloja la tuerca del eje, tensa la cadena del todo con los tensores y mide 21 bulones (20 pasos). Si pasa de 319,4 mm, cambia cadena, piñón y corona juntos.", "par": "Límite 319,4 mm"}, {"texto": "Pon la moto en la pata lateral y ajusta los tensores hasta tener 25–35 mm de flecha a mitad del tramo entre piñón y corona.", "par": "25–35 mm"}, {"texto": "Comprueba que las marcas de los tensores coinciden en los dos lados del basculante (rueda alineada).", "par": null}, {"texto": "Aprieta la tuerca del eje trasero y luego los dos tensores.", "par": "100 N·m (ver nota de la ficha)"}, {"texto": "Limpia la cadena SOLO con queroseno (nunca gasolina, tricloroetileno ni disolventes: dañan las juntas tóricas).", "par": null}, {"texto": "Seca y engrasa con aceite de motor espeso. Nada de «chain oil» comercial.", "par": null}]', 'Revisar a los 1.000 km y cada 6.000 km; engrasar cada 1.000 km. Cadena RK50MFOZ1 (112 eslabones, 15/47). → p. 2-14 y 2-15' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Cadena: revisar, tensar y engrasar');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Purgar frenos / cambiar el líquido', 45, '["Manguito transparente", "Bote", "Llave del purgador", "DOT 4 nuevo (envase cerrado)", "Trapos"]', '[{"texto": "Moto recta y manillar recto. Llena el depósito hasta arriba del visor y pon la tapa.", "par": null}, {"texto": "Pon un manguito en el purgador de la pinza con el otro extremo dentro de un bote.", "par": null}, {"texto": "Bombea la maneta varias veces rápido y apriétala a fondo sin soltar.", "par": null}, {"texto": "Abre el purgador ¼ de vuelta: sale líquido y la maneta llega al puño. Cierra el purgador.", "par": null}, {"texto": "Repite bombear, apretar y abrir hasta que el líquido salga sin burbujas. Que nunca se vacíe el depósito: rellena mientras purgas.", "par": null}, {"texto": "Cierra el purgador, quita el manguito y llena el depósito hasta arriba del visor.", "par": "Purgador 8 N·m"}, {"texto": "El trasero se purga igual, accionando el pedal en lugar de la maneta.", "par": null}]', 'Líquido cada 2 años; latiguillos cada 4 años. DOT 4 de glicol: no mezclar con otros. Cuidado: ataca la pintura y los plásticos. → p. 2-16 a 2-19' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Purgar frenos / cambiar el líquido');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Ajustar la holgura del embrague', 20, '["Llaves fijas", "Destornillador"]', '[{"texto": "Afloja la contratuerca del regulador de la maneta y mete el regulador hasta el fondo.", "par": null}, {"texto": "Quita la tapa del mecanismo de desembrague.", "par": null}, {"texto": "Afloja la contratuerca y saca el tornillo de reglaje 2 o 3 vueltas.", "par": null}, {"texto": "Mete el tornillo despacio hasta notar resistencia, sácalo ¼ de vuelta y aprieta la contratuerca.", "par": null}, {"texto": "Con el regulador del cable, deja 10–15 mm de holgura en el extremo de la maneta y aprieta su contratuerca.", "par": "10–15 mm"}]', 'Revisar cada 6.000 km. Holgura en la maneta: 10–15 mm. → p. 2-13' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Ajustar la holgura del embrague');
--> statement-breakpoint
INSERT INTO `procedimientos` (`vehiculo_id`, `titulo`, `tiempo_min`, `herramientas`, `pasos`, `notas`)
SELECT v.`id`, 'Sincronizar los carburadores', 90, '["Vacuómetro 09913-13121", "Botella de gasolina auxiliar", "Tapones para las tomas de vacío", "Destornillador"]', '[{"texto": "Quita el depósito y alimenta los carburadores con una botella de gasolina auxiliar.", "par": null}, {"texto": "Desconecta los tubos de vacío de la llave de gasolina (carburador 4) y del PAIR (carburador 3) y tapa esas tomas.", "par": null}, {"texto": "Arranca y deja que se caliente; para el motor.", "par": null}, {"texto": "Calibra el vacuómetro: con una manguera en una toma, motor a 1.750 rpm, ajusta cada tubo hasta que la bola quede en la línea central.", "par": null}, {"texto": "Conecta las cuatro mangueras a las tomas de los cuatro carburadores.", "par": null}, {"texto": "Con el motor a 1.750 rpm, ajusta los tornillos de sincronización en el orden 1 → 2 → 3 hasta que las cuatro bolas queden a la misma altura.", "par": "1.750 rpm"}, {"texto": "Quita el vacuómetro, vuelve a conectar los tubos de vacío y ajusta el ralentí.", "par": "1.200 ± 100 rpm"}]', 'Cada 12.000 km. A 1.750 rpm; tornillos en orden 1 → 2 → 3. Después, ralentí a 1.200 ± 100 rpm. → p. 4-23 a 4-25' FROM `vehiculos` v WHERE replace(replace(upper(v.`matricula`), '-', ''), ' ', '') = '7858CHK'
AND NOT EXISTS (SELECT 1 FROM `procedimientos` x WHERE x.`vehiculo_id` = v.`id` AND x.`titulo` = 'Sincronizar los carburadores');
