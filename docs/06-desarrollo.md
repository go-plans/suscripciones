# 06 — Desarrollo local

## 1. Requisitos

- Node.js **24+** y npm **11+** (verificar: `node --version`, `npm --version`)
- Git 2.53+
- Supabase CLI (opcional, para edge functions y `db push`): `supabase --version`

## 2. Setup

```bash
# 1) Dependencias
cd app
npm install

# 2) Variables de entorno (app/.env — se crea a partir de API KEYS.txt)
#    VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
#    ⚠️ .env debe vivir en app/ (Vite solo carga .env desde la carpeta del proyecto).
#    ⚠️ No poner VITE_SUPABASE_SERVICE_ROLE_KEY: esa clave es SOLO para scripts
#       locales del equipo, nunca para el bundle del navegador.

# 3) Servidor de desarrollo
npm run dev          # http://localhost:5173
```

## 3. Scripts npm

| Script | Comando | Uso |
|---|---|---|
| dev | `npm run dev` | servidor dev con HMR |
| build | `npm run build` | build de producción (tsc + vite) |
| preview | `npm run preview` | sirve el build localmente |
| lint | `npm run lint` | oxlint (config `.oxlintrc.json`) |

## 3b. Dependencias del frontend (Fase 2)

| Paquete | Uso |
|---|---|
| `@supabase/supabase-js` | cliente REST (PostgREST) |
| `react-router-dom` (v7) | rutas `/`, `/clientes`, `/suscripciones`, `/plataformas`, `/cuentas-madre`, `/proveedores`, `/pagos`, `/comisiones` |
| `tailwindcss` + `@tailwindcss/vite` (v4) | estilos utilitarios (plugin de Vite, import en `index.css`) |

> `date-fns` **no** se usa: las utilidades de fecha/moneda viven en `src/lib/format.ts` (Intl nativo).
> ⚠️ npm puede fallar en Windows si se lanzan dos `npm install` a la vez en la misma carpeta
> (colisiones de extracción). Si `node_modules` queda corrupto: borrar `node_modules` y
> `package-lock.json` y volver a instalar.

## 4. Migraciones de base de datos

La conexión directa es IPv6-only; se trabaja **vía pooler de sesión**.

```bash
# Aplicar una migración (script Node con driver pg)
set DB_PASS=<password>  REGION=us-west-2
node <runner> supabase/migrations/000N_migracion.sql
```

> El runner vive en el repo de herramientas (se documenta aquí el patrón, no el secreto). Ver `docs/03-integraciones.md` para la conexión pooler.

Alternativamente aplicar manualmente desde el **SQL Editor** del dashboard de Supabase.

## 5. Supabase CLI (edge functions)

```bash
supabase login
supabase link --project-ref xbmewcmpfnligeodggop
supabase functions deploy fetch-bcv --no-verify-jwt
```

## 6. Convenciones de código

- **Idioma del código**: los identificadores de negocio (nombres de tabla/columna) en inglés; UI en español.
- **TypeScript estricto**: tipos explícitos para dinero/fechas; nunca `any` en modelos financieros.
- **Dinero**: usar `number` con redondeo a 2 decimales en el frontend; en la DB `NUMERIC(12,2)`.
- **Fechas**: usar `Intl` nativo (helpers en `src/lib/format.ts`); comparar fechas (no timestamps) para cortes.
- **Commits**: mensajes tipo Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Cada cambio que afecte comportamiento se refleja en `docs/08-changelog.md`.
- **Consultas a datos**: todas a través de `src/lib/api.ts` (capa única); cambiar aquí es cambiar todo.

## 7. Estructura del frontend (Fase 2 / 2.1)

