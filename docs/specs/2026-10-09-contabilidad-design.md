# Novaz Dashboard · Contabilidad simulada

Fecha: 2026-10-09 · Estado: implementado

Contabilidad de partida doble según el PGC PYMES (simplificado), para simular Novaz como empresa.

## Principio: asientos derivados

Solo se guardan los **asientos manuales** (`asientos` + `apuntes`). El resto se calcula al vuelo
(`packages/core/src/contabilidad.ts`), así que nunca se descuadran al editar o borrar datos:

| Origen | Asiento |
|---|---|
| Movimiento (gasto) | Debe cuenta de gasto (base) + 472 (cuota) / Haber tesorería (total) |
| Movimiento (ingreso) | Debe tesorería / Haber cuenta de ingreso (base) + 477 (cuota) |
| Inmovilizado | Amortización lineal diaria: 681/281 (680/280 intangible), un asiento por ejercicio |
| IVA | Trimestres cerrados: salda 472/477 contra 4750 (a pagar) o 4700 (a compensar, se arrastra) |

- Tesorería según la forma de pago: banco → 572, caja → 570, **socio → 551** (lo pagas de tu
  bolsillo y la empresa te lo debe).
- Cuenta de gasto/ingreso: la propia del movimiento, si no la de su categoría, si no 629/759.
- El IVA va incluido en el importe; el % por defecto sale de la categoría.

## Informes

Resumen · Movimientos · Libro diario (con plantillas: capital, pago de IVA, reembolso al socio,
préstamo) · Mayor (saldo arrastrado en cuentas de balance) · Pérdidas y ganancias (modelo abreviado,
comparado con el ejercicio anterior) · Balance de situación (sin asientos de cierre: el resultado
se calcula; siempre cuadra, con test) · Sumas y saldos · IVA trimestral y libros registro ·
Inmovilizado · Plan de cuentas editable (subcuentas libres: 5720001…).

## Fuera de alcance

Facturas con numeración (módulo de clientes), variación de existencias (300/610), impuesto de
sociedades contabilizado (solo estimación), cierre/apertura formal de ejercicios.
