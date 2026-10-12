# Formato `novaz-ficha` (manual de un vehículo en JSON)

La ficha técnica de cada vehículo se puede **exportar** (Ficha técnica → Exportar) e **importar**
(Ficha técnica → Importar) en este formato. Sirve para guardar copias, pasar la ficha a otro vehículo
igual o importar un «manual express» generado con una IA.

## Estructura

```json
{
  "formato": "novaz-ficha",
  "version": 1,
  "vehiculo": "Suzuki GSF 600 Bandit (1999)",
  "datos": [
    { "seccion": "motor", "clave": "aceite_motor", "nombre": "Aceite de motor", "valor": "10W40 JASO MA", "fuente": "Manual de taller, pág. 2-3" },
    { "seccion": "motor", "clave": "aceite_motor_litros", "nombre": "Cantidad de aceite (con filtro)", "valor": "3,3", "unidad": "L" },
    { "seccion": "pares", "clave": "par_carter", "nombre": "Tapón del cárter", "valor": "23", "unidad": "Nm", "detalle": "Arandela nueva" }
  ],
  "procedimientos": [
    {
      "titulo": "Cambio de aceite y filtro",
      "tiempoMin": 40,
      "herramientas": ["Llave de vaso 17", "Llave de filtro", "Bandeja de aceite"],
      "pasos": [
        { "texto": "Calentar el motor 5 minutos y apagarlo." },
        { "texto": "Quitar el tapón del cárter y vaciar.", "par": "23 Nm al montarlo" }
      ]
    }
  ]
}
```

### `datos`

| Campo | Obligatorio | Qué es |
|---|---|---|
| `seccion` | sí | `motor`, `transmision`, `frenos`, `ruedas`, `electricidad`, `pares`, `recambios` u `otros` |
| `clave` | no | Identificador del dato (si coincide con uno de la plantilla, rellena ese hueco). Si no se pone, sale del nombre |
| `nombre` | sí | Cómo se llama el dato |
| `valor` | sí | El valor, como texto (decimales con coma) |
| `unidad` | no | `L`, `bar`, `Nm`, `mm`… |
| `detalle` | no | Matiz: «con filtro», «en frío», «en cruz y en dos pasadas» |
| `fuente` | no | De dónde sale el dato |
| `verificado` | no | `true` solo si está comprobado. Por defecto, **sin verificar** |

Claves de la plantilla (coche y moto): `aceite_motor`, `aceite_motor_litros`, `refrigerante`, `refrigerante_litros`,
`bujias`, `distribucion`, `holgura_valvulas`, `aceite_caja`, `kit_transmision`, `holgura_cadena`, `liquido_frenos`,
`disco_del_min`, `disco_tras_min`, `neumatico_del`, `neumatico_tras`, `presion_del`, `presion_tras`, `bateria`,
`bombilla_cruce`, `par_ruedas`, `par_eje_del`, `par_eje_tras`, `par_carter`, `par_bujias`, `filtro_aceite_ref`,
`filtro_aire_ref`, `filtro_combustible_ref`, `filtro_habitaculo_ref`, `pastillas_del_ref`, `pastillas_tras_ref`,
`correa_accesorios_ref`.

### `procedimientos`

`titulo` y `pasos` son obligatorios. Cada paso es un texto o `{ "texto": "...", "par": "25 Nm" }`.

## Reglas al importar

- Lo que ya tengas **verificado** no se pisa con un dato sin verificar.
- Un procedimiento con el mismo título que uno existente no se duplica.
- Los pares de apriete sin verificar se muestran como **pista**, nunca como dato fiable.

## Pedírselo a una IA

> Genera la ficha técnica de un *[marca, modelo, año, motor]* en formato JSON `novaz-ficha` versión 1
> (estructura de arriba). Incluye solo datos de fábrica de los que estés seguro, con su fuente, y
> marca `verificado: false` en todos. Añade los procedimientos de mantenimiento básicos (aceite y filtro,
> filtro de aire, bujías, líquido de frenos) con sus pasos, herramientas y pares.
