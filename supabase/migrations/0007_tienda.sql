-- ============================================================
--  0007 — FASE 3 · TIENDA PÚBLICA + REGISTRO DE CLIENTES
--  Frontend público (#/tienda) con catálogo de venta y registro
--  de usuarios (nombre, correo y teléfono) vía Supabase Auth.
-- ============================================================

-- ------------------------------------------------------------
--  1) Precio de referencia (tachado) por plan — opcional.
--     Ej. Google One 1 mes: 2,99 $ (antes 5,99 $).
-- ------------------------------------------------------------
alter table public.planes
  add column if not exists precio_referencia_usd numeric(12,2);

-- Vista pública ampliada: expone además el precio de referencia
-- (mantiene security_invoker para que el RLS de las tablas base
--  se aplique al invocador).
create or replace view public.v_catalogo_publico
with (security_invoker = true)
as
select pl.nombre              as plataforma,
       pl.logo_url,
       p.duracion_dias,
       p.precio_venta_usd,
       p.precio_referencia_usd
  from public.planes p
  join public.plataformas pl on pl.id = p.plataforma_id
 where pl.activa;

-- ------------------------------------------------------------
--  2) REGISTRO — todo nuevo usuario de Supabase Auth recibe su
--     fila en `usuarios` (rol 'cliente') con los datos enviados
--     como metadatos del signUp (nombre y teléfono).
-- ------------------------------------------------------------
create or replace function public.auto_crear_usuario_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, rol, nombre, email, telefono)
  values (
    new.id,
    'cliente',
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'telefono', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_creado on auth.users;
create trigger trg_auth_user_creado
  after insert on auth.users
  for each row execute function public.auto_crear_usuario_cliente();

-- El cliente puede leer y editar su propia fila (sin poder
-- cambiar su rol: la fila solo puede seguir siendo 'cliente').
create policy "cliente_ve_su_fila"
  on public.usuarios
  for select
  to authenticated
  using (id = auth.uid());

create policy "cliente_edita_su_fila"
  on public.usuarios
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and rol = 'cliente');

-- ------------------------------------------------------------
--  3) CATÁLOGO DE VENTA
--     Google One (nueva plataforma) + escalones de 6 meses y
--     1 año para las plataformas existentes (1 mes ya existía).
-- ------------------------------------------------------------
insert into public.plataformas (nombre) values ('Google One')
on conflict (nombre) do nothing;

insert into public.planes (plataforma_id, duracion_dias, precio_venta_usd, precio_referencia_usd)
select pl.id, v.duracion, v.precio, v.precio_ref
  from public.plataformas pl
  join (values
    ('Google One',  30,   2.99,  5.99),
    ('Google One', 180,   8.99,  null),
    ('Google One', 365,  11.99,  null),
    ('Spotify',   180,  23.99,   null),
    ('Spotify',   365,  39.99,   null),
    ('Netflix',   180,  59.99,   null),
    ('Netflix',   365,  99.99,   null),
    ('Disney+',   180,  29.99,   null),
    ('Disney+',   365,  49.99,   null),
    ('Canva',     180,  39.99,   null),
    ('Canva',     365,  69.99,   null),
    ('ChatGPT',   180,  49.99,   null),
    ('ChatGPT',   365,  89.99,   null)
  ) as v(plataforma, duracion, precio, precio_ref)
    on v.plataforma = pl.nombre
on conflict (plataforma_id, duracion_dias) do nothing;