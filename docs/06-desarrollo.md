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
#    VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY
#    ⚠️ .env debe vivir en app/ (Vite solo carga .env desde la carpeta del proyecto).

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
│   ├── supabase.ts   # cliente (service_role en Fase 2 — ver nota de seguridad)
│   ├── api.ts        # capa única de acceso a datos (listas con caché TTL 20 s + invalidación en escrituras)
│   ├── types.ts      # tipos que reflejan el esquema de la DB
│   └── format.ts     # formatos es-VE: VES/USD/USDT (punto-miles, coma-decimales), fechas
├── components/
│   ├── icons.tsx     # iconos vectoriales tipo Lucide (sin emojis)
│   ├── inline.tsx    # registro inline: NuevoCliente, NuevoPlan, NuevaCuenta, NuevoProveedor, NuevaPlataforma
│   ├── ui.tsx        # primitivas (Button, Input, Select, Table con cabecera fija, Badge, Modal, StatCard…)
│   └── Layout.tsx    # sidebar (iconos vectoriales) + <Outlet/>
└── pages/            # carga perezosa: React.lazy + Suspense (un chunk por página)
    ├── Dashboard.tsx        # KPIs + alertas v_vencimientos_proveedores (≤3 días)
    ├── Clientes.tsx         # CRUD clientes (+ referido por agente) + buscador
    ├── Suscripciones.tsx    # alta con registro inline + fecha de inicio/estado (históricas)
    ├── Plataformas.tsx      # CRUD plataformas + toggle comisión 30%
    ├── CuentasMadre.tsx     # inventario (proveedor/corte opcionales) + inline + buscador
    ├── Proveedores.tsx      # CRUD simple
    ├── Pagos.tsx            # calculadora BCV (+ botón "Reflejar tasa" dolarapi), tasa Binance USDT, distribución
    └── Comisiones.tsx       # lista 30% + liquidación + filtro por estado
```

### Nota de seguridad (IMPORTANTE)

El panel admin opera con `VITE_SUPABASE_SERVICE_ROLE_KEY`: una clave con
privilegios totales que queda **incrustada en el bundle del navegador**.
Esto es una decisión temporal y **solo aceptable en localhost**.
Antes de cualquier despliegue al público se debe migrar a Supabase Auth +
RLS (el RLS de la base ya está preparado para ello). Ver `docs/05-seguridad.md`.

## 8. Logs

- Los logs de ejecución de scripts y migraciones van a `logs/` (fuera de git).
- No documentar secretos en logs.