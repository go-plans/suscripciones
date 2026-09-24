# 02 — Base de datos

> Proyecto Supabase: `xbmewcmpfnligeodggop` · Región: `us-west-2`
> Migraciones fuente: [`supabase/migrations/`](../supabase/migrations/)
> Pooler: `aws-0-us-west-2.pooler.supabase.com:5432` (usuario `postgres.<ref>`; el host directo `db.<ref>.supabase.co` no resuelve)

## 1. Modelo de datos (13 tablas + 2 vistas)

Relaciones principales: un **cliente** (`usuarios.rol='cliente'`) puede tener muchas **suscripciones**; cada suscripción se enlaza a una **cuenta madre** (inventario comprado a un **proveedor**); los pagos de clientes (`pagos_ingresos`) se distribuyen en varias suscripciones vía `pago_suscripciones` (pivote).

### 1.1 Catálogo e inventario (proveedores)

| Tabla | Descripción | Claves |
|---|---|---|
| `plataformas` | Servicios base (Netflix, Canva…) | `nombre` unique, `activa`, `aplica_comision` |
| `planes` | Precio de venta anclado en USD; `precio_referencia_usd` opcional para el **precio tachado** del catálogo público | FK `plataforma_id`; unique `(plataforma_id, duracion_dias)` |
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
| `tasas_cambio` | Histórico de tasas del día | `fecha` unique, `tasa_bcv NUMERIC(12,4)`, `tasa_eur_bs NUMERIC(12,4)` (€→Bs para gift cards de Apple, migración `0012`) |
| `pagos_ingresos` | Pagos recibidos de clientes | FK `cliente_id`; `moneda` ('USD'/'BS'/'USDT'), `equivalente_usd`, `tasa_bcv_aplicada`, `metodo_pago` ('Zelle'/'Pago Movil'/'Pago Movil Binance'/'Binance'/'Transferencia'/'Otro'), `fecha_pago` |
| `pago_suscripciones` | Pivote pago↔suscripción | FKs `pago_ingreso_id`, `suscripcion_id`; unique `(pago_ingreso_id, suscripcion_id)` |
| `pagos_egresos` | Pagos a proveedores | FKs `proveedor_id`, `cuenta_madre_id`; `monto_pagado_usd` |

### 1.4 Tienda y pedidos (v0.4.0)

| Tabla | Descripción | Claves |
|---|---|---|
| `pedidos` | Pedidos de la tienda: gift cards y planes solicitados por clientes registrados | `tipo` ('plan'/'giftcard'), `plataforma`, campos por tipo (`duracion_dias`+`precio_usd` para plans; `valor_giftcard_usd`+`precio_giftcard_eur`+`diseno_giftcard` para gift cards), FK `cliente_id`→`usuarios.id` (ON DELETE SET NULL), `cliente_nombre`, `cliente_contacto`, `estado` ('nuevo'/'contactado'/'completado'/'cancelado'), cobro del checkout (migración `0012`): `metodo_pago`, `moneda_cobro`, `monto_cobro NUMERIC(12,2)` |

> **Tarifas de gift cards en código (fuera de la BD):** los 19 valores USD→EUR de las Apple Gift
> Cards viven en `src/lib/giftcards.ts` (p. ej. $25 → 30.75 €) a propósito, para que no se editen
> por accidente desde el panel. Solo hay que tocar ese archivo para cambiar tarifas.

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
| `auto_crear_usuario_cliente` | `AFTER INSERT` en `auth.users` | **Registro público**: crea la fila en `usuarios` con `rol='cliente'` tomando nombre/teléfono de `raw_user_meta_data` del usuario recién registrado. Así el cliente nunca puede escribirse a sí mismo (el trigger lo hace la BD). Puede desactivarse en el SQL Editor si se quiere el alta manual |
| `auto_confirmar_email` | `BEFORE INSERT` en `auth.users` | **Registro sin verificación (v0.3.3)**: fija `email_confirmed_at`/`confirmed_at = now()` si vienen NULL. El signup devuelve sesión y el usuario entra directo a la tienda |
| `renovar_suscripcion_por_pago` | `AFTER INSERT` en `pago_suscripciones` | Extiende `fecha_corte_cliente` desde la **fecha del pago** (no `current_date`), sumando `duracion_dias` del plan; marca estado `activa`. Actualizado en v0.3.1 para soportar cobros atrasados |
| `editar_pago` (RPC) | llamada desde app (solo admin) | Reemplaza pago + distribución y recalcula comisión del agente atómicamente. Valida `es_admin()`. Creada en v0.3.1 |

