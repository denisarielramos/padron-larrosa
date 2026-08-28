-- padron-larrosa: objetos NUEVOS y aislados sobre la Supabase existente de
-- denisarielramos/sistema-electoral (proyecto pboirnjiyytbvihtdpgb).
--
-- NO crea ni modifica la tabla `padron` (ya existe con ~106.845 filas reales
-- y es propiedad de sistema-electoral). Este script es puramente aditivo:
--   1) una funcion de busqueda nueva (no existia: verificado, PGRST202)
--   2) una tabla de registro de consultas nueva, exclusiva de este proyecto
--
-- Ejecutar en el SQL Editor del proyecto Supabase de Larrosa.

-- ── Funcion de busqueda publica ──────────────────────────────────────────
-- Devuelve unicamente los 7 campos necesarios (sin direccion, sin created_at).
-- SECURITY DEFINER: corre con los privilegios de quien crea la funcion, no
-- con los del rol `anon`. Asi no depende de (ni modifica) el grant de SELECT
-- que hoy tiene `anon` sobre `padron` -- si sistema-electoral en el futuro
-- lo restringe, esta funcion sigue funcionando igual.
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
begin
  if termino_input ~ '^[0-9]+$' then
    return query
      select p.ci::text, p.nombre, p.apellido, p.seccional, p.local_votacion,
             p.mesa::text, p.orden::text
      from public.padron p
      where p.ci::text = termino_input
      limit 50;
  else
    return query
      select p.ci::text, p.nombre, p.apellido, p.seccional, p.local_votacion,
             p.mesa::text, p.orden::text
      from public.padron p
      where p.nombre ilike '%' || termino_input || '%'
         or p.apellido ilike '%' || termino_input || '%'
      order by p.apellido, p.nombre
      limit 50;
  end if;
end;
$$;

revoke all on function public.buscar_padron(text) from public;
grant execute on function public.buscar_padron(text) to anon, authenticated;

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

-- El publico (anon) solo puede insertar su propia consulta. No hay policy
-- de UPDATE/DELETE para nadie salvo el owner de la tabla (postgres), y no
-- hay policy de INSERT/UPDATE/DELETE sobre `padron` en absoluto.
create policy "anon inserta consultas"
  on public.padron_consultas
  for insert
  to anon
  with check (true);

-- Solo un admin logueado (Supabase Auth) puede leer el historial en el dashboard.
create policy "authenticated lee consultas"
  on public.padron_consultas
  for select
  to authenticated
  using (true);
