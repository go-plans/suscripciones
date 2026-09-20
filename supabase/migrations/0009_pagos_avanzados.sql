-- ============================================================
-- 0009_pagos_avanzados.sql
-- Pagos: métodos nuevos, renovación por fecha del pago y edición atómica.
-- - Método 'Binance' nuevo; 'Efectivo' fuera (el negocio no lo usa).
-- - La renovación de la suscripción se calcula desde la FECHA DEL PAGO
--   (permite registrar cobros de antes de la web).
-- - Función editar_pago (RPC, solo admin): reemplaza el pago + asignación
--   y recalcula la comisión del agente en un solo paso.
-- ============================================================

-- ---------- 1) Métodos de pago ----------
-- Conserva hipotéticas filas históricas 'Efectivo' como 'Otro' para no
-- bloquear el alter (normalmente no existen, el negocio no usa efectivo).
do $$
begin
  update public.pagos_ingresos
     set metodo_pago = 'Otro'
   where metodo_pago = 'Efectivo';

  alter table public.pagos_ingresos
    drop constraint if exists pagos_ingresos_metodo_pago_check;

  alter table public.pagos_ingresos
    add constraint pagos_ingresos_metodo_pago_check
    check (metodo_pago in (
      'Zelle','Pago Movil','Pago Movil Binance',
      'Binance','Transferencia','Otro'
    ));
end $$;

-- ---------- 2) Renovación por fecha del pago ----------
create or replace function public.renovar_suscripcion_por_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_dias   integer;
    v_ppago  date;
begin
    select p.duracion_dias into v_dias
      from public.suscripciones s
      join public.planes p on p.id = s.plan_id
     where s.id = new.suscripcion_id;

    if v_dias is null then
        return new;
    end if;

    -- Fecha de referencia: la fecha del pago (soporta cobros atrasados).
    select pis.fecha_pago into v_ppago
      from public.pagos_ingresos pis
     where pis.id = new.pago_ingreso_id;

    if v_ppago is null then
        v_ppago := current_date;
    end if;

    update public.suscripciones
       set fecha_corte_cliente = greatest(
               coalesce(fecha_corte_cliente, v_ppago), v_ppago
           ) + v_dias,
           estado = 'activa'
     where id = new.suscripcion_id;

    return new;
end $$;

drop trigger if exists trg_renovar_susc_por_pago on public.pago_suscripciones;
create trigger trg_renovar_susc_por_pago
    after insert on public.pago_suscripciones
    for each row execute function public.renovar_suscripcion_por_pago();

-- ---------- 3) Edición atómica de un pago (RPC, solo admin) ----------
-- Reemplaza los datos del pago y su distribución, y deja que el trigger de
-- comisión recalcule la comisión del agente (si aplica).
create or replace function public.editar_pago(
    p_pago_id             uuid,
    p_cliente_id          uuid,
    p_monto_pagado        numeric,
    p_moneda              text,
    p_tasa_bcv_aplicada   numeric,
    p_tasa_cambio_binance numeric,
    p_equivalente_usd     numeric,
    p_metodo_pago         text,
    p_fecha_pago          date,
    p_asignados           jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
begin
    if not public.es_admin() then
        raise exception 'Solo el admin puede editar pagos';
    end if;

    -- 1) Actualizar el ingreso (las validaciones de moneda/método aplican).
    update public.pagos_ingresos
       set cliente_id          = p_cliente_id,
           monto_pagado        = p_monto_pagado,
           moneda              = p_moneda,
           tasa_bcv_aplicada   = p_tasa_bcv_aplicada,
           tasa_cambio_binance = p_tasa_cambio_binance,
           equivalente_usd     = p_equivalente_usd,
           metodo_pago         = p_metodo_pago,
           fecha_pago          = p_fecha_pago
     where id = p_pago_id;

    -- 2) Recomponer la asignación y la comisión (el trigger de comisión
    --    solo dispara en INSERT, así que se borra todo y se reinserta).
    delete from public.pago_suscripciones where pago_ingreso_id = p_pago_id;
    delete from public.comisiones          where pago_id          = p_pago_id;

    for v_item in select * from jsonb_array_elements(p_asignados)
    loop
        insert into public.pago_suscripciones
            (pago_ingreso_id, suscripcion_id, monto_asignado_usd)
        values (
            p_pago_id,
            (v_item->>'suscripcion_id')::uuid,
            (v_item->>'monto_usd')::numeric
        );
    end loop;
end $$;

-- ---------- 4) Verificación ----------
select 'metodo_pago_check'::text as item,
       pg_get_constraintdef(oid)::text as ok
  from pg_constraint
 where conrelid = 'pagos_ingresos'::regclass
   and conname = 'pagos_ingresos_metodo_pago_check'
union all
select 'renovar_suscripcion_por_pago'::text,
       case when pg_get_functiondef(oid)::text like '%fecha_pago%'
            then 'usa fecha del pago' else 'usa current_date' end
  from pg_proc
 where proname = 'renovar_suscripcion_por_pago'
union all
select 'editar_pago'::text, 'creada'
  from pg_proc
 where proname = 'editar_pago';