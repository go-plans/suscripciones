# 03 — Integraciones y claves

> ⚠️ Este documento NO contiene valores reales. Los secretos viven solo en `.env` (debidamente restringido) y se referencian con placeholders.

## 1. Supabase

### 1.1 Datos del proyecto

| Dato | Valor |
|---|---|
| Project ref | `xbmewcmpfnligeodggop` |
| Project URL | `https://xbmewcmpfnligeodggop.supabase.co` |
| Región | `us-west-2` |
| Pooler de sesión | `aws-0-us-west-2.pooler.supabase.com:5432` |
| Usuario pooler | `postgres.<project-ref>` |
| Conexión directa | `db.<ref>.supabase.co:5432` (**IPv6-only**, no disponible en esta red) |

### 1.2 Claves

| Variable | Origen (dashboard → Settings → API) | Uso |
|---|---|---|
| `SUPABASE_URL` | Settings → API → Project URL | Todas las conexiones |
| `SUPABASE_ANON_KEY` | Settings → API → `publishable`/`anon` | Clientes del frontend (bypass de RLS: NO) |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` | **Acceso total, salta RLS.** Solo server-side (Edge Functions, scripts) |

> Regla de oro: el `service_role` **nunca** viaja al navegador ni se expone en el frontend.

### 1.3 CLI Supabase

```bash
supabase login                 # vincular credenciales (device-code interactivo)
supabase init                  # crea supabase/ en el proyecto
supabase link --project-ref xbmewcmpfnligeodggop
supabase db push               # aplica migrations/ (requiere conexión directa/IPv6)
```

## 2. GitHub

| Dato | Valor |
|---|---|
| Repositorio | `go-plans/suscripciones` (público desde 2026-09-20 — requisito de GitHub Pages gratis) |
| Autenticación | Personal Access Token (scope `repo` + `workflow`) |
| Origen remoto | `https://github.com/go-plans/suscripciones.git` |

### GitHub OAuth (login en la app, opcional)

1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
2. Homepage URL: URL de la app (dev: `http://localhost:5173`).
3. Callback URL: `https://xbmewcmpfnligeodggop.supabase.co/auth/v1/callback`.
4. Configurar el OAuth en Supabase → Authentication → Providers → GitHub.

## 3. Variables de entorno (`.env`)

Archivo en la raíz del proyecto `app/`. **No versionado** (`.gitignore`).

```bash
# Supabase
SUPABASE_URL=https://xbmewcmpfnligeodggop.supabase.co
SUPABASE_ANON_KEY=<anon/publishable>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
DB_PASSWORD=<password de la base>

# Conexión directa/scripts
DB_URL=https://xbmewcmpfnligeodggop.supabase.co
DB_POOLER_HOST=aws-0-us-west-2.pooler.supabase.com
DB_POOLER_PORT=5432
DB_USER=postgres.xbmewcmpfnligeodggop

# GitHub
GITHUB_TOKEN=<pat>
```

## 4. Verificación de claves (HTTP, sin IPv6)

```bash
# Health de Auth
curl https://xbmewcmpfnligeodggop.supabase.co/auth/v1/health

# Leer una tabla con la anon key (404 PGRST205 = clave OK, tabla aún no existe)
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "https://xbmewcmpfnligeodggop.supabase.co/rest/v1/plataformas?select=id&limit=1"
```

## 5. Conexión a base de datos (protocolos)

| Vía | Conexión | Disponible aquí |
|---|---|---|
| Directa | `db.<ref>.supabase.co:5432` | ❌ IPv6-only |
| Pooler sesión | `aws-0-us-west-2.pooler.supabase.com:5432` (user `postgres.<ref>`) | ✅ |
| Pooler transacción | `aws-0-us-west-2.pooler.supabase.com:6543` | ✅ (solo para operaciones transaccionales) |

> La migración se aplica con scripts Node (`pg`) vía pooler de sesión. Ver `06-desarrollo.md`.