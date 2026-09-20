-- ============================================================
--  Sistema Integral de Gestión de Suscripciones — ESQUEMA INICIAL
--  Proyecto: go-plans/suscripciones (Supabase xbmewcmpfnligeodggop)
--  Basado en: prd_sistema_de_suscripciones.md
--  Ejecutar en: Supabase Dashboard -> SQL Editor (o supabase db push)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
--  1. CATÁLOGO E INVENTARIO (PROVEEDORES)
-- ============================================================

create table public.plataformas (
    id           uuid primary key default gen_random_uuid(),
    nombre       text not null unique,
    logo_url     text,
    activa       boolean not null default true,
    created_at   timestamptz not null default now()
);

create table public.planes (
    id                uuid primary key default gen_random_uuid(),
    plataforma_id     uuid not null references public.plataformas(id) on delete cascade,
    duracion_dias     integer not null check (duracion_dias > 0),
    precio_venta_usd  numeric(12,2) not null check (precio_venta_usd >= 0),
    created_at        timestamptz not null default now(),
    unique (plataforma_id, duracion_dias)
);

create table public.proveedores (
    id                     uuid primary key default gen_random_uuid(),
    nombre                 text not null,
    contacto               text,
    metodo_pago_preferido  text,
    created_at             timestamptz not null default now()
);

create table public.cuentas_madre (
    id                     uuid primary key default gen_random_uuid(),
    proveedor_id           uuid not null references public.proveedores(id) on delete restrict,
    plataforma_id          uuid not null references public.plataformas(id) on delete restrict,
    correo_cuenta          text not null,
    cupos_totales          integer not null check (cupos_totales > 0),
    cupos_ocupados         integer not null default 0
        check (cupos_ocupados >= 0 and cupos_ocupados <= cupos_totales),
    costo_renovacion_usd   numeric(12,2) not null check (costo_renovacion_usd >= 0),
    fecha_corte_proveedor  date not null,
    estado                 text not null default 'activa'
        check (estado in ('activa','suspendida','baja')),
    created_at             timestamptz not null default now()
);

-- ============================================================
--  2. USUARIOS, SUSCRIPCIONES Y REFERIDOS
--  Convención: usuarios.id = auth.uid() cuando el usuario tiene
--  cuenta de autenticación en Supabase Auth.
-- ============================================================

create table public.usuarios (
    id            uuid primary key default gen_random_uuid(),
    rol           text not null default 'cliente'
        check (rol in ('admin','agente','cliente')),
    nombre        text not null,
    email         text unique,
    telefono      text,
    referido_por  uuid references public.usuarios(id) on delete set null,
    created_at    timestamptz not null default now()
);

create table public.suscripciones (
    id                     uuid primary key default gen_random_uuid(),
    cliente_id             uuid not null references public.usuarios(id) on delete cascade,
    plan_id                uuid not null references public.planes(id) on delete restrict,
    cuenta_madre_id        uuid not null references public.cuentas_madre(id) on delete restrict,
    fecha_inicio           date not null,
    fecha_corte_cliente    date not null,
    estado                 text not null default 'activa'
        check (estado in ('activa','vencida','cancelada')),
    created_at             timestamptz not null default now(),
    check (fecha_corte_cliente >= fecha_inicio)
);

-- ============================================================
--  3. FINANZAS Y CONTROL CAMBIARIO
-- ============================================================

create table public.tasas_cambio (
    id        uuid primary key default gen_random_uuid(),
    fecha     date not null unique,
    tasa_bcv  numeric(12,4) not null check (tasa_bcv > 0),
    created_at timestamptz not null default now()
);

create table public.pagos_ingresos (
    id                  uuid primary key default gen_random_uuid(),
    cliente_id          uuid not null references public.usuarios(id) on delete cascade,
    monto_pagado        numeric(12,2) not null check (monto_pagado >= 0),
    moneda              text not null check (moneda in ('USD','BS','USDT')),
    tasa_bcv_aplicada   numeric(12,4),
    equivalente_usd     numeric(12,2) not null check (equivalente_usd >= 0),
    metodo_pago         text check (metodo_pago in ('Zelle','Pago Movil','Pago Movil Binance','Efectivo','Transferencia','Otro')),
    fecha_pago          date not null default current_date,
    comprobante_url     text,
    created_at          timestamptz not null default now()
);

