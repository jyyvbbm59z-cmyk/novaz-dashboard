# Novaz Dashboard: notas para el desarrollo

- Todo en español: código de dominio, UI, commits y documentación.
- Node 24 (`.nvmrc`). Monorepo con npm workspaces: `apps/web` (SvelteKit 2 + Svelte 5 runes, Tailwind 4),
  `workers/avisos` (cron), `packages/core` (esquema Drizzle, migraciones, lógica pura + tests).
- Principio rector: **nada hardcodeado**. Tipos, vencimientos, planes, estados, categorías y plantillas
  son datos configurables desde Ajustes.
- Convenciones de datos: fechas de negocio `YYYY-MM-DD` (texto), importes en **céntimos** (entero),
  campos personalizados en JSON (`vehiculos.campos`, definidos en `tipos_vehiculo.campos`).
- Todo gasto/ingreso pasa por `movimientos`. Ahí se enganchará la contabilidad.
- Acciones de formulario: devuelven `{ mensaje?, momento? }`; el cliente usa `enviar()` / `accion()`
  de `$lib/enviar.ts` (avisos + momentos). Errores de validación con `ErrorFormulario` dentro de `accion()`.
- Lógica compartida de escritura en `apps/web/src/lib/server/acciones.ts`.
- Antes de dar algo por terminado: `npm test`, `npm run check`, `npm run build`.
- Cambios de esquema: editar `schema.ts` → `npm run db:generate` → `npm run db:migrate:local`.
