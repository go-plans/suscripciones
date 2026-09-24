-- ============================================================
--  0012 — CARRITO Y CHECKOUT: cobro en el pedido + tasa del euro
--  · `pedidos` guarda el método de pago con que el cliente dijo
--    que pagará, la moneda cotizada y el monto exacto.
--  · `tasas_cambio` gana `tasa_eur_bs` para las gift cards de Apple
--    (Pago Móvil anclado al euro).
--  Ejecutar en: Supabase Dashboard -> SQL Editor (o supabase db push)
-- ============================================================

alter table public.pedidos
  add column if not exists metodo_pago  text,
  add column if not exists moneda_cobro text,
  add column if not exists monto_cobro  numeric(12,2);

comment on column public.pedidos.metodo_pago  is
  'Método con que el cliente pagará: pagomovil | usdt | usdc | zinli | binance';
comment on column public.pedidos.moneda_cobro is
  'Moneda cotizada del cobro: BS, USDT, USDC o USD (Zinli)';
comment on column public.pedidos.monto_cobro is
  'Monto exacto cotizado en el checkout (la tasa puede cambiar después)';

-- Tasa del euro (€ → Bs) para las Apple Gift Cards (Pago Móvil anclado al €).
alter table public.tasas_cambio
  add column if not exists tasa_eur_bs numeric(12,4);

-- ---------- Verificación ----------
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'pedidos'
   and column_name in ('metodo_pago','moneda_cobro','monto_cobro')
order by column_name;