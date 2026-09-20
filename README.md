# Sistema Integral de Gestión de Suscripciones

Aplicación web para la **reventa y gestión de suscripciones digitales** (Netflix, Spotify, Canva, etc.) con control de **proveedores y cuentas madre**, **clientes**, **referidos (30% de comisión)**, **control cambiario USDT/BS según tasa BCV** y **pagos** a clientes y proveedores.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vite + React + TypeScript |
| Estilos | Tailwind CSS + Shadcn UI (Radix) |
| Backend / BBDD | Supabase (PostgreSQL 15) |
| Edge Functions | Deno (Supabase) |
| Automatización | pg_cron + pg_net |
| Control de versiones | Git + GitHub (**go-plans/suscripciones**, repo privado) |
| Conexión BBDD | Pooler de sesión de Supabase (`aws-0-us-west-2.pooler.supabase.com:5432`) |

## Estructura del repositorio

```
app/                                  ← proyecto (repo de git)
├── src/                              ← código fuente del frontend
├── supabase/
│   ├── migrations/                   ← migraciones SQL versionadas
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_automatizaciones.sql
│   │   └── 0003_seed.sql
│   └── functions/
│       └── fetch-bcv/                ← Edge Function: tasa BCV diaria
├── docs/                             ← documentación completa del proyecto
├── logs/                             ← logs de ejecución (no se versionan)
├── .env                              ← secretos (NO se versiona)
└── .gitignore
```

## Documentación

La documentación completa está en [`docs/`](./docs/README.md), organizada por capítulos:

1. [Arquitectura](./docs/01-arquitectura.md)
2. [Base de datos](./docs/02-base-de-datos.md)
3. [Integraciones y claves](./docs/03-integraciones.md)
4. [Flujos de negocio](./docs/04-flujos-negocio.md)
5. [Seguridad](./docs/05-seguridad.md)
6. [Desarrollo local](./docs/06-desarrollo.md)
7. [Despliegue](./docs/07-despliegue.md)
8. [Changelog](./docs/08-changelog.md)

## Estado actual (Proyecto)

| Fase | Estado |
|---|---|
| Fase 1: proyecto Vite + TS + Git + repo GitHub | ✅ Completado |
| Fase 1: esquema Supabase (12 tablas, triggers, RLS, cron, seed) | ✅ Completado |
| Fase 2: panel administrativo (CRUD clientes, calculadora BCV, alertas) | 🔄 Pendiente |
| Fase 3: catálogo público de venta | ⏳ Pendiente |