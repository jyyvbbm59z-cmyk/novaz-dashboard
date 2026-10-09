# Novaz Dashboard · Módulo 1: Flota y restauraciones

Fecha: 2026-10-09 · Estado: aprobado (brainstorming con Carlos)

## Objetivo

Aplicación web propia del taller Novaz, ligera, minimalista y muy personalizable, accesible
desde cualquier lugar. Hobby que simula una empresa real.

Hoja de ruta por módulos (cada uno con su diseño → plan → implementación):

1. **Flota y restauraciones** ← este documento
2. Clientes y facturas (ficticias, PDF)
3. Inventario / stock
4. Contabilidad simulada

## Decisiones

| Tema | Decisión |
|---|---|
| Alojamiento | 100 % Cloudflare: Workers + D1 (SQLite) + R2 (archivos) |
| Acceso | Cloudflare Access (login por email) delante de la app; la app verifica el JWT |
| Framework | SvelteKit (Svelte 5) con `adapter-cloudflare`, TypeScript, Drizzle ORM |
| Avisos | Worker aparte con Cron Trigger diario → bot de Telegram |
| Uso | Móvil (captura rápida en el taller) y ordenador (revisión) por igual. PWA instalable |
| Vehículos | Todos: propios, proyectos de restauración y vehículos de terceros |
| Restauración | Fases + tareas (avance) **y** diario de obra (línea de tiempo) |
| Personalización | Principio rector: nada "hardcodeado" (ver abajo) |

## Personalización

1. **Desde la app**: tipos de vehículo con campos personalizados (texto, número, fecha,
   lista, sí/no), tipos de vencimiento (periodicidad, días de aviso, a qué tipos aplica),
   planes de mantenimiento (cada X km y/o Y meses), plantillas de fases, categorías,
   estados.
2. **Apariencia**: color de acento, nombre/logo, modo claro/oscuro, y *momentos*
   (efectos —confeti, sonido— al completar tareas, fases, restauraciones o renovar
   vencimientos).
3. **Código**: modular, propio y documentado.

## Arquitectura

```
novaz-dashboard/                (npm workspaces)
├─ apps/web          SvelteKit: UI + servidor (un Worker con assets estáticos)
├─ workers/avisos    Cron diario: avisos Telegram + copia de seguridad JSON a R2
└─ packages/core     Esquema Drizzle, migraciones SQL, lógica de dominio pura (testeada)
```

Despliegue: GitHub Actions en cada push a `main` → migraciones D1 → deploy de ambos Workers.

## Modelo de datos

- **Configuración**: `tipos_vehiculo` (campos JSON), `tipos_vencimiento`,
  `planes_mantenimiento`, `plantillas_fases`, `categorias`, `estados`, `ajustes` (clave/valor JSON).
- **Núcleo**: `vehiculos` (tipo, alias, marca, modelo, año, matrícula, bastidor, estado,
  propietario = Novaz o `contacto`, campos JSON, foto portada), `contactos`, `lecturas_km`,
  `vencimientos`.
- **Historial**: `entradas` — una línea de tiempo por vehículo (clase: mantenimiento,
  reparación, diario, nota), enlazable a un plan de mantenimiento o a una fase de
  restauración. El diario de obra *son* las entradas durante una restauración.
- **Restauraciones**: `restauraciones`, `fases`, `tareas`.
- **Dinero**: `movimientos` (gasto/ingreso, categoría, enlaces opcionales a vehículo,
  entrada, vencimiento, restauración). Base para la futura contabilidad.
- **Archivos**: `adjuntos` en R2, polimórficos (entidad + id).

## Lógica de alertas (packages/core)

- Vencimiento: días restantes vs. umbrales de aviso del tipo → `ok | pronto | urgente | vencido`.
- Mantenimiento: última entrada ligada al plan (fecha, km). Próximo por fecha (+meses) y por
  km (+km). Los km se convierten en días estimados usando el ritmo de uso
  (`lecturas_km`). Gana el más cercano.
- Telegram: avisa al cruzar cada umbral (p. ej. 30/7/1 días) una sola vez
  (tabla `avisos_enviados`) + resumen semanal los lunes.

## Pantallas

Inicio (lo que viene, restauraciones activas, últimas entradas, gasto del mes) · Flota
(tarjetas/tabla con filtros) · Ficha de vehículo (historial, vencimientos, mantenimiento,
gastos, fotos, datos, restauración) · Restauración (fases/tareas, avance, horas, gasto vs
presupuesto, diario) · Captura rápida ＋ (móvil, borrador local si no hay red) · Ajustes ·
Búsqueda global (Ctrl+K).

Estética "taller industrial minimalista": oscuro por defecto, tipografía condensada para
títulos/cifras, un acento, matrículas como placa.

## Seguridad y datos

- En producción toda petición sin JWT válido de Cloudflare Access → 401.
- Fotos comprimidas en el navegador (WebP, ≤ 2000 px) antes de subir a R2.
- Copia de seguridad semanal de toda la BD en JSON a R2 + exportación manual desde Ajustes.
  D1 Time Travel como red adicional.

## Fuera de alcance (v1)

Offline completo (solo borradores), gráficas avanzadas, multiusuario con roles, facturas,
inventario, contabilidad.

## Pruebas

Vitest para la lógica de dominio (alertas, campos personalizados). `svelte-check` y build en
CI. Verificación manual en local con D1/R2 simulados (wrangler/miniflare).
