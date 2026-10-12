# SEAT Marbella 0.9i SPI (028 A1/A3, motor 08 NCB): síntesis de taller

Actualizado el 2026-10-12. No existe un manual oficial público del Marbella 0.9i: estos datos salen de varias fuentes, y cada uno lleva su fiabilidad y su fuente (las claves de fuente se explican en `fuentes.md`). Versión del coche: **0.9 Cat con cambio de 5 marchas**.

**Fiabilidad**

- **A**: Publicado para el Marbella 0.9i (ficha, catálogo de recambios del Marbella)
- **B**: Del mismo motor (899 i.e. de Panda/Cinquecento) o del mismo chasis (manual SEAT del Panda con ballestas, anterior a 1986), sin contradicción
- **C**: Fuente única débil, de otro motor/chasis, o fuentes contradictorias: verificar antes de usar
- **⏳ pend.**: no encontrado. Queda vacío a propósito.

> [!warning] Lo más importante
> - **Centralita Magneti Marelli IAW 16S.S0 con inmovilizador** (motor 08 NCB, nov. 1996). Su pineado no está publicado: la sección 9.5 da el de la 16F con una prueba por pin para confirmarlo en tu coche.
> - **Taqués hidráulicos: no se reglan.** El 0,40/0,50 mm que circulaba es del motor 1108 OHC, y el 0,15/0,20 mm es del Marbella de carburación.
> - **Cambio de 5 marchas, grupo 4,500.** El capítulo de cambio del manual SEAT del Panda es de la caja de 4: úsalo solo como orientación.
> - **Pares de chasis del Marbella (Bucheli, A)**: ruedas 86, tuerca del buje delantero **216** (no los 196 del Panda), portapinzas 62, ballestas 39/29/49. Sección 6.
> - **Caja de 5: aceite 2,95 L** (no 2,40) y relaciones confirmadas (sección 2).
> - **Culata del 899**: 30 N·m + 90° + 90°, de una sola fuente (B). No uses el procedimiento del 903 (49/59 N·m).
> - Los datos internos del motor (sección 7) son del **903 de carburación**. Sirven de orientación, no son cotas de montaje del 899.

---

