set client_min_messages = error;
-- SOLO PARA PRUEBAS LOCALES SIN SUPABASE.
-- Reproduce los objetos mínimos que Supabase crea en cada proyecto
-- (roles, esquema auth, auth.uid() y la publicación de Realtime) para poder
-- aplicar las migraciones reales sobre un PostgreSQL vacío.
-- No se aplica nunca a un proyecto de Supabase.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end;
$$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  is_anonymous boolean not null default true
);

-- Misma implementación que Supabase.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;

-- Supabase concede privilegios por defecto a anon/authenticated sobre public;
-- se reproduce para comprobar que las migraciones los retiran.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;
