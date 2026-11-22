-- Decoraciones con costo: catálogo que el equipo administra (panel → Decoraciones) y que se agrega, opcional, a una
-- reserva al reservar en el sitio o desde el panel.
--
-- · decorations: nombre, descripción, precio fijo por reserva, visible (en el sitio y para elegir) y orden.
-- · reservations.addons: las decoraciones elegidas como copia { id, name, price } (si después cambia el precio o se
--   borra del catálogo, la reserva conserva lo acordado). En una reserva con varias cabañas van solo en la principal.
-- · El valor se suma a quote.total y queda en quote.addons. El abono no cambia (se calcula sobre el alojamiento): la
--   decoración se paga con el saldo. Las funciones de pagos ya leen quote.total y quote.deposit, así que no cambian.

create table public.decorations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 60),
  description text not null default '' check (length(description) <= 200),
  price integer not null check (price between 0 and 20000000),
  visible boolean not null default true,
  sort integer not null default 0,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index decorations_sort_idx on public.decorations (sort);

create trigger decorations_updated_at before update on public.decorations
  for each row execute function public.set_updated_at();
create trigger decorations_version before update on public.decorations
  for each row execute function public.bump_version();
create trigger decorations_sync after insert or update or delete on public.decorations
  for each row execute function public.log_sync_change('site', 'id', 'parent');
create trigger decorations_activity after insert or update or delete on public.decorations
  for each row execute function public.log_activity_change('id', 'name');

alter table public.decorations enable row level security;
create policy "Equipo lee las decoraciones" on public.decorations for select to authenticated using ((select public.is_staff()));
create policy "Administradores gestionan las decoraciones" on public.decorations for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.decorations from anon;
grant select, insert, update, delete on public.decorations to authenticated, service_role;

alter table public.reservations
  add column addons jsonb not null default '[]'::jsonb;

alter table public.reservations
  add constraint reservations_addons_is_array check (jsonb_typeof(addons) = 'array' and jsonb_array_length(addons) <= 30);
