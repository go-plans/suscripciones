# 07 — Despliegue

## 1. Modelo de despliegue

| Pieza | Dónde | Cómo |
|---|---|---|
| Frontend | **GitHub Pages** (repo público `go-plans/suscripciones`) | build `npm run build` + publicar `dist/` en rama `gh-pages` |
| Base de datos | Supabase (gestionado, ya activo) | migraciones `supabase/migrations/` |
| Edge Functions | Supabase Functions (Deno) | `supabase functions deploy` |
| Cron | pg_cron en Supabase | job `vencimientos-diarios` (ya activo) y `tasas-bcv-diaria` |

> GitHub Pages en el plan gratuito **exige repo público** para repositorios propios.
> El repo fue hecho público como parte del despliegue (Fase 2.2).

## 2. Desplegar el frontend (GitHub Pages)

El sitio es 100 % estático (Vite con `base: './'` + `HashRouter`), así que basta
con publicar el `dist/` en la rama `gh-pages`; la API de GitHub con
`source.branch = "gh-pages"` + `source.path = "/"` se configuró una sola vez.

```bash
cd app
npm run build              # compila con anon key (sin service_role)
# 1) commitear y pushear el cambio en main primero (así Pages no queda desincronizado)
git add -A && git commit -m "chore: release vX" && git push origin main
# 2) publicar el build en la rama gh-pages (worktree huérfano)
git worktree add --orphan -b gh-pages .ghpages
Copy-Item dist\* .ghpages\ -Recurse -Force
git -C .ghpages add -A
git -C .ghpages commit -m "deploy: release vX"
git -C .ghpages push origin gh-pages --force
git worktree remove .ghpages
```

- URL del sitio: `https://go-plans.github.io/suscripciones/` (login en `/#/login`;
  credenciales del admin en `API KEYS.txt`, fuera del repo).
- Verificación rápida del sitio: el título del HTML servido debe ser
  «Suscripciones · Panel administrativo» y el bundle **no** debe contener
  `service_role` (solo anon key).

Variables de entorno del host (nunca commitear):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

> ⚠️ Solo variables **públicas** (`VITE_*`). Nunca exponer `service_role`.

## 3. Desplegar la Edge Function fetch-bcv

> La función extrae la tasa oficial del **sitio del BCV** (`bcv.org.ve`, bloque USD de
> la página de tipo de cambio de referencia) y la guarda en `tasas_cambio`. Como la
> página del BCV no envía cabeceras CORS, el scrape se hace server-side (Deno), nunca
> desde el navegador. El botón **"Reflejar tasa"** de Pagos la invoca y cae a la última
> tasa almacenada si la función aún no está desplegada.

```bash
supabase login
supabase link --project-ref xbmewcmpfnligeodggop
supabase functions deploy fetch-bcv --no-verify-jwt
```

La función usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno de Supabase (inyectadas automáticamente).

Probar manualmente:

```bash
curl -X POST https://xbmewcmpfnligeodggop.supabase.co/functions/v1/fetch-bcv \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## 4. Activar el cron de tasa BCV

Una vez desplegada la función, ejecutar una sola vez:

```sql
select cron.schedule(
  'tasas-bcv-diaria',
  '0 7 * * *',
  $$ select net.http_post(
       url := 'https://xbmewcmpfnligeodggop.supabase.co/functions/v1/fetch-bcv',
       headers := jsonb_build_object(
         'Content-Type','application/json',
         'Authorization', 'Bearer ' || '<SERVICE_ROLE_KEY>'),
       body := '{}') $$
);
```

> Ver `0002_automatizaciones.sql` para el detalle completo.

## 5. Verificación post-despliegue

```bash
# 1) Auth health
curl https://xbmewcmpfnligeodggop.supabase.co/auth/v1/health

# 2) API REST (catálogo público)
curl -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://xbmewcmpfnligeodggop.supabase.co/rest/v1/plataformas?select=nombre&order=nombre"

# 3) Cron
curl http://localhost:5173   # frontend arriba
```

## 6. Rollback

- **Esquema**: nueva migración inversa (`000N_revert_*.sql`) — nunca se editan migraciones aplicadas.
- **Frontend**: redeploy del commit anterior (los hosts estáticos permiten rollback con un clic).
- **Edge Function**: `supabase functions deploy` con versión anterior.

## 7. Entornos

- **local**: `npm run dev` contra el mismo Supabase (uno solo por ahora).
- **producción**: build estático + Supabase gestionado.
- Para añadir un entorno separado de DB: crear otro proyecto Supabase y apuntar `VITE_SUPABASE_URL` en el host.