create table public.comisiones (
    id                    uuid primary key default gen_random_uuid(),
    agente_id             uuid not null references public.usuarios(id) on delete cascade,
    pago_id               uuid not null references public.pagos_ingresos(id) on delete cascade,
    monto_comision_usd    numeric(12,2) not null check (monto_comision_usd >= 0),
    estado                text not null default 'pendiente'
        check (estado in ('pendiente','liquidada')),
    created_at            timestamptz not null default now()
);

create table public.pago_suscripciones (
    id                   uuid primary key default gen_random_uuid(),
    pago_ingreso_id      uuid not null references public.pagos_ingresos(id) on delete cascade,
    suscripcion_id       uuid not null references public.suscripciones(id) on delete restrict,
    monto_asignado_usd   numeric(12,2) not null check (monto_asignado_usd >= 0),
    created_at           timestamptz not null default now(),
    unique (pago_ingreso_id, suscripcion_id)
);

create table public.pagos_egresos (
    id                  uuid primary key default gen_random_uuid(),
    proveedor_id        uuid not null references public.proveedores(id) on delete restrict,
    cuenta_madre_id     uuid not null references public.cuentas_madre(id) on delete restrict,
    monto_pagado_usd    numeric(12,2) not null check (monto_pagado_usd >= 0),
    fecha_pago          date not null default current_date,
    comprobante_url     text,
    created_at          timestamptz not null default now()
);

-- ============================================================
--  ÍNDICES (performance en FKs y búsquedas frecuentes)
-- ============================================================

create index idx_planes_plataforma    on public.planes(plataforma_id);
create index idx_cuentas_proveedor    on public.cuentas_madre(proveedor_id);
create index idx_cuentas_plataforma   on public.cuentas_madre(plataforma_id);
create index idx_susc_cliente         on public.suscripciones(cliente_id);
create index idx_susc_cuenta_madre    on public.suscripciones(cuenta_madre_id);
create index idx_susc_corte           on public.suscripciones(fecha_corte_cliente);
create index idx_comisiones_agente    on public.comisiones(agente_id);
create index idx_pagos_ing_cliente    on public.pagos_ingresos(cliente_id);
create index idx_pagos_egr_prov       on public.pagos_egresos(proveedor_id);
create index idx_ps_pago              on public.pago_suscripciones(pago_ingreso_id);
create index idx_ps_susc              on public.pago_suscripciones(suscripcion_id);

-- ============================================================
--  VISTA: catálogo público de venta (Fase 3)
-- ============================================================

create or replace view public.v_catalogo_publico as
select pl.nombre              as plataforma,
       pl.logo_url,
       p.duracion_dias,
       p.precio_venta_usd
  from public.planes p
  join public.plataformas pl on pl.id = p.plataforma_id
 where pl.activa;

-- ============================================================
--  TRIGGERS
-- ============================================================

-- 1) Comisión 30% automática para referidos
create or replace function public.registrar_comision_por_referido()
returns trigger
language plpgsql
as $$
declare
    v_cliente  uuid;
    v_referido uuid;
begin
    select cliente_id into v_cliente
      from public.suscripciones
     where id = new.suscripcion_id;

    if v_cliente is null then
        return new;
    end if;

    select referido_por into v_referido
      from public.usuarios
     where id = v_cliente;

    if v_referido is not null then
        insert into public.comisiones (agente_id, pago_id, monto_comision_usd, estado)
        values (v_referido, new.pago_ingreso_id,
                round(new.monto_asignado_usd * 0.30, 2), 'pendiente');
    end if;

    return new;
end $$;

create trigger trg_comision_referido
    after insert on public.pago_suscripciones
    for each row execute function public.registrar_comision_por_referido();

