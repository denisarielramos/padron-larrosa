-- ── buscar_padron: busqueda de nombres sin distinguir acentos ni ñ ────────
-- Antes, la busqueda por nombre/apellido usaba solo ILIKE: ignoraba
-- mayusculas/minusculas pero NO acentos ni la ñ ("Jose" no encontraba
-- "JOSÉ", "Pena" no encontraba "PEÑA").
--
-- Ahora la comparacion de nombre/apellido es:
--   - case-insensitive (ILIKE, igual que antes)
--   - accent-insensitive (unaccent: á→a, é→e, ü→u, ...)
--   - ñ/n insensitive (unaccent: ñ→n, Ñ→N)
-- aplicando unaccent de ambos lados: al texto del padron y a cada palabra
-- buscada.
--
-- Todo lo demas queda igual: firma, columnas devueltas, SECURITY DEFINER,
-- search_path, busqueda numerica por CI, escape de %, _ y \, "todas las
-- palabras deben coincidir en cualquier orden", orden y limite de 50, y
-- permisos.

create extension if not exists unaccent with schema extensions;

-- La funcion referencia extensions.unaccent de forma explicita. Si unaccent
-- ya estaba instalada en otro schema, el "if not exists" de arriba no la
-- mueve y la busqueda fallaria en tiempo de ejecucion: mejor fallar aca.
do $$
begin
  if not exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'unaccent' and n.nspname = 'extensions'
  ) then
    raise exception 'La extension unaccent debe estar instalada en el schema "extensions".';
  end if;
end;
$$;

create or replace function public.buscar_padron(termino_input text)
returns table (
  ci text,
  nombre text,
  apellido text,
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
        select p.ci::text, p.nombre, p.apellido, p.local_votacion,
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
  --
  -- Cada palabra pasa primero por unaccent y DESPUES se escapa, para que el
  -- escape de %, _ y \ sea siempre lo ultimo que se aplica al patron.
  raw_tokens := regexp_split_to_array(trim(both from termino_input), '\s+');
  esc_tokens := array(
    select replace(replace(replace(
             extensions.unaccent(tok),
             '\', '\\'), '%', '\%'), '_', '\_')
    from unnest(raw_tokens) as tok
    where length(trim(tok)) > 0
  );

  if esc_tokens is null or array_length(esc_tokens, 1) is null then
    return;
  end if;

  return query
    select p.ci::text, p.nombre, p.apellido, p.local_votacion,
           p.mesa::text, p.orden::text
    from public.padron p
    where not exists (
      select 1
      from unnest(esc_tokens) as tok
      where extensions.unaccent(coalesce(p.nombre, '') || ' ' || coalesce(p.apellido, ''))
            not ilike '%' || tok || '%' escape '\'
    )
    order by p.apellido, p.nombre
    limit 50;
end;
$$;

revoke all on function public.buscar_padron(text) from public;
revoke all on function public.buscar_padron(text) from anon;
revoke all on function public.buscar_padron(text) from authenticated;
grant execute on function public.buscar_padron(text) to service_role;
