# 02 — Base de datos

> Proyecto Supabase: `xbmewcmpfnligeodggop` · Región: `us-west-2`
> Migraciones fuente: [`supabase/migrations/`](../supabase/migrations/)

## 1. Modelo de datos (12 tablas + 2 vistas)

Relaciones principales: un **cliente** (`usuarios.rol='cliente'`) puede tener muchas **suscripciones**; cada suscripción se enlaza a una **cuenta madre** (inventario comprado a un **proveedor**); los pagos de clientes (`pagos_ingresos`) se distribuyen en varias suscripciones vía `pago_suscripciones` (pivote).

### 1.1 Catálogo e inventario (proveedores)

| Tabla | Descripción | Claves |
|---|---|---|
| `plataformas` | Servicios base (Netflix, Canva…) | `nombre` unique, `activa` |
| `planes` | Precio de venta anclado en USD | FK `plataforma_id`; unique `(plataforma_id, duracion_dias)` |
| `proveedores` | Quién te vende las cuentas | `nombre`, `contacto`, `metodo_pago_preferido` |
| `cuentas_madre` | Cuentas base = inventario | FK `proveedor_id`, `plataforma_id`; `cupos_totales`, `cupos_ocupados`, `costo_renovacion_usd`, `fecha_corte_proveedor`, `estado` |

### 1.2 Clientes, suscripciones y referidos

| Tabla | Descripción | Claves |
|---|---|---|
| `usuarios` | Clientes, agentes y admin | `rol` ('admin'/'agente'/'cliente'), `referido_por` (FK a `usuarios.id`) |
| `suscripciones` | Contrato individual del cliente | FK `cliente_id`, `plan_id`, `cuenta_madre_id`; `fecha_corte_cliente`, `estado` ('activa'/'vencida'/'cancelada') |
| `comisiones` | 30% para agentes referidos | FK `agente_id`, `pago_id`; `monto_comision_usd`, `estado` ('pendiente'/'liquidada') |

### 1.3 Finanzas y control cambiario

| Tabla | Descripción | Claves |
|---|---|---|
| `tasas_cambio` | Histórico de tasa BCV | `fecha` unique, `tasa_bcv NUMERIC(12,4)` |
| `pagos_ingresos` | Pagos recibidos de clientes | FK `cliente_id`; `moneda` ('USD'/'BS'/'USDT'), `equivalente_usd`, `tasa_bcv_aplicada`, `metodo_pago`, `fecha_pago` |
| `pago_suscripciones` | Pivote pago↔suscripción | FKs `pago_ingreso_id`, `suscripcion_id`; unique `(pago_ingreso_id, suscripcion_id)` |
| `pagos_egresos` | Pagos a proveedores | FKs `proveedor_id`, `cuenta_madre_id`; `monto_pagado_usd` |

## 2. Reglas de tipado (críticas)

```sql
NUMERIC(12,2)   -- dinero: precio, costos, comisiones, equivalentes
NUMERIC(12,4)   -- tasa BCV
integer         -- cupos y duración
date            -- fechas de corte (fecha_inicio, fecha_corte_*)
```

**NUNCA usar `FLOAT`/`REAL`/`DOUBLE PRECISION` para dinero o tasas.**

## 3. Triggers

| Nombre | Evento | Efecto |
|---|---|---|
| `trg_comision_referido` | `AFTER INSERT` en `pago_suscripciones` | Si el cliente de la suscripción tiene `referido_por`, inserta en `comisiones` el **30%** de `monto_asignado_usd` con estado `pendiente` |
| `trg_cupos_after_insert` / `_update` / `_delete` | en `suscripciones` | Mantiene `cuentas_madre.cupos_ocupados` y **rechaza** asignaciones que superen `cupos_totales` |

## 4. Row Level Security (RLS)

| Rol | Acceso |
|---|---|
| **admin** (usuarios.rol='admin' y id = auth.uid()) | Acceso total (SELECT/INSERT/UPDATE/DELETE) en las 11 tablas de gestión |
| **agente** | SELECT solo sobre sus propias `comisiones` (`agente_id = auth.uid()`) |
| **anon** | SELECT sobre `plataformas` y `planes` (únicamente para el catálogo público de venta) |

```sql
-- Convención para que un usuario sea admin:
-- usuarios.id = auth.uid() AND rol = 'admin'
```

## 5. Vistas

| Vista | Propósito |
|---|---|
| `v_catalogo_publico` | Fase 3: catálogo de venta (plataforma, logo, duración, precio) |
| `v_vencimientos_proveedores` | Alerta del dashboard: cortes de cuenta madre en los próximos 3 días (`dias_restantes`) |

## 6. Automatizaciones (pg_cron)

| Job | Horario | Acción |
|---|---|---|
| `vencimientos-diarios` | `0 0 * * *` | Marca `suscripciones` como `vencida` si `fecha_corte_cliente < current_date` |
| `tasas-bcv-diaria` *(en 0002 como template)* | `0 22 * * *` | Invoca Edge Function `fetch-bcv` vía `net.http_post`; captura la tasa publicada por el BCV a las 16:00 VET (**22:00 UTC = 18:00 VET**) |

## 7. Seed (datos de ejemplo)

`0003_seed.sql` inserta plataformas (Netflix, Spotify, Disney+, Canva, ChatGPT), plan mensual de ejemplo para cada una y la tasa BCV del día (usuario debe reemplazarla o reflejarla con la Edge Function `fetch-bcv`, que la extrae de bcv.org.ve).

## 8. Índices

Creados sobre todas las FKs y sobre columnas de búsqueda frecuente (fechas de corte, cuentas madre, agente de comisión). Ver `0001_initial_schema.sql`. Si una query del dashboard se vuelve lenta, revisar el plan con `EXPLAIN ANALYZE` y añadir índice **en una migración nueva, nunca editando las anteriores**.