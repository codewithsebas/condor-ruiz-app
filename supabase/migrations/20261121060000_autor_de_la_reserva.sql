-- Quién creó cada reserva y cuándo (panel: calendario, tarjetas, modal y página de la reserva).
--
-- · created_by / created_by_name: el empleado que la creó (el nombre queda guardado aunque después se borre su cuenta).
--   Vacíos en las que llegan del sitio web, de Booking o de procesos del sistema: el panel las nombra por su origen.
-- · created_at pasa a ser la hora real: una reserva hecha sin conexión llega al sincronizar, pero se guarda con la hora en
--   que el empleado la hizo (encabezado x-occurred-at, la misma regla del registro de actividad: hasta 30 días atrás y
--   nunca del futuro). Así también conserva su turno entre las reservas sin abono.
-- · Los tres se ponen al insertar (los pone la base, no el navegador) y no cambian después.
-- · Las reservas que ya existen toman el autor y la hora del registro de actividad (desde el 18 de noviembre).

alter table public.reservations
  add column created_by uuid references auth.users (id) on delete set null,
  add column created_by_name text check (length(created_by_name) <= 120);

create index reservations_created_by_idx on public.reservations (created_by);

comment on column public.reservations.created_by is 'Empleado que creó la reserva (vacío: sitio web, Booking o el sistema).';
comment on column public.reservations.created_by_name is 'Nombre del empleado al crearla; se conserva si se borra su cuenta.';

create function public.reservation_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  hdrs jsonb := nullif(current_setting('request.headers', true), '')::jsonb;
  actor uuid;
  sent text;
begin
  -- Después de creada, el autor y la hora no cambian.
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_by_name := old.created_by_name;
    new.created_at := old.created_at;
    return new;
  end if;

  new.created_by := null;
  new.created_by_name := null;
  if claims ->> 'role' = 'authenticated' then
    actor := nullif(claims ->> 'sub', '')::uuid;
  elsif claims ->> 'role' = 'service_role' and coalesce(hdrs ->> 'x-actor-id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    actor := (hdrs ->> 'x-actor-id')::uuid;
  end if;
  if actor is not null then
    select u.id, left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), u.email), 120)
      into new.created_by, new.created_by_name
      from auth.users u where u.id = actor;
  end if;

  -- Hora real de la reserva hecha sin conexión.
  new.created_at := now();
  sent := hdrs ->> 'x-occurred-at';
  if sent ~ '^\d{4}-\d{2}-\d{2}T[0-9:.]+(Z|[+-]\d{2}:?\d{2})$' then
    begin
      if sent::timestamptz between now() - interval '30 days' and now() + interval '1 minute' then new.created_at := least(sent::timestamptz, now()); end if;
    exception when others then null;
    end;
  end if;
  return new;
end;
$$;

revoke execute on function public.reservation_author() from public, anon, authenticated;

create trigger reservations_author before insert or update on public.reservations
  for each row execute function public.reservation_author();

-- Las reservas que ya existen: el autor y la hora de su creación según el registro de actividad. Sin disparadores: no es
-- un cambio de la reserva (ni versión nueva, ni sincronización, ni registro).
alter table public.reservations disable trigger user;

update public.reservations r
set created_by = case when exists (select 1 from auth.users u where u.id = a.actor_id) then a.actor_id end,
    created_by_name = left(coalesce(nullif(btrim(a.actor_name), ''), a.actor_email), 120),
    created_at = least(r.created_at, a.occurred_at)
from (
  select distinct on (entity_id) entity_id, actor_id, actor_name, actor_email, occurred_at
  from public.activity_log
  where entity = 'reservations' and action = 'insert'
  order by entity_id, occurred_at
) a
where a.entity_id = r.code and r.created_by_name is null;

alter table public.reservations enable trigger user;
