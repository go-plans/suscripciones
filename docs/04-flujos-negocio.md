# 04 — Flujos de negocio

> Definición funcional extraída del `prd_sistema_de_suscripciones.md` y traducida a reglas del sistema.

## 1. Inventario de cuentas madre (proveedores)

1. El admin registra una **cuenta madre** con `cupos_totales` (p. ej. 4 pantallas de Netflix) y `fecha_corte_proveedor`.
2. Cada venta crea una `suscripciones` sobre esa cuenta madre.
3. El sistema **valida cupos**: los triggers `trg_cupos_*` mantienen `cupos_ocupados` y **bloquean** la asignación si `cupos_ocupados >= cupos_totales`.
4. Al cancelar o vencer una suscripción activa, el cupo se libera automáticamente.

## 2. Alertas de pago a proveedores

- La vista `v_vencimientos_proveedores` devuelve las cuentas con `fecha_corte_proveedor` en los próximos **3 días** (`dias_restantes`).
- El dashboard debe mostrar: *"Vencimientos próximos: $X para el proveedor Y"*.

## 3. Margen de ganancia real

```
Ganancia =
  Σ(equivalente_usd de pagos_ingresos de clientes)
  − Σ(comisiones pagadas a referidos)
  − Σ(costo_renovacion_usd pagado a proveedores)
```

## 4. Control cambiario (tasa BCV)

- Los planes y costos de proveedores se manejan **100% en USD** aca nivel de DB.
- Pagos en **BS**: `equivalente_usd = monto_pagado_bs / tasa_bcv` (la `tasa_bcv` se toma de `tasas_cambio` del día).
- Pagos en **USDT**: `equivalentes_usd = monto_pagado` y tasa aplicada = 1.
- La tasa del día la refresca la Edge Function `fetch-bcv` (cron `tasas-bcv-diaria`) o manualmente.

## 5. Multi-suscripción y pagos globales

- Un cliente puede tener varias suscripciones activas (1 Canva + 1 Spotify).
- Si transfiere **$20** por ambas, se crea **un solo** `pagos_ingresos` y se distribuye en `pago_suscripciones` (tabla pivote) para renovar todas.
- Restricción: la combinación `(pago_ingreso_id, suscripcion_id)` es única.

## 6. Sistema de referidos automático (30%)

1. `usuarios.cliente.referido_por` apunta al agente que lo recomendó.
2. Al insertar en `pago_suscripciones` el trigger `trg_comision_referido`:
   - obtiene el `cliente_id` de la suscripción;
   - lee su `referido_por`;
   - si existe, inserta `comisiones (agente, pago, monto = 30% del asignado, estado='pendiente')`.
3. El admin liquida la comisión cambiando `estado` a `'liquidada'`.
4. Los agentes solo ven **sus** comisiones (RLS).

## 6.1 Flujo de pagos (mejorado en v0.3.1)

1. **Registro**: el admin selecciona cliente (buscador), fecha (por defecto hoy, permite pasadas), monto, moneda (se preselecciona según método), tasa BCV/Binance si aplica, método de pago y distribuye entre suscripciones activas.
2. **Renovación**: al registrar un pago, `trg_renovar_susc_por_pago` extiende `fecha_corte_cliente` de cada suscripción asignada **desde la fecha del pago** (no desde hoy), sumando la duración del plan.
3. **Comisión**: si la plataforma tiene `aplica_comision=true` y el cliente tiene `referido_por`, el trigger crea una comisión del 30% del monto asignado.
4. **Edición**: la función RPC `editar_pago` reemplaza el pago + distribución y recalcula la comisión (borra la anterior y reinserta via trigger).
5. **Borrado**: eliminar un pago cascada `pago_suscripciones` y `comisiones` (ON DELETE CASCADE).
6. **Moneda por método**: Pago Movil→BS, Zelle→USD, Binance/Transferencia→USDT, Otro→manual.

## 7. Ciclo de vida de una suscripción

```
activa ──(venció sin pago: cron diario)──▶ vencida
activa ──(cancelación manual)────────────▶ cancelada
vencida ──(nuevo pago)───────────────────▶ (nueva suscripción con fecha de corte actualizada)
```

El job `vencimientos-diarios` (00:00) marca como `vencida` toda suscripción activa con `fecha_corte_cliente < current_date`.