## 4. Row Level Security (RLS)

| Rol | Acceso |
|---|---|
| **admin** (usuarios.rol='admin' y id = auth.uid()) | Acceso total (SELECT/INSERT/UPDATE/DELETE) en las 11 tablas de gestión |
| **agente** | SELECT solo sobre sus propias `comisiones` (`agente_id = auth.uid()`) |
| **cliente** (autenticado, rol='cliente') | SELECT/UPDATE solo sobre su propia fila en `usuarios` (políticas `cliente_ve_su_fila` / `cliente_edita_su_fila`); SELECT e INSERT solo sobre **sus propios pedidos** (`cliente_id = auth.uid()`) |
| **anon** | SELECT sobre `plataformas` y `planes` (únicamente para el catálogo público de venta) |

```sql
-- Convención para que un usuario sea admin:
-- usuarios.id = auth.uid() AND rol = 'admin'
```

## 5. Vistas

| Vista | Propósito |
|---|---|
| `v_catalogo_publico` | Catálogo de venta público: plataforma, logo, duración en días, precio de venta y precio de referencia (tachado). `security_invoker` + solo columnas públicas (sin inventario, proveedores ni costos) |
| `v_vencimientos_proveedores` | Alerta del dashboard: cortes de cuenta madre en los próximos 3 días (`dias_restantes`) |

## 6. Automatizaciones (pg_cron)

| Job | Horario | Acción |
|---|---|---|
| `vencimientos-diarios` | `0 0 * * *` | Marca `suscripciones` como `vencida` si `fecha_corte_cliente < current_date` |
| `tasas-bcv-diaria` *(en 0002 como template)* | `0 22 * * *` | Invoca Edge Function `fetch-bcv` vía `net.http_post`; captura la tasa publicada por el BCV a las 16:00 VET (**22:00 UTC = 18:00 VET**) |

## 7. Seed (datos de ejemplo)

`0003_seed.sql` inserta plataformas (Netflix, Spotify, Disney+, Canva, ChatGPT), plan mensual de ejemplo para cada una y la tasa BCV del día (usuario debe reemplazarla o reflejarla con la Edge Function `fetch-bcv`, que la extrae de bcv.org.ve).

**Fase 3** (migraciones aplicadas a la BD real, no solo seed): `0007_tienda.sql` crea la infraestructura del catálogo de venta + el seed de **Google One** (`aplica_comision`); `0008_catalogo_venta.sql` fija los precios reales de venta de **Google One** (2,99 con ref. 5,99 / 8,99 / 11,99 US$), **Canva Pro** (8,00 / 39,99 / 69,99 US$) y **Spotify Premium** (3,49 / 16,99 / 28,99 US$), y **desactiva** el plan duplicado "Google One 5 TB" (solo tenía 365 días a 11,99 US$) sin borrarlo.

## 8. Índices

Creados sobre todas las FKs y sobre columnas de búsqueda frecuente (fechas de corte, cuentas madre, agente de comisión). Ver `0001_initial_schema.sql`. Si una query del dashboard se vuelve lenta, revisar el plan con `EXPLAIN ANALYZE` y añadir índice **en una migración nueva, nunca editando las anteriores**.