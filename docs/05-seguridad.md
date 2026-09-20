# 05 — Seguridad

## 1. Principios

1. **El `service_role` nunca se expone en el frontend.** Solo Edge Functions y scripts de administración.
2. **RLS siempre activo** (ya habilitado en las 11 tablas). Administrar con roles de `usuarios`.
3. **Los secretos NO se versionan.** Excluidos vía `.gitignore` (`.env`, `API KEYS.txt`).
4. **Menor privilegio**: los agentes solo leen sus propias comisiones.

## 2. Gestión de secretos

| Recurso | Dónde vive | Permisos |
|---|---|---|
| `.env` | raíz de `app/` | solo el usuario propietario (ACL restringido) |
| `API KEYS.txt` | `Suscripciones/` (fuera del repo) | solo el usuario propietario (ACL restringido) |
| Tokens GitHub | GitHub → Developer settings | rotables |

**,dotfiles excludidos**: `.gitignore` incluye `.env`, `.env.*` y `API KEYS.txt`.

## 3. Rotación de claves

Después de cualquier exposición accidental (chat, pantalla compartida, `.txt` en nube):

1. **Supabase**: Settings → Database → `Reset database password` (rota el DB Pass).
2. **Supabase**: Settings → API → regenerar `service_role` y `anon/publishable`.
3. **GitHub**: Developer settings → revisar/revocar el PAT y generar uno nuevo.
4. Actualizar `.env` y `API KEYS.txt`; verificar la app y luego descartar la clave antigua.

> Si una clave quedó expuesta y se realizan más cambios, rotar **primero** y verificar **después** con las nuevas.

## 4. RLS en detalle

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

- [ ] `service_role` no aparece en `src/`
- [ ] `.env` no está en `git status`
- [ ] `API KEYS.txt` no está en el repositorio
- [ ] RLS habilitado en tablas nuevas
- [ ] las funciones `security definer` están limitadas a lo estrictamente necesario
- [ ] cron jobs no insertan datos sensibles en `cron.job_run_details` (uso de `job_run_details` puede filtrar literales; usando `BEGIN`/`RETURN`)

## 6. Buenas prácticas al añadir features

- Toda tabla nueva: `enable row level security` + políticas explícitas.
- Toda función plpgsql con lógica sensible: revisar si necesita `security definer` (nunca por defecto).
- Validar input en el frontend **y** en la DB (constraints/checks).
- Documentar cada decisión de seguridad en el `08-changelog.md`.