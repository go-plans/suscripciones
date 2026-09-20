# Índice de Documentación

> Documentación del **Sistema Integral de Gestión de Suscripciones**.
> Esta carpeta sigue el estándar *docs-as-code*: cada documento versionado junto al código, actualizado con cada cambio.

## Capítulos

| # | Documento | Contenido |
|---|---|---|
| 0 | [`README.md`](../README.md) | Vista general del proyecto |
| 1 | [`01-arquitectura.md`](./01-arquitectura.md) | Stack, estructura, decisiones de diseño |
| 2 | [`02-base-de-datos.md`](./02-base-de-datos.md) | Entidades, relaciones, triggers, RLS, vistas, cron |
| 3 | [`03-integraciones.md`](./03-integraciones.md) | Supabase, GitHub, claves, variables de entorno |
| 4 | [`04-flujos-negocio.md`](./04-flujos-negocio.md) | Referidos, BCV, multi-suscripción, proveedores |
| 5 | [`05-seguridad.md`](./05-seguridad.md) | Gestión de secretos, RLS, rotación de claves |
| 6 | [`06-desarrollo.md`](./06-desarrollo.md) | Setup, comandos, convenciones de código |
| 7 | [`07-despliegue.md`](./07-despliegue.md) | Edge Functions, cron, verificación |
| 8 | [`08-changelog.md`](./08-changelog.md) | Historial de cambios por versión |

## Registros de decisión (ADR)

- [`ADR/001-backend-como-servicio.md`](./ADR/001-backend-como-servicio.md)

## Convenciones de esta documentación

1. **Todo cambio de código debe reflejarse** en el documento correspondiente y en el `08-changelog.md` en el mismo commit.
2. **Los secretos nunca se documentan en texto claro** excepto con marcador `<placeholder>`; los valores reales viven solo en `.env` / gestor de claves.
3. Cada documento es **independiente**: puede leerse sin depender de otro.
4. Código SQL/fuente citado en la documentación debe coincidir con la versión commiteada.
5. Actualización de una decisión de diseño → **nuevo ADR** (nunca se reescribe un ADR aprobado).

## Cómo mantenerla viva

- Antes de mergear una feature: comprobar que `docs/` y `CHANGELOG` están al día.
- Los logs de ejecución van a `../logs/` y no se documentan.