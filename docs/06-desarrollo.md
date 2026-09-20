# 06 — Desarrollo local

## 1. Requisitos

- Node.js **24+** y npm **11+** (verificar: `node --version`, `npm --version`)
- Git 2.53+
- Supabase CLI (opcional, para edge functions y `db push`): `supabase --version`

## 2. Setup

```bash
# 1) Dependencias
cd app
npm install

# 2) Variables de entorno (crear a partir de API KEYS.txt)
#    .env  →  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DB_PASSWORD, GITHUB_TOKEN

# 3) Servidor de desarrollo
npm run dev          # http://localhost:5173
```

## 3. Scripts npm

| Script | Comando | Uso |
|---|---|---|
| dev | `npm run dev` | servidor dev con HMR |
| build | `npm run build` | build de producción (tsc + vite) |
| preview | `npm run preview` | sirve el build localmente |
| lint | `npm run lint` | oxlint (config `.oxlintrc.json`) |

## 4. Migraciones de base de datos

La conexión directa es IPv6-only; se trabaja **vía pooler de sesión**.

```bash
# Aplicar una migración (script Node con driver pg)
set DB_PASS=<password>  REGION=us-west-2
node <runner> supabase/migrations/000N_migracion.sql
```

> El runner vive en el repo de herramientas (se documenta aquí el patrón, no el secreto). Ver `docs/03-integraciones.md` para la conexión pooler.

Alternativamente aplicar manualmente desde el **SQL Editor** del dashboard de Supabase.

## 5. Supabase CLI (edge functions)

```bash
supabase login
supabase link --project-ref xbmewcmpfnligeodggop
supabase functions deploy fetch-bcv --no-verify-jwt
```

## 6. Convenciones de código

- **Idioma del código**: los identificadores de negocio (nombres de tabla/columna) en inglés; UI en español.
- **TypeScript estricto**: tipos explícitos para dinero/fechas; nunca `any` en modelos financieros.
- **Dinero**: usar `number` con redondeo a 2 decimales en el frontend; en la DB `NUMERIC(12,2)`.
- **Fechas**: usar `date-fns` para vencimientos; comparar fechas (no timestamps) para cortes.
- **Commits**: mensajes tipo Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Cada cambio que afecte comportamiento se refleja en `docs/08-changelog.md`.

## 7. Tipos del frontend (esqueleto recomendado)

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
)

// src/types/db.ts
export type Plan = { id: string; plataforma_id: string; duracion_dias: number; precio_venta_usd: number }
export type Suscripcion = { id: string; cliente_id: string; plan_id: string; cuenta_madre_id: string; fecha_corte_cliente: string; estado: 'activa' | 'vencida' | 'cancelada' }
```

## 8. Logs

- Los logs de ejecución de scripts y migraciones van a `logs/` (fuera de git).
- No documentar secretos en logs.