# 08 — Changelog

> Historial de cambios del proyecto. Se actualiza **en el mismo commit** que los cambios de código. Formato de líneas: `- [tipo] descripción` (tipo: feat / fix / docs / chore / security / refactor).

## 2026-09-19 — Lanzamiento inicial

### v0.1.0

- **feat** Inicialización del proyecto Vite + React + TypeScript en `app/` (`npm create vite@latest`).
- **chore** Instalación de dependencias (0 vulnerabilidades).
- **chore** Repositorio GitHub privado `go-plans/suscripciones` creado; commit inicial en `main`.
- **chore** Dependencia dev `pg` para scripts de migración por pooler.
- **docs** Estructura de documentación `docs/` creada (estándar docs-as-code) + README raíz.

### Decisiones de seguridad y entorno

- **security** `API KEYS.txt` y `.env` creados fuera del repo con ACL restringido (solo el usuario propietario).
- **security** `.gitignore` endurecido en raíz de repo: `.env`, `.env.*`, `API KEYS.txt`.
- **docs** Documentación de gestión y rotación de claves (`docs/05-seguridad.md`).

### Base de datos (Supabase)

- **feat** Migración `0001_initial_schema.sql`: 11 tablas + 2 vistas + índices + triggers (`trg_comision_referido`, `trg_cupos_*`) + RLS (admin/agente/catálogo anónimo) + función `es_admin`.
- **feat** Migración `0002_automatizaciones.sql`: job cron `vencimientos-diarios` (00:00) + vista `v_vencimientos_proveedores` + template de cron `tasas-bcv-diaria`.
- **feat** Migración `0003_seed.sql`: plataformas ejemplo (Netflix, Spotify, Disney+, Canva, ChatGPT), planes mensuales y tasa BCV del día.
- **feat** Edge Function `fetch-bcv` (Deno) para obtener la tasa BCV desde dolarapi.com y almacenarla en `tasas_cambio`.
- **fix** Corrección de orden de creación de tablas (FK `comisiones → pagos_ingresos`).
- **fix** Uso de `cron.schedule` (el schema correcto es `cron`, no `extensions.cron`).
- **fix** Splitter de ejecución de migraciones: gestión correcta de bloques `$$…$$` (evita `end $$$`).

### Aplicación de migraciones

- **feat** Conexión a Supabase vía **pooler de sesión** (`aws-0-us-west-2.pooler.supabase.com:5432`, usuario `postgres.<ref>`) — la conexión directa es IPv6-only y la red no tiene IPv6.
- **feat** Verificación funcional de la base (transaccional, sin datos persistentes): cupos, comisión 30% y rechazo de sobrecupo, todos ✅.
- **chore** `migracion_completa.sql` (consolidado de 0001+0002+0003 para pegar en SQL Editor) en la raíz `Suscripciones/` (fuera del repo).

## Próximos

- **Fase 2** CRUD de clientes, calculadora BCV, dashboard de vencimientos de proveedores (depende de la UI del frontend).
- **Fase 3** Catálogo público de venta con la vista `v_catalogo_publico`.
- **feat** Deploy de `fetch-bcv` y activación del cron `tasas-bcv-diaria`.