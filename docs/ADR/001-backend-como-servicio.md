# ADR-001 — Backend como servicio (Supabase) en lugar de servidor propio

- **Estado**: Aceptado (2026-09-19)
- **Decisión**: usar **Supabase (PostgreSQL gestionado + funciones serverless + RLS + cron)** como backend del Sistema de Gestión de Suscripciones.

## Contexto

El sistema requiere:

- esquema relacional complejo con dinero y conversión de monedas;
- lógica transaccional (comisiones 30% automáticas, control de cupos);
- seguridad por roles (admin total, agente limitado, catálogo público anónimo);
- automatizaciones diarias (vencimientos, tasa BCV).

## Opciones consideradas

1. **Servidor propio (Node/Express + PostgreSQL)** — mayor control, pero infraestructura, hosting y costes de mantenimiento.
2. **Supabase (BaaS)** — base gestionada, RLS nativo, Edge Functions, pg_cron y autenticación integradas.

## Decisión

Se adopta **Supabase**. La lógica de negocio crítica (comisiones y cupos) se implementa como **triggers en la base de datos**, lo que garantiza integridad transaccional e independencia del frontend.

## Consecuencias

**Positivas**:
- Sin servidor que mantener; escalado gestionado.
- RLS centraliza la seguridad a nivel de datos.
- Triggers/cron automáticos con integridad asegurada.

**Negativas / costes**:
- La conexión directa a la base requiere IPv6; en redes sin IPv6 se debe usar el pooler (`aws-0-us-west-2.pooler.supabase.com`).
- La Edge Function depende del servicio `dolarapi.com` (fuente de la tasa BCV).
- Vendor lock-in moderado de Supabase; las migraciones SQL son portables a otra instancia de PostgreSQL con ajustes menores (schema `cron`, `auth.uid()`).

## Alternativas futuras

Si se requiere portabilidad completa: las migraciones SQL están versionadas y pueden ejecutarse en cualquier PostgreSQL (habría que reemplazar las funciones `auth.*` y el schema `cron`).