-- ============================================================
-- 0005_sistema_gestion.sql — Gestión pulida (Fase 2.1)
--  • Cascadas FK para poder borrar clientes/suscripciones sin errores
--  • Plataformas: columna aplica_comision (comisiones solo en Google One o las que elijas)
--  • Cuentas madre: proveedor opcional (Directo) y corte/costo opcional (cuentas eternas tipo Canva docente)
--  • Pagos: tasa de cambio Binance (USDT)
--  • Datos demo de comisión movidos a Google One
-- ============================================================

-- ---------- 1) FK CASCADA para gestión ----------
ALTER TABLE public.pago_suscripciones DROP CONSTRAINT pago_suscripciones_suscripcion_id_fkey;
ALTER TABLE public.pago_suscripciones ADD CONSTRAINT pago_suscripciones_suscripcion_id_fkey
  FOREIGN KEY (suscripcion_id) REFERENCES public.suscripciones(id) ON DELETE CASCADE;

ALTER TABLE public.pago_suscripciones DROP CONSTRAINT pago_suscripciones_pago_ingreso_id_fkey;
ALTER TABLE public.pago_suscripciones ADD CONSTRAINT pago_suscripciones_pago_ingreso_id_fkey
  FOREIGN KEY (pago_ingreso_id) REFERENCES public.pagos_ingresos(id) ON DELETE CASCADE;

-- Borrar una cuenta madre limpia sus suscripciones e historial
ALTER TABLE public.suscripciones DROP CONSTRAINT suscripciones_cuenta_madre_id_fkey;
ALTER TABLE public.suscripciones ADD CONSTRAINT suscripciones_cuenta_madre_id_fkey
  FOREIGN KEY (cuenta_madre_id) REFERENCES public.cuentas_madre(id) ON DELETE CASCADE;

-- Borrar un proveedor: las cuentas pasan a 'Directo' y se borran sus egresos
ALTER TABLE public.cuentas_madre DROP CONSTRAINT cuentas_madre_proveedor_id_fkey;
ALTER TABLE public.cuentas_madre ADD CONSTRAINT cuentas_madre_proveedor_id_fkey
  FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE SET NULL;

ALTER TABLE public.pagos_egresos DROP CONSTRAINT pagos_egresos_proveedor_id_fkey;
ALTER TABLE public.pagos_egresos ADD CONSTRAINT pagos_egresos_proveedor_id_fkey
  FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;

ALTER TABLE public.pagos_egresos DROP CONSTRAINT pagos_egresos_cuenta_madre_id_fkey;
ALTER TABLE public.pagos_egresos ADD CONSTRAINT pagos_egresos_cuenta_madre_id_fkey
  FOREIGN KEY (cuenta_madre_id) REFERENCES public.cuentas_madre(id) ON DELETE CASCADE;

-- Borrar una plataforma limpia planes, cuentas y suscripciones asociadas
ALTER TABLE public.cuentas_madre DROP CONSTRAINT cuentas_madre_plataforma_id_fkey;
ALTER TABLE public.cuentas_madre ADD CONSTRAINT cuentas_madre_plataforma_id_fkey
  FOREIGN KEY (plataforma_id) REFERENCES public.plataformas(id) ON DELETE CASCADE;

-- ---------- 2) Plataformas: comisiones configurables ----------
ALTER TABLE public.plataformas
  ADD COLUMN aplica_comision boolean not null default true;

-- Regla inicial: comisiones SOLO en Google One (luego se elige por plataforma)
UPDATE public.plataformas SET aplica_comision = (nombre = 'Google One');

INSERT INTO public.plataformas (nombre, activa, aplica_comision)
VALUES ('Google One', true, true)
ON CONFLICT (nombre) DO UPDATE SET aplica_comision = true;

-- Plan Google One 100 GB (mensual)
INSERT INTO public.planes (plataforma_id, duracion_dias, precio_venta_usd)
SELECT id, 30, 2.00 FROM public.plataformas
WHERE nombre = 'Google One'
  AND NOT EXISTS (
    SELECT 1 FROM public.planes p2 WHERE p2.plataforma_id = id AND p2.duracion_dias = 30
  );

-- ---------- 3) Limpieza: quitar comisiones de plataformas sin comisión ----------
DELETE FROM public.comisiones c
USING public.pago_suscripciones ps
JOIN public.suscripciones s   ON s.id  = ps.suscripcion_id
JOIN public.planes p          ON p.id  = s.plan_id
JOIN public.plataformas pl    ON pl.id = p.plataforma_id
WHERE c.pago_id = ps.pago_ingreso_id
  AND pl.aplica_comision = false;