-- 2) Control de cupos de cuentas madre
create or replace function public.gestionar_cupos_cuenta_madre()
returns trigger
language plpgsql
as $$
declare
    v_cupos  integer;
    v_total  integer;
begin
    if tg_op = 'INSERT' then
        if new.estado = 'activa' then
            select cupos_ocupados, cupos_totales into v_cupos, v_total
              from public.cuentas_madre
             where id = new.cuenta_madre_id;
            if not found then
                raise exception 'Cuenta madre % no existe', new.cuenta_madre_id;
            end if;
            if v_cupos >= v_total then
                raise exception 'Cuenta madre sin cupos disponibles (limite %)', v_total;
            end if;
            update public.cuentas_madre
               set cupos_ocupados = cupos_ocupados + 1
             where id = new.cuenta_madre_id;
        end if;

    elsif tg_op = 'UPDATE' then
        if old.estado = 'activa' and new.estado <> 'activa' then
            update public.cuentas_madre
               set cupos_ocupados = greatest(cupos_ocupados - 1, 0)
             where id = old.cuenta_madre_id;
        elsif old.estado <> 'activa' and new.estado = 'activa' then
            select cupos_ocupados, cupos_totales into v_cupos, v_total
              from public.cuentas_madre
             where id = new.cuenta_madre_id;
            if v_cupos >= v_total then
                raise exception 'Cuenta madre sin cupos disponibles (limite %)', v_total;
            end if;
            update public.cuentas_madre
               set cupos_ocupados = cupos_ocupados + 1
             where id = new.cuenta_madre_id;
        end if;

    elsif tg_op = 'DELETE' then
        if old.estado = 'activa' then
            update public.cuentas_madre
               set cupos_ocupados = greatest(cupos_ocupados - 1, 0)
             where id = old.cuenta_madre_id;
        end if;
    end if;

    return coalesce(new, old);
end $$;

create trigger trg_cupos_after_insert
    after insert on public.suscripciones
    for each row execute function public.gestionar_cupos_cuenta_madre();

create trigger trg_cupos_after_update
    after update of estado on public.suscripciones
    for each row execute function public.gestionar_cupos_cuenta_madre();

create trigger trg_cupos_after_delete
    after delete on public.suscripciones
    for each row execute function public.gestionar_cupos_cuenta_madre();

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  Admin: acceso total. Agentes: solo sus comisiones.
--  Convención: para que un usr sea admin, su fila en `usuarios`
--  debe tener id = auth.uid() y rol = 'admin'.
-- ============================================================

create or replace function public.es_admin()
returns boolean
language sql stable
security definer
as $$
    select exists (
        select 1
          from public.usuarios u
         where u.id = auth.uid()
           and u.rol = 'admin'
    );
$$;

alter table public.plataformas          enable row level security;
alter table public.planes               enable row level security;
alter table public.proveedores          enable row level security;
alter table public.cuentas_madre        enable row level security;
alter table public.usuarios             enable row level security;
alter table public.suscripciones        enable row level security;
alter table public.comisiones           enable row level security;
alter table public.tasas_cambio         enable row level security;
alter table public.pagos_ingresos       enable row level security;
alter table public.pago_suscripciones   enable row level security;
alter table public.pagos_egresos        enable row level security;

-- Admin: acceso total a las 11 tablas de gestión
do $$
declare t text;
begin
    foreach t in array array[
        'plataformas','planes','proveedores','cuentas_madre','usuarios',
        'suscripciones','comisiones','tasas_cambio','pagos_ingresos',
        'pago_suscripciones','pagos_egresos'
    ]
    loop
        execute format(
            'create policy "admin_acceso_total" on public.%I for all
             using (public.es_admin()) with check (public.es_admin())', t);
    end loop;
end $$;

-- Agente: solo lectura de sus propias comisiones pendientes/liquidadas
create policy "agente_lee_su_comision" on public.comisiones
    for select using (agente_id = auth.uid());

-- Catálogo público de venta (consultas anónimas permitidas)
create policy "catalogo_publico_lectura" on public.plataformas
    for select using (true);

create policy "catalogo_publico_planes" on public.planes
    for select using (true);