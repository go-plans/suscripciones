# 08 — Changelog

> Historial de cambios del proyecto. Se actualiza **en el mismo commit** que los cambios de código. Formato de líneas: `- [tipo] descripción` (tipo: feat / fix / docs / chore / security / refactor).

## 2026-09-19 — Lanzamiento inicial

### v0.1.0

- **feat** Inicialización del proyecto Vite + React + TypeScript en `app/` (`npm create vite@latest`).
- **chore** Instalación de dependencias (0 vulnerabilidades).
- **chore** Repositorio GitHub privado `go-plans/suscripciones` creado; commit inicial en `main`.
- **chore** Dependencia dev `pg` para scripts de migración por pooler.
- **docs** Estructura de documentación `docs/` creada (estándar docs-as-code) + README raíz.

### Decisiones de seguridad y entorno

- **security** `API KEYS.txt` y `.env` creados fuera del repo con ACL restringido (solo el usuario propietario).
- **security** `.gitignore` endurecido en raíz de repo: `.env`, `.env.*`, `API KEYS.txt`.
- **docs** Documentación de gestión y rotación de claves (`docs/05-seguridad.md`).

### Base de datos (Supabase)

- **feat** Migración `0001_initial_schema.sql`: 11 tablas + 2 vistas + índices + triggers (`trg_comision_referido`, `trg_cupos_*`) + RLS (admin/agente/catálogo anónimo) + función `es_admin`.
- **feat** Migración `0002_automatizaciones.sql`: job cron `vencimientos-diarios` (00:00) + vista `v_vencimientos_proveedores` + template de cron `tasas-bcv-diaria`.
- **feat** Migración `0003_seed.sql`: plataformas ejemplo (Netflix, Spotify, Disney+, Canva, ChatGPT), planes mensuales y tasa BCV del día.
- **feat** Edge Function `fetch-bcv` (Deno) para obtener la tasa BCV desde dolarapi.com y almacenarla en `tasas_cambio`.
- **fix** Corrección de orden de creación de tablas (FK `comisiones → pagos_ingresos`).
- **fix** Uso de `cron.schedule` (el schema correcto es `cron`, no `extensions.cron`).
- **fix** Splitter de ejecución de migraciones: gestión correcta de bloques `$$…$$` (evita `end $$$`).

### Aplicación de migraciones

- **feat** Conexión a Supabase vía **pooler de sesión** (`aws-0-us-west-2.pooler.supabase.com:5432`, usuario `postgres.<ref>`) — la conexión directa es IPv6-only y la red no tiene IPv6.
- **feat** Verificación funcional de la base (transaccional, sin datos persistentes): cupos, comisión 30% y rechazo de sobrecupo, todos ✅.
- **chore** `migracion_completa.sql` (consolidado de 0001+0002+0003 para pegar en SQL Editor) en la raíz `Suscripciones/` (fuera del repo).

## 2026-09-19 — Fase 2 · Panel administrativo

### v0.2.0

- **feat** Panel admin completo en `app/`: Tailwind CSS v4 + `@tailwindcss/vite`, `react-router-dom` v7, `@supabase/supabase-js`.
- **feat** Dashboard con KPIs (clientes, suscripciones activas/vencidas, comisiones pendientes, ingresos del mes) y alertas de `v_vencimientos_proveedores` (≤3 días).
- **feat** CRUD de clientes con campo "referido por (agente)" (trazabilidad de comisiones).
- **feat** CRUD de proveedores y cuentas madre (inventario, suspender/activar, cupos).
- **feat** CRUD de suscripciones (valida cupos disponibles; el trigger `gestionar_cupos_cuenta_madre` rechaza sobrecupo).
- **feat** Página Pagos con **calculadora BCV**: monto, moneda (USD/BS/USDT), tasa del día autocargada, equivalente USD automático, distribución por suscripción activa y "repartir automáticamente"; registro dispara comisión 30% automática.
- **feat** Página Comisiones: listado agente/monto/estado + botón Liquidar.
- **feat** Migración `0004_demo.sql` (idempotente): agente, 4 clientes, proveedor, 2 cuentas madre, 5 suscripciones, 2 pagos → comisión demo de $3.60 pendiente.
- **fix** `metodo_pago` en Pagos ahora es un `<select>` con los valores del CHECK de la DB (`Zelle, Pago Movil, Pago Movil Binance, Efectivo, Transferencia, Otro`).
- **security** Documentado el uso temporal de `service_role` en el bundle (solo localhost); pendiente migrar a Auth + RLS.
- **chore** `.env` movido a `app/.env` (Vite solo lee `.env` desde la carpeta del proyecto).
- **docs** `06-desarrollo.md` actualizado (deps, estructura `src/`, nota de seguridad, troubleshooting de npm en Windows).

