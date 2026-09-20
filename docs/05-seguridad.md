# 05 — Seguridad

## 1. Principios

1. **El `service_role` nunca se expone en el frontend.** Solo Edge Functions y scripts de administración.
2. **RLS siempre activo** (ya habilitado en las 11 tablas). Administrar con roles de `usuarios`.
3. **Los secretos NO se versionan.** Excluidos vía `.gitignore` (`.env`, `API KEYS.txt`); `app/.env.example` es la única plantilla versionada (sin valores).
4. **Menor privilegio**: los agentes solo leen sus propias comisiones.
5. **Acceso al panel vía Supabase Auth + RLS**: el bundle lleva solo la anon key;
   el login emite un JWT y la base solo permite actuar a `es_admin()`.

## 2. Gestión de secretos

| Recurso | Dónde vive | Permisos |
|---|---|---|
| `.env` | raíz de `app/` | solo el usuario propietario (ACL restringido) |
| `.env.example` | raíz de `app/` (versionado) | público, solo marcadores placeholders |
| `API KEYS.txt` | `Suscripciones/` (fuera del repo) | solo el usuario propietario (ACL restringido) |
| Tokens GitHub | GitHub → Developer settings | rotables |

**dotfiles excluidos**: `.gitignore` incluye `.env`, `.env.*` y `API KEYS.txt` (no
excluye `.env.example`).

## 3. Rotación de claves

Después de cualquier exposición accidental (chat, pantalla compartida, `.txt` en nube):

1. **Supabase**: Settings → Database → `Reset database password` (rota el DB Pass).
2. **Supabase**: Settings → API → regenerar `service_role` y `anon/publishable`.
3. **GitHub**: Developer settings → revisar/revocar el PAT y generar uno nuevo.
4. Actualizar `.env` y `API KEYS.txt`; verificar la app y luego descartar la clave antigua.

> Si una clave quedó expuesta y se realizan más cambios, rotar **primero** y verificar **después** con las nuevas.

## 4. Autenticación (Auth + RLS) y RLS en detalle

El panel se autentica contra **Supabase Auth** (email + contraseña). La `anon key`
se usa para iniciar sesión y, una vez dentro, el JWT identifica al usuario:

```text
Login (anon key) → Supabase Auth → JWT (auth.uid()) → consultas con RLS
```

- Un anónimo sin sesión **no lee nada** del panel: el guard de rutas bloquea el
  UI y la RLS devuelve 0 filas (todas las tablas exigen sesión).
- El usuario admin se crea por script (`bootstrap-admin.cjs`, fuera del repo):
  cuenta Auth `admin@go-plans.app` + fila `public.usuarios` con `rol='admin'` y
  `id = auth.uid()`.
- Registro de agentes/clientes del equipo: igual que el admin (script con
  `service_role` en local), nunca por autoregistro público.

**RLS en detalle**:

```sql
-- Admin: control total
es_admin() = existe fila en usuarios con id = auth.uid() y rol = 'admin'
-- Agente
SELECT en comisiones WHERE agente_id = auth.uid()
-- Anónimo (catálogo público)
SELECT en plataformas y planes
```

**Convención crítica**: para que la RLS funcione, las filas de `usuarios` de personas con cuenta deben tener `id = auth.uid()` (el UUID de Supabase Auth).

## 5. Checklist de auditoría

- [x] `service_role` no aparece en `src/` ni en el bundle (`dist/`); solo anon key
- [x] vistas sensibles son `security_invoker` (verificado: anónimo lee 0 filas)
- [x] `.env` no está en `git status`; `.env.example` solo tiene placeholders
- [x] `API KEYS.txt` no está en el repositorio (repo público: verificado con la API)
- [ ] RLS habilitado en tablas nuevas
- [ ] las funciones `security definer` están limitadas a lo estrictamente necesario (los triggers `trg_*` sí lo requieren para escribir pese a RLS)
- [ ] cron jobs no insertan datos sensibles en `cron.job_run_details` (uso de `BEGIN`/`RETURN`)

## 6. Buenas prácticas al añadir features

- Toda tabla nueva: `enable row level security` + políticas explícitas.
- Toda función plpgsql con lógica sensible: revisar si necesita `security definer` (nunca por defecto).
- Validar input en el frontend **y** en la DB (constraints/checks).
- Documentar cada decisión de seguridad en el `08-changelog.md`.