-- ============================================================
--  0011 — PEDIDOS DE LA TIENDA + AJUSTES DEL CATÁLOGO
--  · Elimina del catálogo los planes largos (>= 540 días / 18 meses)
--    que solo se vendieron de forma puntual (p. ej. Google One 546 días).
--  · Canva Pro pasa a venderse desde 1.99 $/mes.
--  · Nueva tabla `pedidos`: pedidos de la tienda (gift cards y planes)
--    que se muestran en el panel admin (monto y diseño en las gift cards).
--  Ejecutar en: Supabase Dashboard -> SQL Editor (o supabase db push)
-- ============================================================

-- ---------- 1) Catálogo ----------
-- 18 meses puntuales fuera del catálogo.
delete from public.planes
 where duracion_dias >= 540;

-- Canva Pro: el mes pasa a 1.99 $ (antes 8.00 $).
update public.planes p
   set precio_venta_usd = 1.99
 where p.duracion_dias = 30
   and exists (
     select 1 from public.plataformas pl
      where pl.id = p.plataforma_id
        and pl.nombre ilike 'Canva%'
   );

-- ---------- 2) Pedidos ----------
create table public.pedidos (
    id                   uuid primary key default gen_random_uuid(),
    tipo                 text not null check (tipo in ('plan','giftcard')),
    plataforma           text not null,
    -- Detalle de plan
    duracion_dias        integer,
    precio_usd           numeric(12,2),
    -- Detalle de gift card
    valor_giftcard_usd   numeric(12,2),
    precio_giftcard_eur  numeric(12,2),
    diseno_giftcard      text,
    -- Cliente que lo solicitó
    cliente_id           uuid references public.usuarios(id) on delete set null,
    cliente_nombre       text,
    cliente_contacto     text,
    -- Seguimiento
    estado               text not null default 'nuevo'
        check (estado in ('nuevo','contactado','completado','cancelado')),
    created_at           timestamptz not null default now()
);

create index idx_pedidos_created on public.pedidos(created_at desc);
create index idx_pedidos_cliente on public.pedidos(cliente_id);
create index idx_pedidos_estado  on public.pedidos(estado);

alter table public.pedidos enable row level security;

-- Admin: acceso total a los pedidos.
create policy "admin_pedidos_total" on public.pedidos
  for all using (public.es_admin()) with check (public.es_admin());

-- Cliente registrado: crea sus propios pedidos y consulta los suyos.
create policy "cliente_crea_su_pedido" on public.pedidos
  for insert to authenticated
  with check (cliente_id = auth.uid());

create policy "cliente_ve_sus_pedidos" on public.pedidos
  for select to authenticated
  using (cliente_id = auth.uid());

-- ---------- 3) Verificación ----------
select 'planes_540_quedan'::text as item,
       count(*)::text as ok
  from public.planes
 where duracion_dias >= 540
union all
select 'canva_mes_precio',
       precio_venta_usd::text
  from public.planes p
  join public.plataformas pl on pl.id = p.plataforma_id
 where pl.nombre ilike 'Canva%'
   and p.duracion_dias = 30
union all
select 'pedidos_tabla',
       case when exists (
         select 1 from pg_tables where schemaname = 'public' and tablename = 'pedidos'
       ) then 'creada' else 'falta' end;