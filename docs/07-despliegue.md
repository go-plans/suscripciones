# 07 — Despliegue

## 1. Modelo de despliegue

| Pieza | Dónde | Cómo |
|---|---|---|
| Frontend | Hosting estático (Vercel/Netlify/Cloudflare Pages) | build `npm run build` + subida de `dist/` |
| Base de datos | Supabase (gestionado, ya activo) | migraciones `supabase/migrations/` |
| Edge Functions | Supabase Functions (Deno) | `supabase functions deploy` |
| Cron | pg_cron en Supabase | job `vencimientos-diarios` (ya activo) y `tasas-bcv-diaria` |

## 2. Desplegar el frontend

```bash
npm run build              # produce dist/
# en Vercel: framework Vite, build command "npm run build", output "dist"
```

Variables de entorno del host (nunca commitear):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

> ⚠️ Solo variables **públicas** (`VITE_*`). Nunca exponer `service_role`.

## 3. Desplegar la Edge Function fetch-bcv

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