# Novaz · Panel del taller

Gestor de flota y restauraciones del taller Novaz. Ligero, rápido, instalable en el móvil y
personalizable a fondo. Corre entero en Cloudflare (Workers + D1 + R2), sin servidores que
mantener.

**Módulo 1 (este):** vehículos propios y de terceros, papeles con vencimiento (ITV, seguro,
impuestos…), mantenimientos por km/tiempo, historial, restauraciones (fases, tareas y diario de
obra), gastos, fotos y avisos por Telegram.

**Siguientes:** 2 · Clientes y facturas → 3 · Inventario → 4 · Contabilidad.
Diseño: [`docs/specs/`](docs/specs/).

---

## Estructura

```
apps/web          SvelteKit (interfaz + servidor) → Worker "novaz-dashboard"
workers/avisos    Cron diario: avisos Telegram · cron semanal: copia de seguridad en R2
packages/core     Esquema de la BD (Drizzle), migraciones SQL y lógica de dominio con tests
```

## Desarrollo en local

Necesitas Node 24 (`nvm use` lo coge de `.nvmrc`).

```bash
npm install
npm run db:migrate:local     # crea la BD local con los datos de partida
npm run dev                  # http://localhost:5173
npm test                     # tests de dominio y del worker de avisos
npm run check                # comprobación de tipos
```

En local no hay login. D1 y R2 se simulan dentro de `apps/web/.wrangler/`.

Probar el worker de avisos contra la misma BD local:

```bash
cd workers/avisos
npx wrangler dev --test-scheduled --persist-to ../../apps/web/.wrangler/state
curl "http://localhost:8787/__scheduled?cron=0+7+*+*+*"   # avisos
curl "http://localhost:8787/__scheduled?cron=0+3+*+*+0"   # copia de seguridad
```

### Cambiar la base de datos

1. Edita `packages/core/src/schema.ts`.
2. `npm run db:generate`: genera la migración SQL en `packages/core/migrations/`.
3. `npm run db:migrate:local`. En producción la aplica el despliegue automático.

---

## Puesta en marcha en Cloudflare (una sola vez)

Todo desde la raíz del repo, con `npx wrangler …`.

### 1. Recursos

```bash
npx wrangler login
npx wrangler d1 create novaz                 # copia el database_id que devuelve
npx wrangler r2 bucket create novaz-archivos
```

Pega el `database_id` en **los dos** `wrangler.jsonc` (`apps/web` y `workers/avisos`).

### 2. Primer despliegue

```bash
cd apps/web && npx wrangler d1 migrations apply novaz --remote && cd ../..
npm run deploy
```

### 3. Dominio

En `apps/web/wrangler.jsonc` añade, por ejemplo:

```jsonc
"routes": [{ "pattern": "panel.novaz.es", "custom_domain": true }]
```

### 4. Acceso solo para ti (Cloudflare Access)

La app **se niega a servir datos** (error 503) hasta que esto esté configurado.

1. Zero Trust → Access → Applications → *Add* → *Self-hosted*. Dominio: `panel.novaz.es`.
2. Política: *Allow* → *Emails* → tu correo (y el de quien quieras).
3. Copia el **Application Audience (AUD) tag**.
4. En `apps/web/wrangler.jsonc` → `vars`:
   - `ACCESS_TEAM_DOMAIN`: `tu-equipo.cloudflareaccess.com`
   - `ACCESS_AUD`: el AUD copiado
5. Vuelve a desplegar.

La app verifica la firma del token de Access en cada petición. Aunque alguien llegue a la URL
`*.workers.dev`, recibe un 401.

### 5. Avisos por Telegram

1. Habla con [@BotFather](https://t.me/BotFather) → `/newbot` → copia el token.
2. Guarda el token como secreto en los dos workers:
   ```bash
   cd workers/avisos && npx wrangler secret put TELEGRAM_TOKEN
   cd ../../apps/web && npx wrangler secret put TELEGRAM_TOKEN   # para el botón «Probar»
   ```
3. Escribe cualquier cosa a tu bot y consulta tu chat ID con [@userinfobot](https://t.me/userinfobot).
4. En la app, ve a **Ajustes → Avisos**, pega el chat ID, guarda y pulsa **Probar**.
5. En `workers/avisos/wrangler.jsonc` pon `APP_URL` (p. ej. `https://panel.novaz.es`) para que los
   mensajes lleven enlaces.

Cada mañana se avisa al cruzar cada umbral (por defecto 30, 7 y 1 días antes, y al vencer),
sin repetir. Los lunes llega un resumen semanal.

### 6. Despliegue automático desde GitHub

1. Crea el repositorio y haz `git push` de `main`.
2. En GitHub → Settings → Secrets and variables → Actions, añade:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`: plantilla *Edit Cloudflare Workers* más permiso **D1: Edit**.
3. Cada push a `main` ejecuta tests y comprobaciones, aplica migraciones y despliega los dos
   workers. Los pull requests solo se comprueban.

### 7. Instalar en el móvil

Abre la URL en el móvil → *Añadir a pantalla de inicio*. Se abre como una app más, con atajo a
«Registrar».

---

## Personalización

Desde **Ajustes**, sin tocar código:

| Qué | Dónde |
|---|---|
| Nombre, lema, color de acento, tema claro/oscuro | Ajustes → General |
| Tipos de vehículo con sus campos propios (texto, número, fecha, lista, sí/no) | Ajustes → Tipos de vehículo |
| Qué papeles vencen, cada cuánto y cuándo avisar | Ajustes → Vencimientos |
| Planes de mantenimiento (cada X km y/o Y meses) por tipo o por vehículo | Ajustes → Mantenimiento |
| Fases y tareas de partida de las restauraciones | Ajustes → Plantillas de obra |
| Categorías de gasto/ingreso (con cuenta contable para el futuro) | Ajustes → Categorías |
| Estados del vehículo | Ajustes → Estados |
| Efectos y sonidos al completar cosas (confeti, aplausos, tu propio audio) | Ajustes → Momentos |

En el código, el diseño vive en `apps/web/src/app.css` (tokens de color y tipografía) y los
iconos elegibles en `apps/web/src/lib/iconos.ts`.

## Copias de seguridad

- **Automática:** los domingos se guarda `copias/novaz-AAAA-MM-DD.json` en R2. Se conservan las 12 últimas.
- **Manual:** Ajustes → Tus datos → Exportar todo (JSON). Los gastos también se exportan en CSV.
- **D1 Time Travel:** `npx wrangler d1 time-travel info novaz` permite volver a un momento anterior.
