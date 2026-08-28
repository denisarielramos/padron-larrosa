-- padron-larrosa: objetos NUEVOS y aislados sobre la Supabase existente de
-- denisarielramos/sistema-electoral (proyecto pboirnjiyytbvihtdpgb).
--
-- NO crea ni modifica la tabla `padron` (ya existe con ~106.845 filas reales
-- y es propiedad de sistema-electoral): ni columnas, ni indices, ni
-- policies, ni grants. Este script es puramente aditivo:
--   1) una funcion de busqueda nueva, ejecutable SOLO por service_role
--      (no por anon ni authenticated -- la consulta publica pasa siempre
--      por el backend Next.js, que es el unico que tiene esa key)
--   2) una tabla de registro de consultas nueva, exclusiva de este proyecto,
--      con INSERT reservado tambien a service_role (el backend verifica el
--      dato real antes de insertar; el navegador nunca inserta directo)
--   3) una tabla de administradores (padron_admins) para autorizar quien
--      puede leer padron_consultas -- estar autenticado NO alcanza
--
-- Ejecutar en el SQL Editor del proyecto Supabase de Larrosa.

-- ── Funcion de busqueda (solo callable desde el backend) ─────────────────
-- Devuelve unicamente los 7 campos necesarios (sin direccion, sin created_at).
-- SECURITY DEFINER: corre con los privilegios de quien crea la funcion, no
-- con los del rol que la invoca. Asi no depende de (ni modifica) el grant
-- de SELECT que hoy tiene `anon` sobre `padron`.
--
-- Se usa `create function` (no `or replace`) a proposito: si ya existiera
-- una funcion con este nombre y firma, la migracion falla en vez de
-- pisarla silenciosamente.
create function public.buscar_padron(termino_input text)
returns table (
  ci text,
  nombre text,
  apellido text,
  seccional text,
  local_votacion text,
  mesa text,
  orden text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  ci_num bigint;
  raw_tokens text[];
  esc_tokens text[];
begin
  -- CI: comparacion numerica directa contra la columna (no ci::text), para
  -- poder aprovechar un eventual indice sobre ci. Limite de digitos para
  -- evitar overflow al castear un termino absurdamente largo.
  if termino_input ~ '^[0-9]{1,15}$' then
    begin
      ci_num := termino_input::bigint;
    exception when others then
      ci_num := null;
    end;

    if ci_num is not null then
      return query
        select p.ci::text, p.nombre, p.apellido, p.seccional, p.local_votacion,
               p.mesa::text, p.orden::text
        from public.padron p
        where p.ci = ci_num
        limit 50;
      return;
    end if;
  end if;

  -- Nombre/apellido: cada palabra del termino debe aparecer en
  -- "nombre apellido", en cualquier orden -- cubre "Juan Lopez",
  -- "Lopez Juan", "Juan", "Lopez", y nombres/apellidos compuestos.
  -- % y _ se escapan para que no se puedan usar como comodines y pedir
  -- segmentos grandes del padron.
  raw_tokens := regexp_split_to_array(trim(both from termino_input), '\s+');
  esc_tokens := array(
    select replace(replace(replace(tok, '\', '\\'), '%', '\%'), '_', '\_')
    from unnest(raw_tokens) as tok
    where length(trim(tok)) > 0
  );

  if esc_tokens is null or array_length(esc_tokens, 1) is null then
    return;
  end if;

  return query
    select p.ci::text, p.nombre, p.apellido, p.seccional, p.local_votacion,
           p.mesa::text, p.orden::text
    from public.padron p
    where not exists (
      select 1
      from unnest(esc_tokens) as tok
      where (p.nombre || ' ' || p.apellido) not ilike '%' || tok || '%' escape '\'
    )
    order by p.apellido, p.nombre
    limit 50;
end;
$$;

revoke all on function public.buscar_padron(text) from public;
revoke all on function public.buscar_padron(text) from anon;
revoke all on function public.buscar_padron(text) from authenticated;
grant execute on function public.buscar_padron(text) to service_role;

-- ── Administradores de padron-larrosa ─────────────────────────────────────
-- Estar autenticado en Supabase Auth NO alcanza para ver el dashboard: solo
-- los user_id listados aca. Sin policies publicas -- se administra a mano
-- desde el SQL Editor (service_role), nunca desde anon/authenticated.
create table public.padron_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.padron_admins enable row level security;

-- ── Registro de consultas (exclusivo de padron-larrosa) ──────────────────
create table public.padron_consultas (
  id bigint generated always as identity primary key,
  termino_buscado text not null,
  ci text not null,
  nombre_completo text,
  seccional text,
  local_votacion text,
  mesa text,
  orden text,
  created_at timestamptz not null default now()
);

alter table public.padron_consultas enable row level security;

create index idx_padron_consultas_created_at
  on public.padron_consultas (created_at desc);

-- Sin policy de INSERT para anon/authenticated a proposito: el unico INSERT
-- lo hace el backend (/api/registrar-consulta) con service_role, que
-- bypasea RLS, despues de verificar el CI real contra `padron`. Tampoco hay
-- policy de UPDATE/DELETE para nadie.
create policy "admins leen consultas"
  on public.padron_consultas
  for select
  to authenticated
  using (
    exists (
      select 1 from public.padron_admins pa where pa.user_id = auth.uid()
    )
  );
