-- ============================================================
-- 0006_seguridad_renovaciones.sql — Auditoría pre-despliegue (Fase 2.2)
--  • Vistas con security_invoker: tapa la filtración de datos
--    internos (correos de cuentas madre, costos, cortes) a
--    usuarios anónimos vía REST, manteniendo el catálogo público.
--  • Validación: el plan y la cuenta madre deben ser de la MISMA
--    plataforma (evita asignaciones cruzadas tipo Spotify→Netflix).
--  • Renovación: asignar un pago a una suscripción extiende su
--    fecha_corte_cliente por la duración del plan y la reactiva,
--    para que el cron diario no la marque vencida tras un cobro.
-- ============================================================

-- ---------- 1) SECURITY_INVOKER en vistas ----------
-- Antes, las vistas usaban semántica definer (el dueño ignora el RLS),
-- así que CUALQUIER anónimo podía leer v_vencimientos_proveedores
-- con un simple GET. Con security_invoker, el RLS de las tablas base
-- se aplica al invocador:
--   • Admin autenticado → políticas admin_acceso_total → ve todo
--   • Anónimo → sin políticas sobre cuentas_madre/proveedores → nada
-- Nota: v_catalogo_publico sigue legible anónimamente porque sus
-- tablas base (plataformas, planes) SÍ tienen política de lectura pública.
alter view public.v_catalogo_publico set (security_invoker = true);
alter view public.v_vencimientos_proveedores set (security_invoker = true);

-- ---------- 2) El plan y la cuenta madre deben compartir plataforma ----------
create or replace function public.validar_plataforma_suscripcion()
returns trigger
language plpgsql
as $$
declare
    v_plan_plataforma    text;
    v_cuenta_plataforma  text;
begin
    select pl.nombre into v_plan_plataforma
      from public.planes p
      join public.plataformas pl on pl.id = p.plataforma_id
     where p.id = new.plan_id;

    select pl.nombre into v_cuenta_plataforma
      from public.cuentas_madre cm
      join public.plataformas pl on pl.id = cm.plataforma_id
     where cm.id = new.cuenta_madre_id;

    if v_plan_plataforma is null then
        raise exception 'El plan % no existe', new.plan_id;
    end if;
    if v_cuenta_plataforma is null then
        raise exception 'La cuenta madre % no existe', new.cuenta_madre_id;
    end if;
    if v_plan_plataforma <> v_cuenta_plataforma then
        raise exception 'El plan es de % pero la cuenta madre es de %: asignación inválida',
            v_plan_plataforma, v_cuenta_plataforma;
    end if;

    return new;
end $$;

drop trigger if exists trg_validar_plataforma_susc on public.suscripciones;
create trigger trg_validar_plataforma_susc
    before insert or update of plan_id, cuenta_madre_id on public.suscripciones
    for each row execute function public.validar_plataforma_suscripcion();

-- ---------- 3) Renovación por pago ----------
create or replace function public.renovar_suscripcion_por_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_dias integer;
begin
    select p.duracion_dias into v_dias
      from public.suscripciones s
      join public.planes p on p.id = s.plan_id
     where s.id = new.suscripcion_id;

    if v_dias is null then
        return new;
    end if;

    update public.suscripciones
       set fecha_corte_cliente = greatest(
               coalesce(fecha_corte_cliente, current_date), current_date
           ) + v_dias,
           estado = 'activa'
     where id = new.suscripcion_id;

    return new;
end $$;

drop trigger if exists trg_renovar_susc_por_pago on public.pago_suscripciones;
create trigger trg_renovar_susc_por_pago
    after insert on public.pago_suscripciones
    for each row execute function public.renovar_suscripcion_por_pago();

-- ---------- 4) Verificación ----------
select 'vistas con security_invoker' as item, count(*)::text as ok
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('v_catalogo_publico', 'v_vencimientos_proveedores')
   and array_to_string(c.reloptions, ',') like '%security_invoker=true%'
union all
select 'triggers nuevos', count(*)::text
  from pg_trigger
 where tgname in ('trg_validar_plataforma_susc', 'trg_renovar_susc_por_pago')
   and not tgisinternal;