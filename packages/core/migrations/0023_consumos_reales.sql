-- Consumos reales: Bandit 7 L/100 km, Ibiza 5,8 L/100 km
UPDATE `vehiculos` SET `campos` = json_set(`campos`, '$.consumo', 7)
WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '7858CHK';
--> statement-breakpoint
UPDATE `vehiculos` SET `campos` = json_set(`campos`, '$.consumo', 5.8)
WHERE replace(replace(upper(`matricula`), '-', ''), ' ', '') = '6780JNX';
