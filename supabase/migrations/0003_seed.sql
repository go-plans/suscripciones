-- ============================================================
--  SEED — Datos de ejemplo
--  Opcional: ejecutar solo para probar el funcionamiento.
-- ============================================================

-- Plataformas base
insert into public.plataformas (nombre, logo_url) values
    ('Netflix',  null),
    ('Spotify',  null),
    ('Disney+',  null),
    ('Canva',    null),
    ('ChatGPT',  null)
on conflict (nombre) do nothing;

-- Planes de ejemplo (precios anclados en USD)
insert into public.planes (plataforma_id, duracion_dias, precio_venta_usd)
select pl.id, valores.duracion, valores.precio
  from public.plataformas pl
 cross join (values
    ('Netflix', 30,  12.00),
    ('Spotify', 30,   4.50),
    ('Disney+', 30,   6.00),
    ('Canva',   30,   8.00),
    ('ChatGPT', 30,  10.00)
 ) valores(plataforma, duracion, precio)
 where pl.nombre = valores.plataforma
on conflict (plataforma_id, duracion_dias) do nothing;

-- Tasa BCV de ejemplo (se reemplazará con la real)
insert into public.tasas_cambio (fecha, tasa_bcv)
values (current_date, 42.5000)
on conflict (fecha) do nothing;