## 1. Ficha técnica

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Versión | **0.9 Cat, 899 cc, 41 CV (30 kW), inyección monopunto, catalizador y sonda lambda** | A | ADAC; AUTODATA; ULTI |  |
| Periodo | **1996-1998 (ADAC: 03/97-04/98; auto-data: 1996-1998)** | A | ADAC; AUTODATA | Las fuentes difieren en el inicio. La documentación del coche manda. |
| Código de motor SEAT | **08 NCB** | A | FICHA; AUTODATA; MANN | Confirmado en la ficha técnica del coche. Los 0.9 Cat anteriores llevaban el 09 NCB. |
| Tipo / variante | **Tipo 028 A1, variante 028 A3** | A | FICHA |  |
| Fecha de la ficha | **Certificado de conformidad del 29/11/1996** | A | FICHA |  |
| Equivalente Fiat | **1170A1.046 (Fiat Panda 141 900 i.e., Cinquecento 900 i.e.)** | B | CINQ; CAT-TAQ | Misma cilindrada, cotas y tipo de taqués. Ninguna fuente dice literalmente «08 NCB = 1170A1.046». |

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Tipo | **Gasolina, 4 cil. en línea, transversal delantero, 8 válvulas OHV (árbol de levas en bloque, varillas y balancines)** | A | ULTI; ADAC; SEAT-P |  |
| Cilindrada (cc) | **899** | A | FICHA; ADAC; ULTI |  |
| Diámetro × carrera (mm) | **65 × 67,7** | A | ULTI | El 903 de carburación era 65 × 68 (SEAT-P). |
| Compresión | **8,8 : 1** | A | LIBRO-DE; ULTI | El libro alemán lo da para la versión catalizada. Los de carburación eran 8,5 : 1 (libro) o 9 : 1 (manual SEAT). |
| Potencia | **30 kW (41 CV) a 5800 rpm; potencia fiscal 8,23 CVF** | A | FICHA; ADAC; ULTI; QR | La ficha confirma los 30 kW y la potencia fiscal. Quattroruote da 5900 rpm. |
| Par máximo | **60 N·m (6,1 mkp) a 2800 rpm** | A | LIBRO-DE; ADAC; ULTI; QR |  |
| Distribución | **Cadena (árbol de levas en bloque)** | A | ADAC; SEAT-P |  |
| Taqués | **Hidráulicos: no llevan reglaje de holgura** | A | CAT-TAQ; CINQ | Catálogos del Marbella 0.9 Cat y del 1170A1.046 los dan como hidráulicos. Comprobación en el coche: los balancines no llevan tornillo de reglaje con contratuerca. |
| Alimentación | **Inyección monopunto (SPI) Magneti Marelli, en lazo cerrado con sonda lambda: IAW 16S.S0 con inmovilizador (los 0.9 Cat anteriores llevaban la IAW 6F.SF)** | A | PROPIETARIO; ECUDIAG; DESG-6F; FICHA; ULTI; ADAC | Sección 9: pineado e inmovilizador. |
| Orden de encendido | **1-3-4-2** | B | CINQ | Cilindro 1 en el lado de la distribución (convención Fiat): pendiente de confirmar en el 899. |
| Emisiones | **Euro 2** | A | ADAC |  |
| Combustible | **Gasolina sin plomo 95 (Super)** | A | ADAC |  |
| Transmisión | **Delantera, cambio manual de 5 marchas, grupo 4,500** | A | ADAC; HSEAT; ULTI-5V |  |
| Prestaciones | **135 km/h, 0-100 en 19,2 s, 6,1 L/100 km mixto** | A | ADAC; ULTI |  |
| Peso en vacío (kg) | **720** | A | FICHA | Tara de la ficha técnica. ADAC y ultimatespecs dan 695 kg. |
| MMA por eje (kg) | **Delantero 580 · trasero 620** | A | FICHA |  |
| Remolque (kg) | **375 sin freno · 750 con freno** | A | FICHA |  |
| MMA (kg) | **1150** | A | FICHA; ADAC |  |
| Dimensiones (mm) | **Largo 3475 · ancho 1500 · alto 1445 · batalla 2160 · vías 1256/1250 · voladizo trasero 641** | A | FICHA | De la ficha técnica. |
| Neumáticos y llanta | **135 R13 (135/80 R13); opción homologada 145/70 R13. Llanta 4.00B × 13 (4,5" según ultimatespecs)** | A | FICHA; ADAC; ULTI; SEAT-P | En la ficha, la línea de opciones está doblada y no se lee entera: puede haber más medidas homologadas. |
| Frenos | **Delante disco macizo Ø 227 mm con pinza flotante; detrás tambor Ø 185 mm, autoajustables; regulador de presión trasero** | B | SEAT-P | El dato anterior (228 mm) no coincide: el manual SEAT dice 227. |
| Suspensión | **Delante McPherson con muelle helicoidal; detrás eje rígido tubular con dos ballestas longitudinales de dos hojas** | A | ADAC; ULTI; SEAT-P |  |
| Dirección | **Cremallera, 3,8 vueltas de tope a tope; recorrido de la cremallera 130 ± 1,5 mm** | A | LIBRO-DE; SEAT-P | El Bucheli da 3,8 vueltas; ultimatespecs y el manual del Panda, 3,4. |
| Diámetro de giro (m) | **9,2** | A | LIBRO-DE; SEAT-P | ultimatespecs da 9,3 m y ADAC 9,6 m. |
| Encendido | **Estático de chispa perdida, dos bobinas (1+4 y 2+3), sin delco** | B | IAW16F-DOC; FF-SPI-ENC | En los SPI el agujero del delco de la culata va tapado. |

## 2. Transmisión (cambio de 5 marchas)

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Cambio | **Manual de 5 marchas + marcha atrás** | A | ADAC; HSEAT; LIBRO-DE | El Bucheli trae el procedimiento de la caja de 5 en las págs. 59-66. El manual del Panda y el Cinquecento son de 4 marchas. |
| Grupo final | **4,500 (72:16)** | A | LIBRO-DE; HSEAT; ULTI-5V | El 850 de 5 marchas llevaba 4,785 y las cajas de 4, 4,071. |
| Relaciones | **1.ª 3,500 · 2.ª 1,952 · 3.ª 1,323 · 4.ª 0,972 · 5.ª 0,769 · MA 3,642** | A | LIBRO-DE | Bucheli págs. 49 y 117-118, «900er 5-Gang». |
| Desarrollos | **A 1000 rpm: 1.ª 6,5 · 2.ª 11,7 · 3.ª 17,3 · 4.ª 23,5 · 5.ª 29,8 km/h** | C | NOVAZ | Calculado con grupo 4,500 y rueda 135/80 R13 (perímetro teórico 1,716 m). En la práctica, un 2-3 % menos. |
| Datos de montaje | **Rodamientos de agujas: montar a 110 °C · precarga de los rodamientos cónicos del diferencial 0,080** | A | LIBRO-DE |  |
| Palieres | **Posición de los fuelles desde la cara frontal: derecho 107 ± 1, izquierdo 138 ± 1 · grasa NLGI 2** | C | LIBRO-DE | Columna de la caja de 5 en la pág. 118 (con 4 marchas: 123/146 y grasa MoS2): confírmalo con el procedimiento del capítulo 9. |
| Aceite del cambio | **2,95 L** | A | LIBRO-DE | La caja de 4 lleva 2,15 L. El 2,40 L del foro no vale. |
| Tipo de aceite | **SAE 80W-90 GL-4 (ZC 80VV90)** | A | LIBRO-DE; AUTODOC-ACE |  |
| Cambio de aceite | **Cada 6-8 años** | C | AUTODOC-ACE | Es la recomendación de una tienda, no del fabricante. |
| Embrague | **Monodisco en seco por cable; disco Ø 170/120 mm; pedal 15-20 mm por debajo del de freno** | A | LIBRO-DE; SEAT-P |  |

## 3. Fluidos y capacidades

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Aceite motor | **SAE 15W-40, API SG (el libro alemán pide SAE 20W-40)** | B | LIBRO-DE; CINQ; SEAT-P | El 20W-40 era el grado de la época. Hoy un 15W-40 o 10W-40 API SG o superior cumple de sobra. Los taqués hidráulicos agradecen aceite limpio. |
| Aceite motor, con filtro (L) | **3,6 con filtro · 3,4 sin filtro** | A | LIBRO-DE; AUTODATA | RESUELTO: el libro alemán (versión KAT) y auto-data (Marbella 0.9 Cat) coinciden. El 3,75 L era del Cinquecento y el 3,88 L del Panda 903. |
| Aceite del cambio | **SAE 80W-90 GL-4 (de origen ZC 80VV90)** | A | LIBRO-DE; SEAT-P; CINQ | No uses GL-5: es criterio de taller por los sincronizadores, no viene en las fuentes. |
| Aceite del cambio (L) | **2,95** | A | LIBRO-DE | Caja de 5. La de 4 lleva 2,15 L. El 2,40 L citado en un foro y en el manual del Panda era de la caja de 4: no vale para la tuya. Llena hasta el borde del tapón de nivel. |
| Refrigerante (L) | **5,2** | A | AUTODATA; SEAT-P | Coinciden auto-data (Marbella 0.9 Cat) y el manual SEAT (Panda 45). El 4,8 L es del Cinquecento, que tiene otro radiador. |
| Refrigerante, mezcla | **Agua + anticongelante al 50 %** | B | SEAT-P |  |
| Líquido de frenos | **DOT 4, 0,37 L** | A | LIBRO-DE; SEAT-P | El manual del Panda pedía DOT 3 (0,33 L). |
| Depósito (L) | **35, de ellos 7-8 de reserva** | A | LIBRO-DE; ADAC; ULTI; AUTODATA |  |
| Lavaparabrisas | **Agua con un 3 % de detergente (2 L); en invierno, 50 % de anticongelante** | B | SEAT-P |  |

## 4. Plan de mantenimiento (propuesta)

No hay plan oficial publicado para el Marbella. Esta es una propuesta de Novaz para un clásico de pocos km (fiabilidad C). Se aplica lo que llegue antes, km o meses.

| Tarea | Cada km | Cada meses | Nota |
|---|---|---|---|
| Aceite motor + filtro | 5.000 | 12 | Cambio. Los taqués hidráulicos son sensibles al aceite viejo. |
| Nivel aceite, refrigerante, frenos | 1.000 | 1 | Revisión antes de cada salida larga. |
| Filtro de aire | 15.000 | 24 | Cambio. |
| Bujías | 15.000 | 24 | Cambio y control de la separación (0,8 mm). |
| Filtro de gasolina | 30.000 | 48 | Cambio. Revisar los manguitos (la gasolina va a presión). |
| Correa alternador/bomba de agua | 15.000 | 24 | Revisar tensión y grietas; cambiar cada 4 años. |
| Líquido de frenos | — | 24 | Cambio completo y purga. |
| Refrigerante | — | 24 | Cambio. Comprobar el termostato y el electroventilador. |
| Aceite del cambio | 60.000 | 48 | Revisar nivel cada 15 000 km. |
| Frenos (pastillas, discos, zapatas, tambores) | 10.000 | 12 | Comprobar contra los límites de desgaste. |
| Latiguillos de freno | — | 48 | Cambiar si están agrietados. El manual recomienda cambiar los dos a la vez. |
| Suspensión y ballestas | 10.000 | 12 | Silentblocks, gemelas, abarcones y amortiguadores. |
| Dirección y rótulas | 10.000 | 12 | Holguras, fuelles de la cremallera y guardapolvos. |
| Neumáticos | 5.000 | 6 | Presión mensual. Cambiarlos a los 6-8 años aunque tengan dibujo. |
| Cadena de distribución | 60.000 | — | Escuchar si golpea en frío. No hay intervalo de cambio publicado. |
| Sonda lambda | 60.000 | — | Comprobar CO y lambda antes de cada ITV. |
| Batería y masas | — | 12 | Limpiar los bornes y las masas al chasis y al motor. |
| Engrase de bisagras y cerraduras | — | 12 |  |

## 5. Reglajes

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Taqués | **Hidráulicos: sin reglaje** | A | CAT-TAQ; CINQ | El 0,40/0,50 ± 0,05 mm venía del motor 1108 OHC (está en la misma ficha del foro). El 0,15/0,20 mm es del 843/903 de carburación (SEAT-P y FC-REGLAJE): solo vale si el coche lleva taqués mecánicos. |
| Taqués mecánicos (solo carburación) | **ADM 0,15 · ESC 0,20 mm en frío (0,60 mm para comprobar el calado)** | A | LIBRO-DE; SEAT-P; FC-REGLAJE | Solo para Marbella con taqués mecánicos (843/903, incluido el 903 KAT de carburador electrónico del Bucheli). No aplica a tu 899 SPI, que los lleva hidráulicos. |
| Bujía | **Champion RN9YCC, separación 0,8 mm. Equivalentes: Bosch WR7D, Marelli F7LCR (0,7-0,8 mm)** | B | CINQ; LIBRO-DE | Las equivalencias son las del 903 KAT del Bucheli, con el mismo grado térmico. |
| Ralentí (rpm) | **850 ± 50 (no regulable: lo controla la centralita)** | B | CINQ |  |
| Avance de encendido | **11° ± 3° a 850 rpm** | B | CINQ |  |
| CO al ralentí | **< 0,5 %** | B | CINQ; ITV |  |
| Presión de gasolina | **1,1 ± 0,2 bar regulada** | B | CINQ |  |
| Válvula de sobrepresión | **Abre a 2,6 bar** | B | CINQ |  |
| Caudal de la bomba de gasolina | **≥ 110 L/h** | B | CINQ |  |
| Tiempo de inyección al ralentí | **1,5 ms de tiempo de inyección al ralentí** | B | CINQ |  |
| Presión de aceite | **2,94-3,92 bar con el aceite a 100 °C** | C | SEAT-P | Dato del 903. Muelle de la válvula de descarga: 4,61 ± 0,15 kg a 22,5 mm. |
| Termostato | **Empieza a abrir a 85 °C, abierto del todo a 89 °C, carrera ≥ 7,5 mm** | C | SEAT-P | Dato del 903. |
| Termocontacto del electroventilador | **Conecta a 90-94 °C, desconecta a 85-89 °C** | C | SEAT-P | Dato del 903. |
| Prueba de estanqueidad del radiador | **0,98 bar** | C | SEAT-P | Dato del 903. |
| Presión de neumáticos 135/80 R13 | **2,0 bar delante y detrás** | A | LIBRO-DE; SEAT-P; PRES | Bucheli, para 135 SR 13 y 145/70 R13. El manual del Panda da 1,7/1,8 bar a media carga y 1,8/2,0 a plena carga. |
| Alineación delantera | **Caída 1°34,5' ± 30' · avance 1°40' ± 30' · convergencia −1,41 ± 2 mm (−6' ± 10')** | A | LIBRO-DE | Marbella con caja de 5. El manual del Panda de 1980 daba otros valores (avance 3° ± 30'): usa los del Bucheli. La convergencia se regula en las bieletas. |
| Alineación trasera | **No regulable (eje rígido)** | B | SEAT-P |  |
| Freno de mano | **Regulado cuando la palanca sube 4 o 5 dientes del trinquete** | B | SEAT-P |  |
| Pedal de embrague | **15-20 mm por debajo del plano del pedal de freno (tuerca del cable en la caja)** | A | LIBRO-DE | El manual del Panda decía «a la misma altura». |
| Caja de dirección, precarga | **Precarga del empujador 0,05-0,13 mm · par de giro del piñón 1,35 N·m · grasa ESTERAK 1** | A | LIBRO-DE; SEAT-P |  |
| Ángulos de giro | **Rueda exterior 31° ± 1°30' · rueda interior 33°30' ± 1°30'** | A | LIBRO-DE; SEAT-P |  |

## 6. Pares de apriete (N·m)

Fuente principal: Bucheli, págs. 122-123 (pares del Marbella). Los críticos van marcados en la nota.

### Motor

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Culata | **30 N·m + 90° + 90°** | B | CINQ | CRÍTICO. Es el procedimiento del 899 (Cinquecento). El Bucheli da 60 N·m para el 903 de carburación y el manual SEAT del Panda 49 o 59 N·m: son otros tornillos y otro procedimiento, no los mezcles. Orden en espiral desde el centro. |
| Bancada | **69** | A | LIBRO-DE; CINQ; SEAT-P | Coinciden las tres fuentes. |
| Biela | **41** | A | LIBRO-DE; CINQ; SEAT-P | Coinciden las tres fuentes. |
| Volante motor | **44** | A | LIBRO-DE; SEAT-P; CINQ | El Cinquecento da 45. |
| Polea del cigüeñal | **98** | B | SEAT-P; CINQ; LIBRO-DE | Manual SEAT: 98 N·m (10 kgm); Cinquecento: 100. En la tabla del Bucheli aparece 98 N·m en la primera fila, etiquetada «alternador al bloque»: casi seguro es este par. |
| Piñón del árbol de levas | **45-49** | B | LIBRO-DE; SEAT-P; CINQ | 49 N·m en el Bucheli y el manual SEAT (903); 45 N·m en el Cinquecento 899. |
| Soportes del eje de balancines | **39** | A | LIBRO-DE; SEAT-P; CINQ | 40 en el Cinquecento. |
| Colector de escape | **20** | C | LIBRO-DE | Bucheli pág. 122, leído de una foto inclinada: confírmalo. |
| Cárter | **7,8** | C | LIBRO-DE | Ídem. |
| Tapón del cárter | **30** | C | LIBRO-DE | Ídem. |
| Tapa de distribución | **7,8** | C | LIBRO-DE | Ídem. |
| Bomba de agua | **25** | C | LIBRO-DE | Ídem. |
| Embrague al volante | **16** | C | LIBRO-DE | Ídem. |
| Carcasa del termostato | **15** | C | LIBRO-DE | Ídem. |
| Bomba de aceite | **15 (al bloque) · 4,9 (M6 y tapa)** | C | LIBRO-DE | Ídem. |
| Manocontacto de aceite | **35** | C | LIBRO-DE | Ídem. |
| Tapa de balancines | **4,5-8** | C | LIBRO-DE; CINQ | El Cinquecento da 8; en la foto del Bucheli parece 4,5. Es una tapa de chapa: aprieta suave. |
| Bujías | **27-32** | C | CINQ; LIBRO-DE | 27 en el Cinquecento; en la foto del Bucheli parece 32. |
| Soportes del motor | **Soporte derecho M12: 88 · taco derecho a carrocería: tornillo M8 25, tuerca M8 15 · taco izquierdo a carrocería: 25 · soporte izquierdo M12: 88** | B | LIBRO-DE | Final de la tabla de la pág. 122, bastante legible. |
| Sonda lambda | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Cuerpo de mariposa / inyección | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |

### Cambio de 5 marchas

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Cambio al motor | **78** | A | LIBRO-DE | Caja al bloque motor. |
| Carcasa a campana | **25** | A | LIBRO-DE | Carcasa a la campana del embrague. |
| Tapa de la 5.ª | **M8: 25 · M6: 10** | A | LIBRO-DE | Tapa de la 5.ª a la carcasa. |
| Tuercas de los ejes | **118** | A | LIBRO-DE | Tuercas de los ejes primario y secundario. |
| Brida intermedia | **10** | A | LIBRO-DE | M6. |
| Tapa de muelles de retención | **25** | A | LIBRO-DE | Tapa de los muelles de retención de las varillas. |
| Brida del rodamiento del diferencial | **25** | A | LIBRO-DE |  |
| Bloqueo de marcha atrás | **10** | A | LIBRO-DE | M6. |
| Horquillas | **10** | A | LIBRO-DE | Horquillas a las varillas. |
| Chapa del eje de marcha atrás | **10** | A | LIBRO-DE |  |
| Horquilla de marcha atrás | **35** | A | LIBRO-DE |  |
| Corona del diferencial | **68** | A | LIBRO-DE | Corona a la caja del diferencial. |
| Brida del fuelle del palier izquierdo | **10** | A | LIBRO-DE |  |
| Horquilla del mando | **15** | A | LIBRO-DE | Contratuerca: 18. |
| Varillaje y mando | **Soporte del reenvío: 11 · bulón horquilla marcha atrás: 25 · tuerca carcasa: 25 · tapa del mando: 10 · brida fuelle palier dcho.: 7,8 · consola del mando a carrocería: 8** | A | LIBRO-DE |  |

### Chasis, frenos y dirección

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Tuerca del buje delantero | **216** | A | LIBRO-DE | CRÍTICO. Bucheli, Marbella. El manual SEAT del Panda de 1980 daba 196 N·m y el Cinquecento 240: usa 216. |
| Tornillos de rueda | **86** | A | LIBRO-DE; RUEDA; CINQ | CRÍTICO. Delante y detrás. |
| Soporte de la pinza | **62** | A | LIBRO-DE | CRÍTICO. Portapinzas a la mangueta. |
| Disco al buje | **64** | A | LIBRO-DE | Disco a la brida del buje. |
| Latiguillo a la pinza | **20** | A | LIBRO-DE |  |
| Purgadores | **6** | A | LIBRO-DE | Pinzas y bombines. |
| Brazo oscilante a carrocería | **39** | A | LIBRO-DE | Brazo oscilante a la carrocería. |
| Brazo oscilante a rótula | **34** | A | LIBRO-DE | Brazo oscilante a la rótula. |
| Vástago del amortiguador | **46** | A | LIBRO-DE | Vástago del amortiguador al taco de goma. |
| Amortiguador delantero arriba | **59** | A | LIBRO-DE | Amortiguador (McPherson) arriba, al paso de rueda. |
| Amortiguador a mangueta | **59** | A | LIBRO-DE |  |
| Tirante de reacción a brazo | **69** | A | LIBRO-DE | Tirante de reacción al brazo. |
| Tirante de reacción a soporte | **69** | A | LIBRO-DE | Tirante al soporte. |
| Soporte del tirante a carrocería | **49** | A | LIBRO-DE |  |
| Chapa de seguridad del tirante | **15** | A | LIBRO-DE |  |
| Brazo de dirección a amortiguador | **26** | A | LIBRO-DE | Brazo de dirección al amortiguador. |
| Ballesta: placa al eje | **39** | A | LIBRO-DE | Placa de la ballesta (abarcón) al tubo del eje. |
| Ballesta: gemela | **29** | A | LIBRO-DE | Gemela a la ballesta. |
| Ballesta a carrocería | **49** | A | LIBRO-DE | Ballesta a la carrocería (perno delantero). |
| Amortiguador trasero abajo | **69** | A | LIBRO-DE | Amortiguador trasero a la placa de la ballesta. |
| Amortiguador trasero arriba | **69** | A | LIBRO-DE | Amortiguador trasero arriba, a la carrocería. |
| Rodamiento trasero al eje | **70** | A | LIBRO-DE | Rodamiento (buje) trasero al tubo del eje. |
| Tubería al bombín | **20** | A | LIBRO-DE |  |
| Tambor | **10** | A | LIBRO-DE | Tambor a la brida. |
| Bombín al plato | **10** | A | LIBRO-DE |  |
| Freno de mano a carrocería | **39** | A | LIBRO-DE |  |
| Volante de dirección | **49** | A | LIBRO-DE; SEAT-P; CINQ |  |
| Columna de dirección | **25** | A | LIBRO-DE | Soporte de la columna a la carrocería. |
| Cruceta a caja de dirección | **27** | A | LIBRO-DE | Abrazadera de la cruceta a la caja de dirección. |
| Contratuerca de la rótula | **49** | A | LIBRO-DE | Contratuerca de la rótula de dirección (tras ajustar la convergencia). |
| Rótula al brazo de dirección | **34** | A | LIBRO-DE | Rótula al brazo de dirección. |
| Bieleta a cremallera | **47-58** | A | LIBRO-DE | Bieleta axial a la cremallera. |

## 7. Límites de desgaste (mm)

### Frenos

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Disco: diámetro | **227** | A | LIBRO-DE; SEAT-P |  |
| Disco: espesor nuevo | **10,7-10,9** | A | LIBRO-DE; SEAT-P |  |
| Disco: espesor mínimo tras rectificar | **9,7** | A | LIBRO-DE; SEAT-P |  |
| Disco: espesor límite | **9** | A | LIBRO-DE; SEAT-P |  |
| Disco: alabeo máximo | **0,15** | B | SEAT-P | Medido a ~2 mm del borde. |
| Pastillas: forro mínimo | **1,5** | A | LIBRO-DE; SEAT-P |  |
| Tambor: diámetro nuevo | **185,24-185,53** | A | LIBRO-DE; SEAT-P |  |
| Tambor: diámetro máximo tras rectificar | **186** | A | LIBRO-DE | El manual del Panda daba 186,33. Usa el del Marbella, que es más conservador. |
| Tambor: diámetro límite | **186,3** | A | LIBRO-DE | El manual del Panda daba 186,83. |
| Zapatas: forro mínimo | **1,5** | A | LIBRO-DE; SEAT-P |  |
| Pistón de la pinza Ø | **48** | A | LIBRO-DE; SEAT-P |  |
| Bomba de freno Ø | **19,05 (3/4")** | A | LIBRO-DE; SEAT-P |  |
| Bombines traseros Ø | **19,05 o 15,875** | C | LIBRO-DE; SEAT-P | El Bucheli da 19,05 y el manual del Panda 15,875 (5/8"): mide el tuyo antes de pedir bombines. |
| Regulador de frenada | **60 bar delante → 35,5 ± 1,75 bar detrás** | A | LIBRO-DE |  |
| Grasas de frenos | **Deslizaderas: grasa PBC · montaje de bombines: RA 349** | A | LIBRO-DE |  |

### Suspensión y embrague

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Muelle delantero | **Libre 364 mm, hilo Ø 10 mm, 8 espiras útiles, hélice a derechas; dos clases (marca amarilla o verde)** | A | LIBRO-DE; SEAT-P | Monta los dos de la misma clase. |
| Ballesta | **Apertura de la ballesta según carga: 113 mm a 100 kp · 93 mm a 134 kp · 25 mm a 250 kp · −12 mm a 312 kp. Tolerancias impresas: 19,5 ± 2 · 86 ± 7 · 120 ± 10** | A | LIBRO-DE | Carga aplicada en el centro del tubo del eje. La tabla del libro no deja claro a qué fila va cada tolerancia. El manual del Panda da una flecha de 86 ± 3 mm con 134 daN. |
| Grasa | **Grasa de litio NLGI 3 para articulaciones y rodamientos** | A | LIBRO-DE |  |
| Rótulas | **Sin engrase (for life)** | B | SEAT-P |  |
| Disco de embrague | **Ø exterior 170 mm, Ø interior del forro 120 mm; mando por cable** | A | LIBRO-DE; SEAT-P |  |

### Cotas internas del motor (903 del Bucheli)

Salen del Bucheli (págs. 113-116) y coinciden con el manual SEAT del Panda 45. Son del 903: el 899 comparte bloque y diámetro, pero tiene carrera de 67,7 mm y taqués hidráulicos. Confírmalas antes de rectificar o pedir piezas.

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Cilindro Ø | **Clases A 65,000-65,010 · B -65,020 · C -65,030 · D -65,040 · E -65,050** | B | LIBRO-DE; SEAT-P | Todo este bloque es del 903 de carburación (Bucheli, págs. 113-116). El 899 comparte bloque y diámetro, pero su carrera es 67,7 mm: confirma las cotas de cigüeñal, bielas y pistones antes de pedir piezas. |
| Ovalidad y conicidad del cilindro | **0,005 máx.** | B | LIBRO-DE |  |
| Juego de bancada | **0,026-0,061** | B | LIBRO-DE; SEAT-P |  |
| Juego axial del cigüeñal | **0,060-0,260** | B | LIBRO-DE; SEAT-P |  |
| Muñequillas de bancada Ø | **Estándar 50,785-50,805 · minoraciones: 50,531-50,551 · 50,277-50,297 · 50,023-50,043 · 49,769-49,789** | B | LIBRO-DE |  |
| Muñequillas de biela Ø | **Estándar 39,985-40,005 · minoraciones: 39,731-39,751 · 39,477-39,497 · 39,223-39,243 · 38,969-38,989** | B | LIBRO-DE |  |
| Apoyo axial del cigüeñal | **Estándar 28,080-28,120 · 1.ª sobremedida 28,207-28,247; ancho de la muñequilla de biela 26,975-27,025** | B | LIBRO-DE |  |
| Alojamientos del bloque | **Bancada 54,507-54,520 · taqués 14,010-14,028 · árbol de levas delante 50,505-50,725 (clases B-E), centro 46,420-46,450, detrás 35,921-35,951** | B | LIBRO-DE |  |
| Biela | **Ojo del bulón 19,940-19,960 · cabeza 43,657-43,673** | B | LIBRO-DE; SEAT-P |  |
| Pistón | **Clases A 64,940-64,950 a E 64,980-64,990, medido a 31,65 mm de la cabeza · sobremedidas +0,2/+0,4/+0,6 · juego con el cilindro 0,050-0,070** | B | LIBRO-DE; SEAT-P |  |
| Bulón | **Alojamiento clases 1: 19,970-19,974 · 2: -19,978 · 3: -19,982 · sobremedida +0,2 · juego 0,008-0,016** | B | LIBRO-DE; SEAT-P |  |
| Segmentos y ranuras | **Ancho de ranura 1,785-1,805 · 2,015-2,035 · 3,957-3,977; espesor 1,728-1,740 · 1,978-1,990 · 3,925-3,937; juego vertical 0,045-0,077 · 0,025-0,057 · 0,020-0,052** | B | LIBRO-DE; SEAT-P |  |
| Luz de segmentos | **1.º 0,200-0,450 · 2.º 0,200-0,350 · rascador 0,200-0,450** | B | LIBRO-DE; SEAT-P | El manual del Panda da 0,20-0,35 para los tres. |
| Peso de los pistones | **Diferencia máxima ± 3,5 g (con segmentos y bulón)** | B | LIBRO-DE |  |
| Volante motor | **Cota superficie de fricción-asiento del plato: 0,6 · rectificado máximo 1,0 · alabeo 0,05** | B | LIBRO-DE |  |
| Árbol de levas | **Apoyos: detrás 30,975-31,000 · centro 43,348-43,373 · delante 37,975-38,000; casquillos 31,026-31,046 · 43,404-43,424 · 38,025-38,050; alzada 5,1; alabeo 0,05** | B | LIBRO-DE; SEAT-P | La alzada puede ser distinta en el 899 con taqués hidráulicos. |
| Bomba de aceite | **Juego radial 0,050-0,140 · axial 0,020-0,105 · ancho de engranajes 29,956-29,986 · juego de flancos 0,080 · muelle de la válvula: 2,4-2,6 kp a 36,0 mm y 4,4-4,7 kp a 29,0 mm** | B | LIBRO-DE; SEAT-P |  |
| Bomba de agua | **Juego rodete-carcasa 0,800-1,200** | B | LIBRO-DE; SEAT-P |  |
| Culata | **Alabeo máximo del plano 0,05** | B | LIBRO-DE |  |
| Válvulas y guías | **Guía: alojamiento 12,950-12,977, exterior 13,010-13,030 (sobremedidas +0,05/+0,1/+0,25), interior 7,022-7,040 · vástago 6,982-7,000 · juego 0,022-0,052 (límite 0,150) · cabeza ADM 28,8-29,1, ESC 25,8-26,1 · margen mínimo 1,0 · asiento 45° (correcciones 15° y 75°), ancho ADM 1,8 / ESC 2,2** | B | LIBRO-DE; SEAT-P | El libro imprime el vástago como «7,000-6,892»: será una errata, el manual SEAT da 6,982-7,000. |
| balancines | **Alojamiento 15,010-15,030 · soporte 15,010-15,028 · eje 14,978-14,990** | B | LIBRO-DE; SEAT-P |  |

## 8. Instalación eléctrica

El manual SEAT es del Panda de 1980. El Marbella de inyección añade bomba eléctrica, relés de inyección, inmovilizador y otra caja de fusibles, así que los datos de ese manual valen solo como referencia.

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Batería | **12 V, 32 Ah de origen · densidad 1,28 cargada / 1,20 a media carga / 1,12 descargada (32/24/16 °Bé) · carga máxima 3,2 A · 12,72 V cargada** | A | LIBRO-DE; BAT | Hoy se suele montar una de 40-45 Ah, que cabe y va mejor. La densidad de descargada se lee «1,2» en la foto: por los 16 °Bé será 1,12. |
| Alternador | **45 A: Bosch K1-14V 20/45A (regulador EL 14V 4C), Marelli AA 125 R 14V 45A (regulador RTT 119AC) o Ducellier 45 A · empieza a cargar a 1000-1050 rpm · regulación 14,1 ± 0,1 V · rotor 2,9 Ω (Bosch), 3,1 ± 0,1 Ω (Marelli), 3,5 ± 0,2 Ω (Ducellier)** | A | LIBRO-DE | Mira la placa del tuyo para saber de qué marca es. |
| Regulador de tensión | **Electrónico incorporado; 13,65-14 V (Marelli) o 13,6-14,4 V (Lucas)** | B | SEAT-P |  |
| Motor de arranque | **Bosch DF 12 o Marelli E 76: 12 V, 0,7 kW, piñón de 9 dientes, corona de 116 · prueba de arranque: Bosch 410 A a 7,8 V; Marelli 340 ± 15 A a 7,1 ± 0,2 V · escobillas nuevas/mínimas: Bosch 13,75/11,5 mm, Marelli 10/8 mm** | A | LIBRO-DE | Columnas de la pág. 120 leídas en foto inclinada. |
| Relé del motor de arranque | **Bobinado de atracción/retención: Bosch 0,44 ± 0,02 / 1,9 ± 0,5 Ω · Marelli 0,35 ± 0,02 / 1,2 ± 0,07 Ω** | A | LIBRO-DE |  |
| Encendido | **Estático de chispa perdida, dos bobinas (1+4 y 2+3), mandado por la centralita; sin delco** | B | IAW16F-DOC; FF-SPI-ENC |  |
| Bomba de gasolina | **Eléctrica, dentro del depósito, con relé mandado por la centralita** | C | AUTODOC-REL; MF-INY | Así aparece en los catálogos y en un foro; confírmalo en el coche. |
| Relé de la bomba | **En la caja de fusibles, bajo el salpicadero, lado del conductor** | C | AUTODOC-REL | Es lo que dice una tienda de recambios. El número de relé está pendiente. |
| Fusibles (Panda 1980) | **Panda 1980: 10 fusibles (A-H de 8 A, I y L de 16 A)** | C | SEAT-P | El Marbella de inyección tiene otra caja: no lo uses para identificar fusibles. |
| Caja de fusibles y relés del Marbella 0.9i | — | ⏳ pend. |  | Pendiente: tapa de la caja o esquema del Marbella. Hazle una foto a la tapa. |
| Bombillas | **Faros halógenos 60/65 W (impreso así: lo normal es H4 60/55) · posición delante 4 W, detrás 5 W · intermitentes 21 W · freno 21 W · marcha atrás 21 W · matrícula 5 W · antiniebla trasero 21 W · luz interior 5 W · cuadro 2 W · testigos 1,2 W (los de posición y carga, 3 W)** | A | LIBRO-DE |  |
| Esquema eléctrico del Marbella 0.9i | — | ⏳ pend. |  | Pendiente: no hay ninguno publicado en línea. Un usuario del foro de Fiat ofrece los esquemas del 899 de fábrica (Cinquecento) por mensaje privado. |
| Localización de averías | **El capítulo 55 del manual SEAT (localización de averías por circuitos: arranque, carga, luces, intermitentes, limpias, luneta, indicadores…) sirve como método de comprobación con lámpara de pruebas** | B | SEAT-P | El método vale; los números de fusibles y conectores son del Panda. |

## 9. Inyección y encendido Marelli

### 9.1 Qué centralita llevas

El Marbella 0.9 Cat montó dos centralitas Marelli según la época. La de tu coche es la IAW 16S.S0 con inmovilizador.

| Variante | Fiab. | Fuente |
|---|---|---|
| IAW 6F.SF · Marelli 61602.047.01 · motor 09 NCB · visto en un Marbella 0.9 Cat de 1993 | A | DESG-6F |
| IAW 16S.S0 · Marelli 6160209401 (61602.094.01) · SEAT 6A0906018 · equivalente 6160211600 · con inmovilizador | A | ECUDIAG; ECUFILE |
| Tu coche: IAW 16S.S0 con inmovilizador, confirmada por el propietario. Cuadra con el motor 08 NCB y la fecha de la ficha (nov. 1996). La 6F.SF es de los 09 NCB anteriores. | A | PROPIETARIO; FICHA; ECUDIAG |
| 6F y 16F son los sistemas monopunto Marelli de Fiat. La 16S.S0 parece la versión SEAT de la 16F (misma época, inmovilizador y procesador), pero no hay documentación que lo confirme. | C | MARELLI-GUIA; IAW16F-DOC; ECUFILE |

La documentación técnica que hay es de la **IAW 16F** (Cinquecento/Seicento 899), de la misma familia. Lo que sigue sale de ella: con la 6F o la 16S puede haber diferencias, sobre todo en el patillaje.

### 9.2 Cómo funciona

| Punto | Fiab. | Fuente |
|---|---|---|
| Densidad-velocidad: calcula el combustible con la presión del colector (MAP) y las rpm, y lo corrige en lazo cerrado con la sonda lambda | B | IAW16F-DOC |
| Correcciones por temperatura del aire, del refrigerante, mariposa, tensión de batería y sonda lambda. Corte de inyección en retención y a altas rpm | B | IAW16F-DOC |
| Encendido estático de chispa perdida: dos bobinas, una para los cilindros 1+4 y otra para 2+3, sin delco. Avance calculado con MAP, rpm y temperatura | B | IAW16F-DOC; FF-SPI-ENC |
| Rueda fónica de 60-2 dientes en la polea del cigüeñal | B | IAW16F-DOC |
| Bomba de gasolina por relé, mandado por la centralita (se activa un momento al dar el contacto) | B | IAW16F-DOC; MARELLI-GUIA |
| Purga del cánister de carbón activo hacia la admisión mediante electroválvula | B | IAW16F-DOC |

### 9.3 Modo de emergencia (qué hace la centralita cuando falla un sensor)

| Fallo → reacción | Fiab. | Fuente |
|---|---|---|
| Fallo del motor paso a paso: lo desactiva y limita el motor a 1200 rpm | B | IAW16F-DOC |
| Fallo del MAP: usa presión atmosférica fija (1012 mbar) | B | IAW16F-DOC |
| Fallo de la mariposa (TPS): calcula la posición con el MAP y las rpm | B | IAW16F-DOC |
| Fallo de temperatura de aire o refrigerante: último valor válido o un valor por defecto | B | IAW16F-DOC |
| Sin señal de rpm/PMS: el motor no arranca (no hay modo de emergencia) | B | IAW16F-DOC |
| Batería fuera de rango: avería si pasa de 16,2 V o baja de 6 V | B | IAW16F-DOC |

### 9.4 Componentes y valores de comprobación

Mide las resistencias con el conector desenchufado y el contacto quitado. Las tensiones, con el conector enchufado y el contacto dado.

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Inyector | **Marelli 213170623605 · 1,75 Ω ± 5 % a 20 °C · 465 cm³/min estático** | B | FF-INY | Cita del manual de taller del Seicento (SPI). Es de baja impedancia: no lo cambies por un inyector Weber de 13-18 Ω. |
| Presión de gasolina | **1,1 ± 0,2 bar regulada; válvula de sobrepresión a 2,6 bar; bomba ≥ 110 L/h** | B | CINQ |  |
| Sensor de temperatura del refrigerante | **Contradictorio: ~5 kΩ a 20 °C (10 kΩ a 0 °C) según el Cinquecento, o 2,2-2,8 kΩ a 20 °C (6,0-6,8 kΩ a 0 °C; 280-350 Ω a 80 °C) según la guía Marelli** | C | CINQ; MARELLI-GUIA | Medir en frío y en caliente: lo importante es que baje de forma progresiva al calentarse. Está en el colector de admisión. |
| Sensor de temperatura del aire | **2,2-2,8 kΩ a 20 °C; 6,0-7,0 kΩ a 0 °C; 250-380 Ω a 80 °C** | C | MARELLI-GUIA | Valores genéricos de la guía Marelli, sin asignar a la 6F. Está en el cuerpo de mariposa. |
| Potenciómetro de mariposa | **0,25-0,30 V cerrada · 4,5-5,0 V abierta (alimentación 5 V)** | C | MARELLI-GUIA | Genérico Marelli. Un documento del Cinquecento da 3,8-4,7 V a plena apertura. |
| Sensor MAP (presión del colector) | **4,5-4,8 V a 800 mmHg · 2,4-2,6 V a 500 mmHg · 0,25-0,30 V a 150 mmHg** | C | MARELLI-GUIA | Genérico Marelli. |
| Motor paso a paso (ralentí) | **45-65 Ω por bobinado; dos fases, cuatro hilos** | C | MARELLI-GUIA; IAW16F-DOC | La resistencia es genérica Marelli. |
| Sensor PMS (cigüeñal) | **575-720 Ω a 20 °C; entrehierro 0,5-1,5 mm** | B | CINQ | La guía Marelli genérica da 300-500 Ω. Señal de unos 12 V pico a pico. |
| Bobinas | **Primario 0,5-0,6 Ω (0,45-0,75 Ω según Marelli); secundario 12-16 kΩ** | C | CINQ; MARELLI-GUIA | El primario coincide en las dos fuentes; el secundario solo viene en la guía genérica. |
| Calefactor de la sonda lambda | **2,5-4,5 Ω a 20 °C** | B | CINQ |  |
| Sonda lambda | **Banda estrecha, 0-1 V: oscila por encima y por debajo de 0,45 V en lazo cerrado** | C | FF-IAW | El umbral de 0,45 V es el estándar de las sondas de circonio, no viene en la fuente. |
| Electroválvula del cánister | **25-55 Ω** | C | MARELLI-GUIA |  |

### 9.5 Pineado de la centralita

**Fiabilidad: C** (B como patillaje de la 16F; C para tu 16S.S0 hasta que lo compruebes. Las pruebas de la columna «Cómo comprobarlo» son una guía de taller construida con los valores de la sección 9.4.) · Fuente: IAW16F-DOC; FF-PIN · Conector: 35 pines (16F). En la 16S.S0 sin confirmar: cuéntalos.

No hay ningún patillaje publicado de la IAW 16S.S0. Este es el de la IAW 16F (Cinquecento/Seicento 899, misma familia y época, también con inmovilizador por línea serie). Úsalo como punto de partida y confirma cada pin en tu coche con la columna «Cómo comprobarlo» antes de cortar, puentear o alimentar nada. Rellena «Verificado» cuando lo compruebes.

Cómo medir: **resistencias y continuidades con el contacto quitado y el conector de la centralita suelto**, midiendo en el lado del mazo. **Tensiones con el conector enchufado**, pinchando por detrás, salvo que la fila diga «conector suelto». No metas las puntas del polímetro a la fuerza en los terminales.

| Pin | Función | Color (16F) | Cómo comprobarlo | Verificado |
|---|---|---|---|---|
| 1 | Bobina 1, cilindros 1+4 (mando a masa) | blanco/verde | Sin contacto y conector suelto: entre el pin y el borne + de la bobina, 0,5-0,6 Ω (el primario). Ojo: la alimentación de la bobina puede venir del relé principal, que no se activa con la centralita desenchufada. | ☐ |
| 2 | Motor paso a paso, fase B | verde | Las cuatro fases forman dos bobinados: busca la pareja con 45-65 Ω entre sí. | ☐ |
| 3 | Motor paso a paso, fase D | azul/amarillo | Ídem. Entre fases de bobinados distintos no debe haber continuidad. | ☐ |
| 4 | Mando del relé principal (mantenimiento de alimentación) | azul/rojo | Continuidad con la bobina del relé principal. | ☐ |
| 5 | Entrada de cambio automático | sin cable | No se usa con cambio manual. | ☐ |
| 6 | Testigo de inyección (mando a masa) | gris/rojo | Contacto dado y conector suelto: ~12 V a través de la bombilla del testigo. | ☐ |
| 7 | Inmovilizador: línea serie con el cajetín | — | Continuidad con el conector del cajetín del inmovilizador. Es el único cable entre los dos. | ☐ |
| 8 | Relé del aire acondicionado (+) | verde | Sin A/A suele estar vacío. | ☐ |
| 9 | Sin conectar | — | — | ☐ |
| 10 | Diagnosis, línea L | azul claro/azul | Continuidad con el conector de diagnosis de 3 pines. | ☐ |
| 11 | Sensor PMS (−) | azul/rojo | Entre 11 y 28: 575-720 Ω (la resistencia del sensor). | ☐ |
| 12 | Sonda lambda (−) | marrón/verde | Continuidad con la masa de señal de la sonda. | ☐ |
| 13 | Sensor de temperatura del refrigerante | violeta/blanco | Entre 13 y la masa de sensores: resistencia del NTC, baja al calentarse. Enchufado y con contacto: 2-3 V en frío. | ☐ |
| 14 | Alimentación de sensores +5 V | azul claro/negro | Enchufado y con contacto: 5,0 V respecto a masa. | ☐ |
| 15 | Diagnosis, línea K | blanco/rojo | Continuidad con el conector de diagnosis de 3 pines. | ☐ |
| 16 | Masa de señales | negro | Conector suelto: continuidad a masa del motor (< 1 Ω). | ☐ |
| 17 | Masa principal (motor) | verde/negro (dudoso) | Conector suelto: continuidad a masa del motor (< 1 Ω). | ☐ |
| 18 | Inyector (mando a masa) | rosa/negro | Sin contacto y conector suelto: entre el pin y la alimentación del inyector, unos 1,75 Ω (el inyector) más el cable. | ☐ |
| 19 | Bobina 2, cilindros 2+3 (mando a masa) | azul claro/rojo | Como el pin 1, con la otra bobina. | ☐ |
| 20 | Motor paso a paso, fase A | azul/blanco | Como el pin 2. | ☐ |
| 21 | Motor paso a paso, fase C | blanco | Como el pin 2. | ☐ |
| 22 | Electroválvula del cánister (mando a masa) | naranja/negro | Entre el pin y su alimentación: 25-55 Ω. | ☐ |
| 23 | Relé de la bomba de gasolina (mando a masa) | negro/violeta | Continuidad con la bobina del relé de la bomba. Puentear a masa con contacto dado debe hacer sonar la bomba. | ☐ |
| 24 | Relé del aire acondicionado (−) | amarillo | Sin A/A suele estar vacío. | ☐ |
| 25 | Sin conectar | — | — | ☐ |
| 26 | Positivo de contacto (+15) | naranja (dudoso) | ~12 V solo con el contacto dado. | ☐ |
| 27 | Sin conectar | — | — | ☐ |
| 28 | Sensor PMS (+) | amarillo/negro | Con 11: 575-720 Ω. Al dar arranque, señal alterna de unos voltios. | ☐ |
| 29 | Sonda lambda (señal +) | azul/amarillo | Motor caliente al ralentí: oscila entre ~0,1 y ~0,9 V. | ☐ |
| 30 | Potenciómetro de mariposa (señal) | rosa | Enchufado y con contacto: ~0,3 V cerrada y sube sin saltos hasta ~4,5 V abierta. | ☐ |
| 31 | Sensor de temperatura del aire | violeta | Entre 31 y la masa de sensores: unos 2,5 kΩ a 20 °C. | ☐ |
| 32 | Sensor MAP (señal) | amarillo/rojo | Contacto dado sin arrancar: ~4,5 V (presión atmosférica). Al ralentí baja mucho. | ☐ |
| 33 | Sin conectar | — | — | ☐ |
| 34 | Masa secundaria (motor) | gris/negro | Conector suelto: continuidad a masa del motor (< 1 Ω). | ☐ |
| 35 | Alimentación desde el relé principal (+30) | marrón/blanco | ~12 V con el relé principal activado (motor arrancando o en marcha). Con el conector suelto, el relé no entra. | ☐ |

### 9.6 Códigos de avería (IAW 16F) · fiab. B · IAW16F-DOC

Códigos validados de la IAW 16F, por grupos (hexadecimal). El testigo solo se enciende si la avería está filtrada y validada; al dar el contacto se enciende 4 s como prueba.

| Grupo | Código | Avería |
|---|---|---|
| Entradas | 01 | Potenciómetro de mariposa |
| Entradas | 02 | Sensor MAP |
| Entradas | 04 | Sonda lambda |
| Entradas | 08 | Temperatura del refrigerante |
| Entradas | 10 | Temperatura del aire |
| Entradas | 20 | Tensión de batería |
| Salidas | 01 | Inyector |
| Salidas | 02 | Bobina 1 |
| Salidas | 04 | Bobina 2 |
| Salidas | 08 | Motor paso a paso (o cánister: el documento se contradice) |
| Salidas | 20 | Relé del A/A |
| Salidas | 40 | Relé de la bomba de gasolina |
| Funcionales | 01 | Autocalibración |
| Funcionales | 02 | RAM |
| Funcionales | 04 | EPROM |
| Funcionales | 08 | EEPROM |
| Funcionales | 10 | Microcontrolador |
| Funcionales | 20 | Señal de rpm/PMS |

### 9.7 Pruebas de actuadores con la herramienta de diagnosis (IAW 16F) · fiab. B · IAW16F-DOC

| Código | Prueba |
|---|---|
| 80 | Relé de la bomba de gasolina (30 s) |
| 81 | Inyector (4 ms, 5 veces) |
| 82 | Bobina 1 (2 ms, 5 veces) |
| 83 | Bobina 2 (2 ms, 5 veces) |
| 84 | Borrar averías de la EEPROM |
| 85 | Cánister (20 ms, 7 veces) |
| 86 | Corte de régimen a 3750 rpm (2 s) |
| 87 | Relé del A/A (30 s) |
| 8C | Motor paso a paso |

### 9.8 Diagnosis

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Conector de diagnosis | **Conector Fiat de 3 pines; con IAW Scan2 hace falta un adaptador OBD-2 → Fiat 3 pines** | C | IAWSCAN | Falta confirmar dónde está en el Marbella. |
| Protocolo | **Código ISO a 1200 baudios al dar el contacto; diálogo a 7812,5 baudios por las líneas K (pin 15) y L (pin 10)** | B | IAW16F-DOC |  |
| Herramienta de diagnosis | **IAW Scan2 con cable KKL (FTDI) + adaptador Fiat 3 pines** | C | IAWSCAN | Lista oficialmente la 6F y la 16F: si tu coche lleva la 6F.SF, lo más probable es que la lea. La 16S no está en la lista. |

### 9.9 Inmovilizador

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Sistema | **Inmovilizador con transpondedor: chip en la llave, antena en el bombín y cajetín propio, separado de la centralita de motor. La centralita solo inyecta y da chispa si el cajetín valida el código de la llave.** | B | ECUDIAG; IAW16F-DOC; RECEURO | Que el cajetín es una pieza aparte lo dicen los vendedores de la 16S.S0 («hay que desconectar la caja de inmovilizador») y hay cajetines del Marbella 0.9 08NCB en desguace. |
| Transpondedor de la llave | **TEMIC 11 o Philips ID33 (código fijo)** | A | TRANSP | Catálogo de transpondedores para el Marbella 1997-1998. Es la misma familia que los Ibiza, Inca, Córdoba y Toledo de 1995-98. |
| Enlace con la centralita | **Un solo cable de línea serie entre el cajetín y la centralita (pin 7 en la 16F)** | B | IAW16F-DOC; FF-PIN | Confírmalo en la 16S.S0. |
| Contador de fallos | **La centralita cuenta los contactos desde el último fallo de inmovilizador** | B | IAW16F-DOC |  |
| Arranque de emergencia | **Código de 5 cifras de la tarjeta, introducido con el pedal del acelerador: dar contacto, esperar a que parpadee el testigo, pisar a fondo y soltar al contar cada cifra en los destellos** | C | IAW16F-DOC; FIAT-CODE | Es el procedimiento de la 16F y del Fiat CODE. No he encontrado si SEAT entregaba tarjeta de código con el Marbella: busca una tarjeta de plástico con la documentación. |
| Llaves | **Programación con equipo de diagnosis (como los SEAT de la época). Un cerrajero puede copiar el transpondedor de código fijo a partir de una llave buena.** | C | AUTOTRON; TRANSP | Antes de que se te pierda la única llave, haz una copia. |
| Dónde guarda los datos | **Datos del inmovilizador en la EEPROM interna del microcontrolador MC68HC11F1 de la centralita (volcado de 512 bytes). Se lee en placa con programador (Xprog, UPA) alimentando la centralita a 12 V.** | C | ECUFILE; IMMOOFF; DIAGCOCHES | Un listado habla de un chip 24C02. Antes de tocar nada, haz copia de la EEPROM. |
| Centralita de desguace | **Una 16S.S0 usada no arranca con tu cajetín: hay que adaptarla (traspasar los datos de la tuya) o anularle el inmovilizador y desconectar el cajetín.** | B | ECUDIAG; TOPLLAVES; ECUFILE |  |
| Síntomas de fallo | **Llave no reconocida: el motor no arranca o arranca y se para en 2-3 s. Prueba con la otra llave antes de culpar a la centralita.** | C | FOROS-INMO | Comportamiento descrito para SEAT de la época, no para el Marbella en concreto. |
| Ubicación del cajetín del inmovilizador | — | ⏳ pend. |  | Pendiente: busca un módulo pequeño bajo el salpicadero, cerca de la columna de dirección, con cable hacia el bombín. Hazle foto a su etiqueta. |
| Pineado del cajetín del inmovilizador | — | ⏳ pend. |  | Pendiente: no está publicado. Identifica alimentación, masa, antena del bombín y la línea serie a la centralita. |
| Testigo del inmovilizador y su comportamiento | — | ⏳ pend. |  | Pendiente: comprobar en el cuadro qué testigo se enciende o parpadea al dar contacto. |

### 9.10 Averías típicas

| Síntoma → causa probable | Fiab. | Fuente |
|---|---|---|
| Se cala en caliente y no arranca hasta que se enfría: sensor PMS. A menudo no deja código. | C | FF-SENS |
| CO alto, mezcla rica o suspende la ITV: sensor de temperatura del refrigerante, luego sonda lambda. | C | FF-SENS |
| Ralentí bajo o inestable, o se cala al soltar el acelerador: motor paso a paso o cuerpo de mariposa sucio. Si falla el motor paso a paso, la centralita limita a 1200 rpm. | C | IAW16F-DOC; IT-SPI |
| Tirones y petardeos por el escape (SPI de Fiat): bujías, cables y bobinas; después, la presión de gasolina. | C | IT-SPI |
| Golpeteo de taqués: cambiar el aceite (con limpiador); si sigue, cambiar los taqués hidráulicos. | C | IT-TAQ |
| Tras montar la culata funciona mal (bujías negras y húmedas): taqués hidráulicos sin purgar o bloqueados. | C | IT-TAQ |
| Centralita de desguace que no arranca: el inmovilizador (solo IAW 16S.S0). | C | ECUDIAG |
| Fallos intermitentes: revisar conectores y masas antes de cambiar piezas. | C | FF-SENS |

## 10. ITV

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| CO al ralentí | **≤ 0,5 % vol.** | B | ITV | Para matriculados antes del 1/7/2002, si el fabricante no da otro valor. |
| CO al ralentí acelerado | **≤ 0,3 % vol. a ≥ 2000 rpm** | B | ITV |  |
| Lambda al ralentí acelerado | **1 ± 0,03** | B | ITV |  |
| Periodicidad de ITV como histórico (cumple 30 años el 12/12/2026) | — | ⏳ pend. |  | Pendiente: confirmar en el Reglamento de Vehículos Históricos (RD 892/2013). |

## 11. Referencias de recambios

| Concepto | Valor | Fiab. | Fuente | Nota |
|---|---|---|---|---|
| Filtro de aceite | **Mann-Filter W 714/2** | A | MANN | Catálogo para Marbella 028A 0.9 CAT y 08NCB. La equivalencia Bosch no está confirmada. |
| Filtro de aire | **Aerofiltro redondo: alto 55-59 mm, Ø interior 181-182, Ø exterior 215-235 mm. Deportivo: BMC 155/06** | C | AEROF; BMC | BMC es A (catálogo del Marbella 0.9 cat). La referencia de filtro de papel está pendiente. |
| Bujía | **Champion RN9YCC · Bosch WR7D · Marelli F7LCR** | B | CINQ; LIBRO-DE |  |
| Taqués hidráulicos | **INA 420 0033 10 · Febi 19368 · Ajusa 85018400 · AE FOL119/FOL161 · Ruville 265804** | B | CAT-TAQ | Para el 1170A1.046. Hay de Ø 11 y Ø 12 mm según el número de motor: medir antes de pedir. |
| Centralita | **IAW 16S.S0 6160209401 / SEAT 6A0906018 (con inmovilizador) o IAW 6F.SF 61602.047.01** | A | ECUDIAG; DESG-6F | Pídela con la referencia de la etiqueta de la tuya. |
| Inyector | **Magneti Marelli 213170623605 (1,75 Ω)** | B | FF-INY | Inyector SPI del Cinquecento/Seicento: confirma que es el mismo antes de pedirlo. |
| Filtro de gasolina | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Pastillas de freno | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Discos de freno (Ø 227) | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Zapatas traseras | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Kit de cadena de distribución | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Bomba de agua | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Termostato | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Correa de alternador | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Sonda lambda | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Sensor PMS | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |
| Sensor de temperatura del refrigerante | — | ⏳ pend. |  | Pendiente: no encontrado en ninguna fuente. |

## 12. Pendiente de verificar

| Dato | Cómo cerrarlo |
|---|---|
| Pineado real de tu IAW 16S.S0 | Recorre la tabla de la sección 9.5 con el polímetro y marca cada pin como verificado. Cuenta los pines del conector. |
| Cajetín del inmovilizador: ubicación, etiqueta y pineado | Foto del cajetín y de su conector; identificar alimentación, masa, antena del bombín y la línea a la centralita. |
| Tarjeta de código del inmovilizador | Buscar entre la documentación del coche una tarjeta con un código de 5 cifras. Sin ella no hay arranque de emergencia. |
| Apriete de culata 30 N·m + 90° + 90° | Una sola fuente (foro del Cinquecento, sin cita del manual). Confirmar con el Haynes del Cinquecento antes de montar la culata. |
| Sensor de temperatura del refrigerante: 5 kΩ o 2,5 kΩ a 20 °C | Medir el tuyo a temperatura ambiente y en caliente, y anotarlo. |
| Resistencias y tensiones de sensores y actuadores de la 6F/16S (aire, mariposa, MAP, paso a paso) | Solo hay valores genéricos Marelli. Medir los del coche cuando funcione bien y guardarlos como referencia. |
| Caja de fusibles y relés del Marbella 0.9i | Foto de la tapa de la caja y de los relés. |
| Esquema eléctrico del Marbella 0.9i | Manual SEAT del Marbella (no está en línea) o los esquemas del 899 de fábrica de Fiat. |
| Ubicación del conector de diagnosis y si IAW Scan2 lee tu centralita | Probarlo con un cable KKL y el adaptador Fiat de 3 pines. |
| Equivalencias NGK/Bosch de bujía y referencias de frenos, cadena, bomba y sensores | Catálogo TecDoc filtrando por 08 NCB o 09 NCB. |
| Pares del motor de la pág. 122 del Bucheli (columna izquierda) | Foto plana de esa columna: la foto inclinada no deja alinear bien cada par con su tornillo. |
| Cotas internas específicas del 899 (carrera 67,7) | Las del Bucheli son del 903. Haynes del Cinquecento o ETAI. |
| Diámetro de los bombines traseros (19,05 o 15,875) | Medirlo en el coche o leer la marca del bombín. |
| Periodicidad de ITV como histórico | RD 892/2013. |
