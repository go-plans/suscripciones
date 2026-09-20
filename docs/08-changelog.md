# 08 — Changelog

> Historial de cambios del proyecto. Se actualiza **en el mismo commit** que los cambios de código. Formato de líneas: `- [tipo] descripción` (tipo: feat / fix / docs / chore / security / refactor).

## 2026-09-20 — Registro sin verificación de correo

### v0.3.3

- **fix** **Registro sin verificación de correo**: cualquier usuario nuevo queda confirmado al instante (`email_confirmed_at` se fija en el mismo INSERT) y entra **directo a la tienda** nada más crear la cuenta. Ya no aparece "¡Casi listo! revisa tu correo".
- **feat** Migración `0010_auto_confirmar_email.sql`: trigger `trg_auto_confirmar_email` (BEFORE INSERT en `auth.users`) que rellena `email_confirmed_at`/`confirmed_at = now()` si vienen NULL, más la función `public.auto_confirmar_email()`.
- **test** Verificado con signup real vía API y E2E en el navegador: el registro retorna sesión (`access_token`) y redirige a `/#/tienda` con el aviso "¡Cuenta creada con éxito!".

## 2026-09-20 — Tienda tipo catálogo con páginas por plataforma

### v0.3.2

- **feat** **La tienda ahora es un catálogo de productos**: la portada (`/#/tienda`) muestra una tarjeta por plataforma con el **icono de la marca** (G multicolor de Google, logomarca de Canva, círculo de Spotify) y la estética de cada una — Google blanco, Canva morado, Spotify verde — con lema, "Desde $" y botón "Ver planes".
- **feat** **Página de detalle por plataforma** (`/#/tienda/google`, `/#/tienda/canva`, `/#/tienda/spotify`): al pulsar una tarjeta se abre la página con los planes de esa plataforma y el diseño completo de la marca (el hero de Google One, las filas de Canva Pro y Spotify Premium) más un botón "← Tienda" para volver al catálogo.
- **refactor** Cabecera de la tienda extraída a un componente reutilizable `BarraTienda` (con la opción "volver") compartido entre el catálogo y las páginas de detalle.
- **feat** Helpers nuevos en `lib/tienda.ts`: `slugPlataforma` (rutas estables `google`/`canva`/`spotify`), `plataformaPorSlug` (resolución de la ruta) y `taglinePlataforma` (lema corto por marca).
- **feat** Componente de iconos de marca `IconosMarca.tsx` (Google G oficial multicolor, Spotify, C de Canva).
- Las plataformas del catálogo se ordenan siempre Google → Canva → Spotify (y las demás al final).

## 2026-09-20 — Pagos avanzados + Rediseño visual de la tienda

### v0.3.1

