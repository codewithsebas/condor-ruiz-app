-- Plantillas de los correos automáticos al huésped, editables desde el panel (Correos).
--
-- · email_templates: una fila por correo con los textos que el equipo cambió (asunto, vista previa, título, entrada y nota
--   final; vacío = el texto original) y si está activo. Sin fila, el correo usa sus textos originales y está activo.
-- · Un correo apagado no se encola: el disparador email_outbox_skip_disabled descarta la fila al insertarla, así ninguna
--   de las funciones que encolan correos (confirmación, pago total, reprogramación, cancelación, vencimiento,
--   recordatorio…) tiene que saberlo. El mensaje del equipo (team_message) no tiene plantilla y siempre sale.
-- · El equipo lee; escribe solo el servidor (clave secreta), con el permiso de contenido.

create table public.email_templates (
  kind text primary key check (kind in (
    'reservation_received', 'reservation_confirmed', 'balance_paid', 'reservation_rescheduled', 'reservation_moved',
    'reservation_cancelled', 'reservation_expired', 'arrival_reminder'
  )),
  enabled boolean not null default true,
  subject text not null default '' check (length(subject) <= 150),
  preheader text not null default '' check (length(preheader) <= 200),
  title text not null default '' check (length(title) <= 120),
  intro text not null default '' check (length(intro) <= 1500),
  closing text not null default '' check (length(closing) <= 1000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index email_templates_updated_by_idx on public.email_templates (updated_by);

create trigger email_templates_updated_at before update on public.email_templates
  for each row execute function public.set_updated_at();

alter table public.email_templates enable row level security;
create policy "Equipo lee plantillas de correo" on public.email_templates for select to authenticated using ((select public.is_staff()));
revoke insert, update, delete on public.email_templates from anon, authenticated;
grant select on public.email_templates to authenticated;
grant select, insert, update, delete on public.email_templates to service_role;

-- Registro de actividad: quién cambió una plantilla.
create trigger email_templates_activity after insert or update or delete on public.email_templates
  for each row execute function public.log_activity_change('kind', 'kind');

-- Un correo apagado no se encola.
create function public.skip_disabled_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.email_templates t where t.kind = new.kind and not t.enabled) then
    return null;
  end if;
  return new;
end;
$$;

revoke execute on function public.skip_disabled_email() from public, anon, authenticated;

create trigger email_outbox_skip_disabled before insert on public.email_outbox
  for each row execute function public.skip_disabled_email();