## 2026-09-19 — Fase 2.1 · Gestión pulida

### v0.2.1

- **fix** Eliminar clientes, suscripciones, pagos y cuentas madre ya **no falla por FK**: migración `0005_sistema_gestion.sql` convierte las restricciones a `ON DELETE CASCADE` (clientes → suscripciones/pagos → asignaciones → comisiones; proveedores → SET NULL + cuentas como "Directo"). Verificado end-to-end en el panel (crear + borrar cliente).
- **feat** Registro **inline** desde cualquier formulario: cliente/plan/cuenta madre dentro del modal de Suscripciones, cliente en Pagos, y proveedor/plataforma en Cuentas madre (`src/components/inline.tsx`).
- **feat** Nueva página **Plataformas** (CRUD) en `/plataformas`: activa/inactiva + toggle "genera comisión 30%".
- **feat** Comisiones **configurables por plataforma** (`plataformas.aplica_comision`): el trigger solo genera el 30% en las plataformas marcadas (por defecto solo Google One).
- **feat** Cuentas madre: **proveedor opcional** ("Directo") y **fecha de corte opcional** (cuentas eternas tipo Canva docente) → la fila muestra "Sin cortes" y desaparecen de los vencimientos.
- **feat** Pagos: campo **tasa de Binance (USDT)** persistido en `pagos_ingresos.tasa_cambio_binance` (la de BCV es distinta), **botón "Reflejar tasa"** que trae la oficial del día desde dolarapi.com (fallback: última del sistema), y **protección contra doble clic** al registrar.
- **feat** Suscripciones: campos **fecha de inicio + estado** para poder cargar suscripciones vendidas/contratadas antes del sistema.
- **feat** Formatos es-VE en toda la app: punto para miles y coma para decimales; **"VES"** (ya no "Bs.S"), "USD" y "USDT".
- **feat** Iconos **vectoriales** (SVG tipo Lucide) reemplazan todos los emojis (`src/components/icons.tsx`).
- **feat** Rendimiento: **carga perezosa** por página (`React.lazy` + Suspense, split de chunks en el build) + **caché en memoria de 20 s** en `src/lib/api.ts` (invalidación automática en cada escritura).
- **feat** Tablas más organizadas: cabecera fija, scroll interno, filas alternadas/hover, buscadores en Clientes, Suscripciones y Cuentas madre; filtro por estado en Comisiones.
- **chore** `crearCliente`, `crearPlan`, `crearCuentaMadre`, `crearProveedor`, `crearPlataforma` devuelven el `id` para seleccionarlo al vuelo tras crearlo.

## 2026-09-19 — Fase 2.2 · Auditoría + despliegue seguro (GitHub Pages)

### v0.2.2

