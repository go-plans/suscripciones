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

## 8. Tienda pública (catálogo por plataforma, v0.3.2)

1. La portada de la tienda (`/#/tienda`) muestra **una tarjeta por plataforma** con el icono de su marca (Google G, Canva C, círculo de Spotify) y la estética de cada una: Google blanca, Canva morada, Spotify verde.
2. Al pulsar una tarjeta se abre **la página de la plataforma** (`/#/tienda/:slug`) con sus planes y el diseño completo de la marca ("Contratar" apunta al registro/ingreso del cliente).
3. Los slugs son estables: `google`, `canva`, `spotify` (cualquier plataforma extra usa un slug normalizado de su nombre).
4. Los precios mostrados ("Desde $") salen del mínimo de `planes.precio_venta_usd` del catálogo público y el equivalente en BS se calcula con la tasa BCV del día.

## 8.1 Apple Gift Cards (v0.4.0)

1. Los **valores y precios son tarifas fijas en código** (`src/lib/giftcards.ts`): 19 denominaciones USD → precio de venta en EUR (p. ej. $25 → 30.75 €). *No viven en la BD* para que no sean editables por accidente.
2. La página `/#/tienda/apple` unifica la portada (`apple.com/shop/gift-cards`) y la página de compra (`/buy-giftcard`): hero con lema en inglés, chips "¿Dónde puedes usarla?", **selector de diseño** (izquierda) y **lista de montos** (derecha).
3. Los diseños se cargan de `public/apple/<id>.png` (los subirá el dueño de la tienda); mientras no existan, se muestra un placeholder CSS con el logo y el monto sobre el gradiente del diseño.
4. Al pulsar **Comprar**:
   - sin sesión → `/#/registro` (flujo "registro + WhatsApp");
   - con sesión → se **inserta un pedido** (tipo `giftcard`, con `valor_giftcard_usd`, `precio_giftcard_eur` y `diseno_giftcard`) y se abre WhatsApp al 584246603660 con el pedido prellenado.
5. En el panel admin, la pestaña **Pedidos** muestra el monto y el diseño de cada gift card (con swatch del diseño elegido).

## 8.2 Pedidos de la tienda (v0.4.0)

- Todo botón "Contratar"/"Comprar" con sesión iniciada crea un **pedido** en la tabla `pedidos` (`tipo` = `plan` | `giftcard`) y abre WhatsApp con el resumen.
- Sin sesión, el botón lleva al **registro** (`/#/registro`); tras crear la cuenta el cliente vuelve a comprar y el pedido queda registrado con su nombre y teléfono.
- El admin gestiona los pedidos en `/#/pedidos`: estados `nuevo → contactado → completado | cancelado`, filtros por estado y WhatsApp directo al cliente cuando tiene teléfono.

## 9. Referidos y agencia (resumen)

1. Cada venta sobre una plataforma con `aplica_comision=true` y cliente con `referido_por` genera **comisión del 30%** automáticamente.
2. La comisión queda `pendiente` hasta que el admin la `liquida`.
3. El agente (rol 'agente') consulta **solo sus comisiones** en el panel.