- **feat** **Fecha del pago editable**: el formulario de Pagos ahora incluye un campo `fecha_pago` (por defecto hoy, máximo hoy, permite fechas pasadas) para registrar cobros hechos antes de la web. La renovación de suscripciones se calcula desde la fecha del pago.
- **feat** **Moneda automática según método**: al seleccionar método de pago, la moneda se preselecciona sola (Pago Movil→BS, Zelle→USD, Binance/Transferencia→USDT). La moneda sigue siendo editable.
- **feat** **Método "Binance"** agregado a la lista de métodos de pago (requirió migración CHECK). Método "Efectivo" retirado (el negocio no lo usa).
- **feat** **Buscador de cliente** en el formulario de Pagos: escribir nombre o correo filtra en vivo, con componente reutilizable `SelectCliente`.
- **feat** **Filtros en la tabla de pagos**: búsqueda por cliente, filtro por método, por moneda, rango de fechas (desde/hasta), totales filtrados y botón "Limpiar filtros".
- **feat** **Editar y borrar pagos**: botones de lápiz (editar) y basura (borrar) en cada fila. Editar modifica fecha/monto/moneda/método/distribución y recalcula comisión del agente vía la función RPC `editar_pago`. Borrar elimina el pago, sus asignaciones y comisión asociada en cascada.
- **feat** **Límite de pagos** subido de 100 a 500 en `fetchPagos`.
- **fix** **fmtDate corregido**: las fechas tipo date (`YYYY-MM-DD`) ahora se parsean en hora local (mediodía) en lugar de UTC, evitando el desfase de −1 día en Venezuela.
- **fix** **Formato de precios en la tienda**: `precioUsd` ahora muestra `2.99$` (punto decimal, $ al final) en lugar de `$ 2,99`, coincidiendo con el diseño de referencia.
- **feat** **Fuentes tipográficas**: Google Sans (400/500/700) y Google Sans Display (400/500/700) descargadas a `/fonts/` y aplicadas al catálogo de Google One. Canva Sans (Regular/Bold) descargada del zip y aplicada a Canva Pro/Spotify.
- **refactor** **Diseño visual de la tienda** actualizado para coincidir con las imágenes de referencia:
  - Google One: "1 año" con colores de marca Google (azul/rojo/amarillo/verde), tipografía Google Sans Display, comparativa "Pasa de esto → A esto" refinada.
  - Canva Pro: logo "Canva" en estilo itálico/script, "PRO" en mayúsculas, tarjetas horizontales con divisor vertical y badges teal.
  - Spotify Premium: logo "♫ Spotify Premium", tarjetas negras con texto verde, badges blancos, footer con descargo BCV.
- **feat** Migración `0009_pagos_avanzados.sql`: CHECK de `metodo_pago` actualizado (agrega 'Binance', elimina 'Efectivo'), función `renovar_suscripcion_por_pago` reescrita para usar `fecha_pago` del pago (no `current_date`), función RPC `editar_pago` (edición atómica: pago + distribución + comisión).
- **security** Función `editar_pago` validada con `es_admin()` (solo admin puede editar pagos).
- **docs** Pooler de conexión actualizado: `aws-0-us-west-2.pooler.supabase.com:5432` (el host directo `db.<ref>.supabase.co` ya no resuelve).

## 2026-09-20 — Fase 3 · Tienda pública y registro de clientes

### v0.3.0

- **feat** Tienda pública de venta en `/#/tienda` (misma URL del proyecto), con el catálogo real desde `v_catalogo_publico` y tres diseños según la plataforma:
  - **Google One** (tarjetas verticales, estilo Google/Spotify/Canva): hero "5 TB de almacenamiento", comparativa *Antes → Después* (correo lleno vs. 0% en uso) y precios con **referencia tachada** + ahorro (50% / 67%).
  - **Canva Pro** (filas horizontales moradas) y **Spotify Premium** (filas horizontales verdes): una fila por duración (1 mes / 6 meses / 1 año) con precio mensual equivalente y el ahorro real calculado contra el precio mensual.
  - Footer con descargo: los precios van en USD; el equivalente en bolívares se calcula con la tasa oficial del **BCV** al momento del pago.
