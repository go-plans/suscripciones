# 01 — Arquitectura

> Fecha: 2026-09-19 · Estado: vigente

## 1. Visión general

Aplicación web **cliente-servidor** con un backend gestionado (BaaS). El frontend consume directamente la base de datos y las Edge Functions de Supabase mediante la API REST/PostgREST. No existe servidor propio: Supabase provee base de datos, autenticación, funciones serverless y bases para automatización por cron.

```
┌─────────────────────┐
│  Frontend (Vite)    │
│  React + TS         │
│  Tailwind + shadcn  │
└──────────┬──────────┘
           │ HTTPS / PostgREST (anon key, sesiones autenticadas)
┌──────────▼──────────────────────────────────────────┐
│  Supabase (proyecto xbmewcmpfnligeodggop, us-west-2)│
│  ├── PostgreSQL (12 tablas, RLS, triggers)          │
│  ├── Edge Functions (Deno): fetch-bcv               │
│  ├── pg_cron: tasas BCV + vencimientos diarios      │
│  └── Auth (opcional: login con GitHub)              │
└─────────────────────────────────────────────────────┘
```

## 2. Stack

| Capa | Elección | Justificación |
|---|---|---|
| Build | Vite 6+ | HMR rápido, estándar del ecosistema React/TS |
| Lenguaje | TypeScript | Evita errores al cruzar datos financieros (monedas, fechas) |
| UI | Tailwind + shadcn/ui | Componentes accesibles y personalizables, DataTables para inventario |
| Fechas/moneda | date-fns/dayjs + `Intl.NumberFormat` | Cálculo estricto de vencimientos y formato BS/USD |
| Backend | Supabase/PostgreSQL | SQL exacto, RLS, triggers, cron |
| Calculadora BCV | Edge Function `fetch-bcv` + pg_cron | Tasa oficial diaria (dolarapi.com) |

## 3. Estructura de carpetas

```
app/
├── src/                    # Frontend React
│   ├── main.tsx            # Entry point
│   ├── App.tsx
│   ├── index.css
│   └── assets/
├── supabase/
│   ├── migrations/        # SQL versionado (0001..0003)
│   └── functions/
│       └── fetch-bcv/     # Deno Edge Function
├── docs/                  # Esta documentación
└── logs/                  # Logs de ejecución (no versionados)
```

## 4. Decisiones clave

| # | Decisión | Justificación | Referencia |
|---|---|---|---|
| 1 | **BaaS (Supabase) en vez de servidor propio** | Menos infraestructura, RLS nativo, escalado gestionado | [ADR-001](./ADR/001-backend-como-servicio.md) |
| 2 | **Dinero en `NUMERIC(12,2)`, tasa en `NUMERIC(12,4)`**, nunca FLOAT | Precisión contable exacta | [02-base-de-datos](./02-base-de-datos.md) |
| 3 | **Ventas ancladas en USD**, BS convertidos por tasa BCV del día | Contabilidad estable ante inflación | [04-flujos-negocio](./04-flujos-negocio.md) |
| 4 | **Comisión de referidos por trigger** (30% del neto) | Automatización con integridad transaccional | [04-flujos-negocio](./04-flujos-negocio.md) |
| 5 | **Conexión DB vía pooler de sesión** (`aws-0-us-west-2.pooler.supabase.com:5432`) | La conexión directa es IPv6-only y esta red no tiene IPv6 | [03-integraciones](./03-integraciones.md) |

## 5. Escalabilidad

- **Base de datos**: el esquema relacional normalizado (FKs, índices añadidos, RLS por rol) soporta crecimiento de clientes/cuentas sin rediseño.
- **Frontend**: separación por módulos (páginas por dominio: clientes, pagos, inventario) permite añadir secciones sin acoplar.
- **Automatizaciones**: cron centralizado en `pg_cron`; nuevas tareas son un insert en `extensions.cron.job`.
- **Catálogo público (Fase 3)**: mediante vistas SQL de solo lectura (`v_catalogo_publico`), sin exponer tablas internas.

## 6. Limitaciones conocidas

- La **conexión directa** a la base (IPv6) no funciona desde la red actual del cliente; todo acceso DB se hace por pooler o por el dashboard.
- La Edge Function `fetch-bcv` depende de la disponibilidad de `dolarapi.com`. Si cambia, hay que actualizar la fuente en la función.
- RLS exige que el admin/all users tengan su fila en `usuarios` con `id = auth.uid()`.