```
src/
├── lib/
│   ├── supabase.ts   # cliente con anon key SOLO (auth + RLS; service_role prohibida en bundle)
│   ├── auth.tsx      # AuthProvider + useAuth (sesión Supabase Auth persistida) + login/logout
│   ├── api.ts        # capa única de acceso a datos (listas con caché TTL 20 s + invalidación en escrituras)
│   ├── err.ts        # errMsg(e): mensaje de error robusto (único helper de errores)
│   ├── types.ts      # tipos que reflejan el esquema de la DB
│   └── format.ts     # formatos es-VE: VES/USD/USDT (punto-miles, coma-decimales), fechas locales, hoy()
├── components/
│   ├── icons.tsx     # iconos vectoriales tipo Lucide (sin emojis)
│   ├── inline.tsx    # registro inline: NuevoCliente, NuevoPlan, NuevaCuenta, NuevoProveedor, NuevaPlataforma
│   ├── ui.tsx        # primitivas: Button/Input/Select/Field, Table, Badge, Card/StatCard, Modal+
│   │                #   ModalFooter, PageHeader, Buscador, EmptyState, Loading/ErrorMsg
│   └── Layout.tsx    # sidebar (iconos vectoriales) + email de sesión + botón "Cerrar sesión" + <Outlet/>
└── pages/            # carga perezosa: React.lazy + Suspense (un chunk por página)
    ├── Login.tsx             # autenticación (email + contraseña Supabase Auth)
    ├── Dashboard.tsx         # KPIs + alertas v_vencimientos_proveedores (≤3 días)
    ├── Clientes.tsx          # CRUD clientes (+ referido por agente) + buscador
    ├── Suscripciones.tsx     # alta con registro inline + fecha de inicio/estado (históricas)
    ├── Plataformas.tsx       # CRUD plataformas + toggle comisión 30%
    ├── CuentasMadre.tsx      # inventario (proveedor/corte opcionales) + inline + buscador
    ├── Proveedores.tsx       # CRUD simple
    ├── Pagos.tsx             # calculadora BCV (+ botón "Reflejar tasa" desde bcv.org.ve vía fetch-bcv), tasa Binance USDT, distribución
    └── Comisiones.tsx        # lista 30% + liquidación + filtro por estado
```

### Convenciones de UI (Fase 2.3)

- **Encabezados**: toda página usa `PageHeader` (`title`, `subtitle`, acciones a la derecha).
- **Buscadores**: `Buscador` (input + icono) en Clientes, Suscripciones y Cuentas madre.
- **Carga/estados**: patrón en cada página — `cargando` (inicial) → `Loading`; error → `ErrorMsg`;
  lista vacía → `EmptyState` (antes una lista sin datos mostraba «Cargando…» para siempre).
- **Formularios en modal**: pie estándar `ModalFooter` (Cancelar + Guardar con estado
  `guardando` contra doble clic) en páginas y componentes inline.
- **Errores**: siempre `errMsg(e)` de `src/lib/err.ts` (nunca `(e as Error).message` a mano).

### Nota de seguridad (FASE 2.2 — DESPLIEGUE)

El bundle del navegador usa **solo la anon key** (publishable). El acceso al
panel pasa por **Supabase Auth + RLS**: el login (`/#/login`) emite un JWT y la
base solo deja actuar a `es_admin()` (`usuarios.id = auth.uid()` con
`rol='admin'`); el guard de rutas bloquea el panel sin sesión.

La `VITE_SUPABASE_SERVICE_ROLE_KEY` queda **restringida a scripts locales del
equipo** (p. ej. `bootstrap-admin.cjs`), fuera del repo y nunca en el bundle.
Regla estricta: si un build necesita esa variable, está mal diseñado.

## 8. Logs

- Los logs de ejecución de scripts y migraciones van a `logs/` (fuera de git).
- No documentar secretos en logs.

## 9. Despliegue a GitHub Pages

El sitio es 100 % estático (Vite con `base: './'` + `HashRouter`), así que
basta con publicar el `dist/` en la rama `gh-pages`:

```powershell
cd app
npm run build                       # compila con anon key (sin service_role)
# 1) commitear y pushear el cambio primero
git add -A && git commit -m "..." && git push origin main
# 2) publicar el build en la rama gh-pages
git worktree add --orphan -b gh-pages .ghpages
Copy-Item dist\* .ghpages\ -Recurse -Force
git -C .ghpages add -A
git -C .ghpages commit -m "deploy: release v0.2.3"
git -C .ghpages push origin gh-pages --force
git worktree remove .ghpages
```

- URL del sitio: `https://go-plans.github.io/suscripciones/` (el login está en
  `/#/login`; las credenciales del admin viven en `API KEYS.txt`, fuera del repo).
- GitHub Pages en una cuenta gratuita solo sirve repos **públicos** (por eso el repo
  `go-plans/suscripciones` es público desde Fase 2.3; un repo privado requeriría plan de pago).
- El build de Pages NO lleva secretos: la anon key es publishable por diseño.