- **feat** Registro de clientes en `/#/registro` con **nombre, correo, teléfono (opcional) y contraseña** (Supabase Auth `signUp` con metadatos): la BD crea la fila en `usuarios` con `rol='cliente'` vía el trigger `auto_crear_usuario_cliente`. Con la confirmación de correo **activada** (tal como está el proyecto) muestra "¡Casi listo! 🎉 — revisa tu correo"; desactivada entraría directo a la tienda.
- **feat** Página `/#/ingreso` (entrar con correo del cliente) y enlaces "Ingresar / Registrarse" en la cabecera de la tienda.
- **feat** Migración `0007_tienda.sql`: columna `planes.precio_referencia_usd` (precio tachado), vista `v_catalogo_publico` ampliada (logo, duración, precio de venta y referencia; **sin** datos sensibles de inventario/RLS), trigger de registro y políticas RLS del cliente (`cliente_ve_su_fila` / `cliente_edita_su_fila`), más el seed de **Google One** con `aplica_comision`.
- **feat** Migración `0008_catalogo_venta.sql`: precios reales de venta en la BD — **Google One** 2,99 (ref. 5,99)/8,99/11,99 US$ · **Canva Pro** 8,00/39,99/69,99 US$ · **Spotify Premium** 3,49/16,99/28,99 US$. Se **desactiva** "Google One 5 TB" (plan duplicado que solo tenía 365 días) sin borrarlo.
- **security** El bundle **no** contiene la `service_role`: el registro usa solo la anon key + Supabase Auth, y la fila en `usuarios` la crea la BD (trigger), nunca el cliente.
- **refactor** `src/lib/auth.tsx` expone `rol` / `rolCargando` / `perfil`; el guard `Protegida` redirige a `/#/tienda` a todo usuario autenticado que no sea `admin`. El panel admin (Dashboard, Clientes, Suscripciones, Pagos, etc.) queda inalterado y verificado tras el refactor.
- **chore** Lazy loading de Tienda/Registro/Ingreso (chunks propios) y helpers de catálogo en `src/lib/tienda.ts` (`agruparCatalogo`, cálculo de ahorro, formatos es-VE).
- **docs** `02-base-de-datos` (trigger, políticas RLS, vistas y migraciones 0007/0008), `07-despliegue` (rutas públicas y verificación del sitio) y esta entrada.

## 2026-09-20 — Fase 2.6 · Horario del cron de la tasa BCV

### v0.2.6

- **feat** El cron diario `tasas-bcv-diaria` ahora corre a las **18:00 hora de Venezuela** (`0 22 * * *` en BD UTC, que es la configuración por defecto de Supabase) en lugar de las 7:00, para capturar la tasa que el **BCV publica ~16:00 VET** (20:00 UTC). Antes, al correr de madrugada, almacenaba la tasa del día anterior.
- **docs** `02-base-de-datos` y `07-despliegue` actualizados con la equivalencia de zonas horarias y el paso `show timezone;` (si la BD estuviera en `America/Caracas`, usar `0 18 * * *`).

## 2026-09-20 — Fase 2.4 · Tasa oficial del BCV

### v0.2.4

- **feat** La tasa oficial ahora se extrae del **sitio oficial del BCV** (`bcv.org.ve`, bloque USD de la página *Tipo de Cambio de Referencia*), no de dolarapi.com. La Edge Function `fetch-bcv` raspea el HTML oficial (server-side, porque la página del BCV no envía cabeceras CORS) y guarda la tasa con la **Fecha Valor** que publica el BCV en `tasas_cambio`.
- **feat** Botón **"Reflejar tasa"** en Pagos: llama a la Edge Function `fetch-bcv` para reflejar la tasa BCV en vivo (fuente `bcv.org.ve`); si la función aún no está desplegada, cae a la última tasa almacenada en `tasas_cambio` (que también proviene del BCV).
- **docs** `01-arquitectura`, `02-base-de-datos`, `06-desarrollo`, `07-despliegue` y `ADR/001` actualizados: fuente `bcv.org.ve` y notas de CORS/despliegue del parser.

## 2026-09-20 — Fase 2.5 · Mobile-friendly

### v0.2.5

- **feat** Diseño responsive para móviles/tablets:
  - **Navegación**: en pantallas pequeñas la barra lateral se convierte en una barra superior con menú hamburguesa (drawer deslizable con overlay y cierre al navegar); en escritorio se mantiene la barra lateral fija.
  - **Tablas**: el contenedor con scroll horizontal (ya venía con `min-w-max`) evita que las tablas rompan el ancho del viewport.
  - **Modales**: altura máxima 90 vh con scroll vertical interno para formularios largos.
  - **Formularios**: los grids de 2–3 columnas colapsan a 1 columna en pantallas pequeñas (Pagos, Suscripciones, Cuentas madre, planes/cuentas inline).
  - **Login**: ya era responsivo (`max-w-sm` + `px-4`), sin cambios.

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
- **feat** Deploy de la Edge Function `fetch-bcv` y activación del cron `tasas-bcv-diaria`.