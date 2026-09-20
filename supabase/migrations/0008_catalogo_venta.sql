-- ============================================================
--  0008 — FASE 3 · CATÁLOGO DE VENTA (datos reales del negocio)
--  Agrega los escalones de 6 meses y 1 año a las plataformas
--  creadas en el panel y consolida el duplicado "Google One 5 TB".
--  Todos los precios son editables desde Panel → Plataformas.
-- ============================================================

-- Spotify Premium: 1 mes ya existía (3,49 $); se agregan 6 meses
-- y 1 año anclados a ese precio (ahorro ≈19% y ≈31%, como el diseño).
insert into public.planes (plataforma_id, duracion_dias, precio_venta_usd, precio_referencia_usd)
select pl.id, v.duracion, v.precio, null
  from public.plataformas pl
  join (values
    ('Spotify Premium', 180,  16.99),
    ('Spotify Premium', 365,  28.99)
  ) as v(nombre, duracion, precio) on v.nombre = pl.nombre
on conflict (plataforma_id, duracion_dias) do nothing;

-- Canva Pro: escalones 1 mes / 6 meses / 1 año.
insert into public.planes (plataforma_id, duracion_dias, precio_venta_usd, precio_referencia_usd)
select pl.id, v.duracion, v.precio, null
  from public.plataformas pl
  join (values
    ('Canva Pro',  30,   8.00),
    ('Canva Pro', 180,  39.99),
    ('Canva Pro', 365,  69.99)
  ) as v(nombre, duracion, precio) on v.nombre = pl.nombre
on conflict (plataforma_id, duracion_dias) do nothing;

-- "Google One 5 TB" quedó duplicado de "Google One" (ambos vendían
-- el año a 11,99 $). Se desactiva de la tienda; los datos se
-- conservan y el admin puede borrarlo desde el panel si quiere.
update public.plataformas
   set activa = false
 where nombre = 'Google One 5 TB'
   and activa = true;