- **security** La `service_role` **ya no se incrusta en el bundle** del navegador. El panel ahora usa solo la **anon key** y todo el acceso pasa por **Supabase Auth + RLS** (`es_admin()` por `auth.uid()`): login en `/#/login` (`src/lib/auth.tsx`, `src/pages/Login.tsx`), sesión persistida, y guard de rutas en `App.tsx`. Usuario admin de ejemplo creado por script (`admin@go-plans.app`, credenciales en `API KEYS.txt`, fuera del repo).
- **security** Fuga anónima cerrada: las vistas `v_vencimientos_proveedores` y `v_catalogo_publico` ahora son `security_invoker`, así el RLS de las tablas base se aplica al invocador. Verificado: un anónimo lee 0 filas de vencimientos/cuentas madre (antes las leía todas) y el catálogo público sigue funcionando.
- **fix** Asignación cruzada plan↔cuenta madre: antes se podía poner un plan de una plataforma en una cuenta de otra (p. ej. Spotify → Netflix). Ahora el formulario de Suscripciones **solo ofrece cuentas de la misma plataforma** del plan y la BD **rechaza** cualquier cruce (`trg_validar_plataforma_susc`).
- **fix** **Renovación por pago**: registrar un pago ahora extiende `fecha_corte_cliente` de cada suscripción por la duración del plan y la deja en `activa` (`trg_renovar_susc_por_pago`), evitando que el cron matutino marque como vencida una suscripción ya cobrada.
- **fix** Fechas en **zona horaria local**: `hoy()` ya no usa UTC (`toISOString`), así en Venezuela (UTC‑4) un pago después de las 20:00 se registra el día correcto; aplica también a "ingresos del mes" del dashboard.
- **chore** `vite.config.ts` con `base: './'` + `HashRouter`: el build funciona servido desde cualquier subruta (GitHub Pages `/suscripciones/`) sin configuración de servidor.
- **infra** Despliegue inicial a **GitHub Pages** desde la rama `gh-pages` (build local con anon key, sin secretos).

## 2026-09-20 — Fase 2.3 · Pulido, estandarización y publicación

### v0.2.3

- **infra** Repo **publicado en GitHub** (go-plans/suscripciones, visibilidad pública) y
  **GitHub Pages activado** vía API (`gh-pages` + path `/`). El sitio responde HTTP 200 en
  `https://go-plans.github.io/suscripciones/`.
- **refactor** Primitivas de UI compartidas en `ui.tsx`: `PageHeader` (encabezado estándar),
  `Buscador` (input + lupa), `EmptyState` y `ModalFooter` (Cancelar + Guardar con estado
  `guardando`). Todas las páginas e inline components las usan.
- **refactor** Patrón de carga unificado en las 8 páginas: estado `cargando` inicial → `Loading`;
  error → `ErrorMsg`; **lista vacía → `EmptyState`** (antes una lista sin datos mostraba
  «Cargando…» indefinidamente).
- **refactor** `src/lib/err.ts` con `errMsg(e)`; todos los `catch` de páginas, `api.ts` y
  `inline.tsx` lo usan (retirados los `(e as Error).message` a mano y el helper local `msg`).
- **fix** Protección contra doble clic en todos los formularios de creación (páginas + registro
  inline) mediante el estado `guardando`.
- **fix** Fechas de tabla en Pagos/Clientes ahora usan `fmtDate`/`fmtDateTime` (es-VE) en lugar de
  `toLocaleDateString` a mano; el badge del dashboard distingue «vencida» (días negativos) de
  «0» (corte hoy).
- **chore** `crearSuscripcion` devuelve el `id` como el resto de creadores (consistencia de API).
- **chore** `index.html`: `lang="es"`, título «Suscripciones · Panel administrativo» y meta
  description (antes `lang="en"` y título `app`).
- **docs** `README.md` raíz (repo público, migraciones 0001-0006, Fase 2 completa), `.env.example`
  versionado, `05-seguridad.md` (sección Auth + RLS y checklist), `06-desarrollo.md` (estructura
  y convenciones de UI), `07-despliegue.md` (procedimiento real Pages), `08-changelog.md` (esta
  entrada).

## Próximos

- **security** Rotación de claves expuestas en el chat (la `service_role` ya no viaja en el bundle, pero conviene emitir una nueva y descartar la actual).
- **Fase 3** Catálogo público de venta con la vista `v_catalogo_publico`.
- **feat** Deploy de la Edge Function `fetch-bcv` y activación del cron `tasas-bcv-diaria`.