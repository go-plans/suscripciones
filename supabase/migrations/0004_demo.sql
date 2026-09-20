-- ============================================================
-- 0004_demo.sql — Datos de demostración para el panel (Fase 2)
-- idempotente: borra y recarga los IDs demo '00000000-...'
-- ============================================================

-- ---------- Limpieza (idempotencia, respetando dependencias) ----------
DELETE FROM pago_suscripciones
WHERE pago_ingreso_id IN ('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000041');

DELETE FROM comisiones
WHERE pago_id IN ('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000041');

DELETE FROM pagos_ingresos
WHERE id IN ('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000041');

DELETE FROM suscripciones
WHERE id BETWEEN '00000000-0000-0000-0000-000000000030' AND '00000000-0000-0000-0000-000000000034';

DELETE FROM cuentas_madre
WHERE id IN ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000021');

DELETE FROM proveedores WHERE id = '00000000-0000-0000-0000-000000000010';

DELETE FROM usuarios
WHERE id BETWEEN '00000000-0000-0000-0000-000000000001' AND '00000000-0000-0000-0000-000000000005';

-- ---------- Agente y clientes ----------
INSERT INTO usuarios (id, rol, nombre, email, telefono, referido_por) VALUES
('00000000-0000-0000-0000-000000000001','agente','Ana Agente','ana@ejemplo.com','+58 412 100 0001',NULL),
('00000000-0000-0000-0000-000000000002','cliente','Carlos Cliente','carlos@ejemplo.com','+58 414 200 0002','00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000003','cliente','María López','maria@ejemplo.com','+58 416 300 0003',NULL),
('00000000-0000-0000-0000-000000000004','cliente','Pedro Gómez','pedro@ejemplo.com',NULL,'00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000005','cliente','Luisa Fernández','luisa@ejemplo.com',NULL,NULL);

-- ---------- Proveedor ----------
INSERT INTO proveedores (id, nombre, contacto, metodo_pago_preferido) VALUES
('00000000-0000-0000-0000-000000000010','Almacén VIP','@almacenvip (Telegram)','Zelle');

-- ---------- Cuentas madre (fecha corte: 2 y 10 días) ----------
INSERT INTO cuentas_madre (id, proveedor_id, plataforma_id, correo_cuenta, cupos_totales, costo_renovacion_usd, fecha_corte_proveedor)
SELECT '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', p.id, 'netflix01@pventa.com', 4, 30.00, CURRENT_DATE + 2
FROM plataformas p WHERE p.nombre = 'Netflix';

INSERT INTO cuentas_madre (id, proveedor_id, plataforma_id, correo_cuenta, cupos_totales, costo_renovacion_usd, fecha_corte_proveedor)
SELECT '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', p.id, 'disney01@pventa.com', 4, 25.00, CURRENT_DATE + 10
FROM plataformas p WHERE p.nombre = 'Disney+';

-- ---------- Suscripciones (el trigger gestiona cupos ocupados) ----------
-- Carlos → Netflix (activa)
INSERT INTO suscripciones (id, cliente_id, plan_id, cuenta_madre_id, fecha_inicio, fecha_corte_cliente, estado)
SELECT '00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000002', pl.id, '00000000-0000-0000-0000-000000000020', CURRENT_DATE - 25, CURRENT_DATE + 5, 'activa'
FROM planes pl JOIN plataformas pf ON pf.id = pl.plataforma_id
WHERE pf.nombre = 'Netflix' LIMIT 1;

-- María → Netflix (activa, corte en 2 días)
INSERT INTO suscripciones (id, cliente_id, plan_id, cuenta_madre_id, fecha_inicio, fecha_corte_cliente, estado)
SELECT '00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000003', pl.id, '00000000-0000-0000-0000-000000000020', CURRENT_DATE - 28, CURRENT_DATE + 2, 'activa'
FROM planes pl JOIN plataformas pf ON pf.id = pl.plataforma_id
WHERE pf.nombre = 'Netflix' LIMIT 1;

-- Luisa → Netflix (activa, corte en 20 días)
INSERT INTO suscripciones (id, cliente_id, plan_id, cuenta_madre_id, fecha_inicio, fecha_corte_cliente, estado)
SELECT '00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000005', pl.id, '00000000-0000-0000-0000-000000000020', CURRENT_DATE - 10, CURRENT_DATE + 20, 'activa'
FROM planes pl JOIN plataformas pf ON pf.id = pl.plataforma_id
WHERE pf.nombre = 'Netflix' LIMIT 1;

-- Carlos → Disney+ (VENCIDA, corte hace 2 días → KPI vencidas > 0)
INSERT INTO suscripciones (id, cliente_id, plan_id, cuenta_madre_id, fecha_inicio, fecha_corte_cliente, estado)
SELECT '00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000002', pl.id, '00000000-0000-0000-0000-000000000021', CURRENT_DATE - 30, CURRENT_DATE - 2, 'vencida'
FROM planes pl JOIN plataformas pf ON pf.id = pl.plataforma_id
WHERE pf.nombre = 'Disney+' LIMIT 1;

-- Pedro → Disney+ (activa, corte en 15 días)
INSERT INTO suscripciones (id, cliente_id, plan_id, cuenta_madre_id, fecha_inicio, fecha_corte_cliente, estado)
SELECT '00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000004', pl.id, '00000000-0000-0000-0000-000000000021', CURRENT_DATE - 15, CURRENT_DATE + 15, 'activa'
FROM planes pl JOIN plataformas pf ON pf.id = pl.plataforma_id
WHERE pf.nombre = 'Disney+' LIMIT 1;

-- ---------- Pagos + distribución (dispara comisión 30% del referido) ----------
-- Pago 1: María paga en BS (510 BS ÷ 42.5 = 12.00 USD) — sin referido, sin comisión
INSERT INTO pagos_ingresos (id, cliente_id, monto_pagado, moneda, tasa_bcv_aplicada, equivalente_usd, metodo_pago, fecha_pago) VALUES
('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000003', 510.00, 'BS', 42.5000, 12.00, 'Pago Movil', CURRENT_DATE);

INSERT INTO pago_suscripciones (pago_ingreso_id, suscripcion_id, monto_asignado_usd) VALUES
('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000031', 12.00);

-- Pago 2: Carlos paga 12.00 USDT → comisión 30% = 3.60 pendiente para Ana
INSERT INTO pagos_ingresos (id, cliente_id, monto_pagado, moneda, tasa_bcv_aplicada, equivalente_usd, metodo_pago, fecha_pago) VALUES
('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000002', 12.00, 'USDT', NULL, 12.00, 'Otro', CURRENT_DATE);

INSERT INTO pago_suscripciones (pago_ingreso_id, suscripcion_id, monto_asignado_usd) VALUES
('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000030', 12.00);

-- ---------- Verificación ----------
SELECT 'clientes' AS item, count(*) AS total FROM usuarios WHERE rol = 'cliente'
UNION ALL SELECT 'suscripciones activas', count(*) FROM suscripciones WHERE estado = 'activa'
UNION ALL SELECT 'suscripciones vencidas', count(*) FROM suscripciones WHERE estado = 'vencida'
UNION ALL SELECT 'comisiones pendientes', count(*) FROM comisiones WHERE estado = 'pendiente'
UNION ALL SELECT 'ingresos USD del mes', COALESCE(round(sum(equivalente_usd),2),0) FROM pagos_ingresos
WHERE fecha_pago >= date_trunc('month', CURRENT_DATE);