-- ---------- 4) Cuentas madre: proveedor y corte opcionales ----------
ALTER TABLE public.cuentas_madre ALTER COLUMN proveedor_id DROP NOT NULL;
ALTER TABLE public.cuentas_madre ALTER COLUMN fecha_corte_proveedor DROP NOT NULL;

-- ---------- 5) Pagos: tasa de cambio Binance (USDT) ----------
ALTER TABLE public.pagos_ingresos
  ADD COLUMN tasa_cambio_binance numeric(12,4);

-- ---------- 6) Trigger de comisión: solo si la plataforma lo habilita ----------
CREATE OR REPLACE FUNCTION public.registrar_comision_por_referido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_cliente  uuid;
    v_referido uuid;
    v_aplica   boolean;
BEGIN
    SELECT s.cliente_id, COALESCE(pl.aplica_comision, false)
      INTO v_cliente, v_aplica
      FROM public.suscripciones s
      JOIN public.planes p        ON p.id = s.plan_id
      JOIN public.plataformas pl  ON pl.id = p.plataforma_id
     WHERE s.id = new.suscripcion_id;

    IF v_cliente IS NULL OR NOT v_aplica THEN
        RETURN new;
    END IF;

    SELECT referido_por INTO v_referido
      FROM public.usuarios
     WHERE id = v_cliente;

    IF v_referido IS NOT NULL THEN
        INSERT INTO public.comisiones (agente_id, pago_id, monto_comision_usd, estado)
        VALUES (v_referido, new.pago_ingreso_id,
                round(new.monto_asignado_usd * 0.30, 2), 'pendiente');
    END IF;

    RETURN new;
END $$;

-- ---------- 7) Vista de vencimientos: proveedor opcional + cuentas sin corte ----------
CREATE OR REPLACE VIEW public.v_vencimientos_proveedores AS
SELECT cm.id,
       COALESCE(p.nombre, 'Directo') AS proveedor,
       pl.nombre                     AS plataforma,
       cm.correo_cuenta,
       cm.cupos_ocupados,
       cm.cupos_totales,
       cm.costo_renovacion_usd,
       cm.fecha_corte_proveedor,
       (cm.fecha_corte_proveedor - current_date) AS dias_restantes
  FROM public.cuentas_madre cm
  LEFT JOIN public.proveedores p ON p.id = cm.proveedor_id
  JOIN public.plataformas pl     ON pl.id = cm.plataforma_id
 WHERE cm.estado = 'activa'
   AND cm.fecha_corte_proveedor IS NOT NULL
   AND cm.fecha_corte_proveedor <= current_date + 3;

-- ---------- 8) Demo de comisión en Google One (referido Ana) ----------
INSERT INTO public.cuentas_madre (id, proveedor_id, plataforma_id, correo_cuenta, cupos_totales, costo_renovacion_usd, fecha_corte_proveedor)
SELECT '00000000-0000-0000-0000-000000000022', NULL, id, 'googleone01@directo.com', 4, 8.00, current_date + 15
FROM public.plataformas WHERE nombre = 'Google One'
AND NOT EXISTS (SELECT 1 FROM public.cuentas_madre WHERE correo_cuenta = 'googleone01@directo.com');

INSERT INTO public.suscripciones (id, cliente_id, plan_id, cuenta_madre_id, fecha_inicio, fecha_corte_cliente, estado)
SELECT '00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000002',
       p.id, cm.id, current_date - 20, current_date + 10, 'activa'
  FROM public.planes p
  JOIN public.plataformas pl ON pl.id = p.plataforma_id
  JOIN public.cuentas_madre cm ON cm.plataforma_id = pl.id AND cm.correo_cuenta = 'googleone01@directo.com'
 WHERE pl.nombre = 'Google One' LIMIT 1;

INSERT INTO public.pagos_ingresos (id, cliente_id, monto_pagado, moneda, tasa_bcv_aplicada, tasa_cambio_binance, equivalente_usd, metodo_pago, fecha_pago)
VALUES ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000002',
        2.00, 'USDT', NULL, 43.2000, 2.00, 'Pago Movil Binance', current_date);

INSERT INTO public.pago_suscripciones (pago_ingreso_id, suscripcion_id, monto_asignado_usd)
VALUES ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000035', 2.00);

-- ---------- 9) Verificación ----------
SELECT 'comisiones pendientes (debe ser 1, en Google One)' AS item, count(*) FROM comisiones WHERE estado='pendiente'
UNION ALL SELECT 'plataformas c/ comisión', count(*) FROM plataformas WHERE aplica_comision
UNION ALL SELECT 'cuentas directo (sin proveedor)', count(*) FROM cuentas_madre WHERE proveedor_id IS NULL
UNION ALL SELECT 'cuentas sin corte (eternas)', count(*) FROM cuentas_madre WHERE fecha_corte_proveedor IS NULL;