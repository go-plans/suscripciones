-- 0010: Registro sin verificación de correo electrónico
-- Permite que cualquier usuario nuevo quede confirmado al instante
-- (email_confirmed_at = now()) y entre directo a la tienda. La app
-- ya redirige sola a /tienda cuando el signup devuelve sesión.

create or replace function public.auto_confirmar_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.email_confirmed_at is null then
    NEW.email_confirmed_at = now();
    NEW.confirmed_at = now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_auto_confirmar_email on auth.users;
create trigger trg_auto_confirmar_email
before insert on auth.users
for each row
execute function public.auto_confirmar_email();