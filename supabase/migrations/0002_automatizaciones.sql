-- ============================================================
--  AUTOMATIZACIONES (pg_cron + pg_net)
--  Requisitos en Supabase Dashboard -> Database -> Extensions:
--    enable pg_cron  (www/async)
--    enable pg_net   (www/async)
-- ============================================================

-- ------------------------------------------------------------
-- 1) Estados automáticos: marcar suscripciones vencidas
--    Corre todos los días a las 00:00
-- ------------------------------------------------------------
select cron.schedule(
    'vencimientos-diarios',
    '0 0 * * *',
    $$ update public.suscripciones
          set estado = 'vencida'
        where estado = 'activa'
          and fecha_corte_cliente < current_date $$
);

-- ------------------------------------------------------------
-- 2) Alerta de proveedores en dashboard:
--    vista de conveniencia con los cortes próximos (3 días)
-- ------------------------------------------------------------
create or replace view public.v_vencimientos_proveedores as
select cm.id,
       p.nombre        as proveedor,
       pl.nombre       as plataforma,
       cm.correo_cuenta,
       cm.cupos_ocupados,
       cm.cupos_totales,
       cm.costo_renovacion_usd,
       cm.fecha_corte_proveedor,
       (cm.fecha_corte_proveedor - current_date) as dias_restantes
  from public.cuentas_madre cm
  join public.proveedores p  on p.id  = cm.proveedor_id
  join public.plataformas pl on pl.id = cm.plataforma_id
 where cm.estado = 'activa'
   and cm.fecha_corte_proveedor <= current_date + 3;

-- ------------------------------------------------------------
-- 3) Tasa BCV diaria vía Edge Function (fetch-bcv).
--    Requiere pg_net y la URL de la función + anon key (desde .env):
--      SUPABASE_URL=https://xbmewcmpfnligeodggop.supabase.co
--      SUPABASE_ANON_KEY=sb_publishable_...
--
--    Ejecutar una vez (después de desplegar la función fetch-bcv):
--    select cron.schedule(
--      'tasas-bcv-diaria',
--      '0 7 * * *',
--      $$ select net.http_post(
--             url    := 'https://xbmewcmpfnligeodggop.supabase.co/functions/v1/fetch-bcv',
--             headers := jsonb_build_object(
--                          'Content-Type','application/json',
--                          'Authorization', 'Bearer ' || 'TU_ANON_KEY_SERVICE_ROLE'),
--             body   := '{}'
--         ) $$
--    );
-- ------------------------------------------------------------