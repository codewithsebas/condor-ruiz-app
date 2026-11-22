-- Pagos en línea con Wompi (tarjeta, PSE, Nequi…), de vuelta sobre el modelo actual de pagos.
--
-- · apply_payment: la lógica de register_manual_payment (reparto en grupos, confirmación, cabaña libre, correos) sin la
--   comprobación de equipo, con el proveedor y el medio de pago. Solo la llaman register_manual_payment (equipo) y
--   settle_online_payment (servidor). Así un pago en línea aprobado hace exactamente lo mismo que uno registrado a mano.
-- · online_payments: cada intento de pago en línea (referencia, valor, estado, transacción de Wompi). No suma a lo
--   pagado: cuando se aprueba, apply_payment crea los pagos aprobados en payments, como uno manual.
-- · settle_online_payment: registra el resultado de un intento (idempotente). Si Wompi aprobó pero la reserva ya no se
--   puede actualizar (p. ej. una reserva sin abono que perdió sus fechas), el intento queda «unapplied» y se avisa al
--   equipo: el dinero llegó y hay que resolverlo a mano. Nunca confirma una reserva sobre fechas ocupadas.
-- · Escriben solo el servidor (clave secreta); el equipo lee los intentos.

-- ───────────── Intentos de pago en línea ─────────────
create table public.online_payments (
  reference text primary key check (reference ~ '^[A-Z0-9-]{3,40}-[ATS]-[A-Z0-9]{6}$'),
  reservation_code text not null references public.reservations (code) on delete cascade,
  kind public.payment_kind not null,
  amount integer not null check (amount > 0),
  provider text not null check (provider in ('wompi', 'simulado')),
  status text not null default 'initiated' check (status in ('initiated', 'pending', 'approved', 'declined', 'error', 'unapplied')),
  tx_id text not null default '' check (length(tx_id) <= 80),
  method text not null default '' check (length(method) <= 40),
  detail text not null default '' check (length(detail) <= 300),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index online_payments_reservation_idx on public.online_payments (reservation_code, created_at desc);

alter table public.online_payments enable row level security;
create policy "Equipo lee pagos en línea" on public.online_payments for select to authenticated using ((select public.is_staff()));
revoke insert, update, delete on public.online_payments from anon, authenticated;

-- ───────────── Lógica compartida de un pago recibido ─────────────
create function public.apply_payment(
  p_code text,
  p_kind public.payment_kind,
  p_note text default '',
  p_amount integer default null,
  p_op_id uuid default null,
  p_occurred_at timestamptz default null,
  p_provider text default 'manual',
  p_method text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reservations;
  principal public.reservations;
  grp text;
  rec public.reservations;
  grp_rows public.reservations[] := '{}';
  pass integer;
  n integer;
  owed_i integer[];
  dep_i integer[];
  share integer[];
  group_owed integer := 0;
  group_dep integer := 0;
  amt integer;
  left_over integer;
  pending boolean;
  covered boolean;
  k public.payment_kind;
  paid_at timestamptz := least(now(), greatest(coalesce(p_occurred_at, now()), now() - interval '30 days'));
  i integer;
  first_payment boolean := true;
  u integer;
begin
  select * into r from public.reservations where code = p_code;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  grp := r.group_code;

  -- Bloqueo de todas las cabañas del grupo; la principal queda primera.
  for rec in
    select * from public.reservations
      where (grp is null and code = p_code) or (grp is not null and group_code = grp and status <> 'cancelled')
      order by (code = coalesce(grp, code)) desc, code
      for update
  loop
    grp_rows := grp_rows || rec;
  end loop;
  n := coalesce(array_length(grp_rows, 1), 0);
  if n = 0 then raise exception 'NOT_APPLICABLE' using errcode = 'P0001'; end if;
  principal := grp_rows[1];

  if p_op_id is not null and exists (select 1 from public.payments where client_op_id = p_op_id) then
    return jsonb_build_object('code', principal.code, 'outcome', 'duplicate', 'amount', 0);
  end if;

  pending := principal.status in ('pending_deposit', 'expired');
  for i in 1..n loop
    if (grp_rows[i].status in ('pending_deposit', 'expired')) <> pending
       or (not pending and grp_rows[i].status not in ('confirmed', 'rescheduled', 'checked_in')) then
      raise exception 'NOT_APPLICABLE' using errcode = 'P0001';
    end if;
    owed_i[i] := greatest((grp_rows[i].quote ->> 'total')::integer - grp_rows[i].paid_amount, 0);
    dep_i[i] := least((grp_rows[i].quote ->> 'deposit')::integer, owed_i[i]);
    group_owed := group_owed + owed_i[i];
    group_dep := group_dep + dep_i[i];
  end loop;
  if group_owed <= 0 or (n = 1 and principal.balance_paid_at is not null) then raise exception 'ALREADY_PAID' using errcode = 'P0001'; end if;

  amt := coalesce(p_amount, case when p_kind = 'deposit' then group_dep else group_owed end);
  if amt <= 0 or amt > group_owed then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;
  covered := amt >= group_owed;

  -- Reparto.
  if covered then
    share := owed_i;
  elsif p_amount is null and p_kind = 'deposit' then
    share := dep_i;
  else
    left_over := amt;
    for i in 1..n loop
      share[i] := floor(owed_i[i]::numeric * amt / group_owed);
      left_over := left_over - share[i];
    end loop;
    -- El sobrante del redondeo es de menos de un peso por cabaña.
    -- Primero a las que sigan debiendo después de recibirlo; si no alcanza, a cualquiera que deba.
    for pass in 1..2 loop
      for i in 1..n loop
        exit when left_over = 0;
        if share[i] < owed_i[i] - (2 - pass) then
          share[i] := share[i] + 1;
          left_over := left_over - 1;
        end if;
      end loop;
    end loop;
  end if;

  for i in 1..n loop
    continue when share[i] <= 0;
    k := case when grp_rows[i].deposit_paid_at is not null then 'balance' when share[i] >= owed_i[i] then 'full' else 'deposit' end;
    insert into public.payments (reference, reservation_code, kind, amount, provider, method, status, status_detail, approved_at, client_op_id)
    values (
      grp_rows[i].code || '-' || case k when 'deposit' then 'A' when 'full' then 'T' else 'S' end || case when p_provider = 'manual' then '-M' else '-W' end || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
      grp_rows[i].code, k, share[i], p_provider, left(coalesce(p_method, ''), 40), 'approved',
      left(coalesce(nullif(trim(p_note), ''), 'Registrado por el equipo') || case when n > 1 then ' (pago del grupo ' || principal.code || ')' else '' end, 300),
      paid_at,
      case when first_payment then p_op_id end
    );
    first_payment := false;
  end loop;

  begin
    -- Una retención que venció pudo perder sus fechas: la restricción de exclusión impide la doble reserva.
    -- La principal al final: su aviso suma lo pagado por todo el grupo.
    for i in reverse n..1 loop
      -- Sin abono no apartaba: al confirmarse toma su cabaña si sigue libre, o la primera libre de su tipo.
      u := grp_rows[i].unit;
      if pending then
        u := public.free_unit(grp_rows[i].cabin_type_id, grp_rows[i].check_in, grp_rows[i].check_out, grp_rows[i].code, '{}', grp_rows[i].unit);
        if u = 0 then raise exception 'NO_AVAILABILITY' using errcode = 'P0001'; end if;
      end if;
      update public.reservations
        set unit = u,
            status = case when pending then 'confirmed'::public.reservation_status else status end,
            deposit_paid_at = case when share[i] > 0 or pending then coalesce(deposit_paid_at, paid_at) else deposit_paid_at end,
            balance_paid_at = case when covered then paid_at else balance_paid_at end,
            paid_amount = paid_amount + share[i]
        where code = grp_rows[i].code;
    end loop;
  exception when exclusion_violation then
    raise exception 'NO_AVAILABILITY' using errcode = 'P0001';
  end;

  if pending then
    insert into public.email_outbox (dedupe_key, kind, reservation_code, to_email)
    values ('reserva-confirmada:' || principal.code, 'reservation_confirmed', principal.code, principal.guest_email)
    on conflict (dedupe_key) do nothing;
  elsif covered and grp is not null and principal.source <> 'import' and position('@' in coalesce(principal.guest_email, '')) > 1 then
    insert into public.email_outbox (dedupe_key, kind, reservation_code, to_email)
    values ('pago-total:' || principal.code || ':' || (principal.paid_amount + share[1]), 'balance_paid', principal.code, principal.guest_email)
    on conflict (dedupe_key) do nothing;
  end if;

  return jsonb_build_object(
    'code', principal.code,
    'outcome', case when pending then 'confirmed' when covered then 'balance_paid' else 'partial' end,
    'amount', amt
  );
end;
$$;

revoke execute on function public.apply_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.apply_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, text) to service_role;

-- El pago registrado por el equipo: misma firma y permisos de siempre, ahora sobre apply_payment.
create or replace function public.register_manual_payment(
  p_code text,
  p_kind public.payment_kind,
  p_note text default '',
  p_amount integer default null,
  p_op_id uuid default null,
  p_occurred_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return public.apply_payment(p_code, p_kind, p_note, p_amount, p_op_id, p_occurred_at, 'manual', '');
end;
$$;

-- ───────────── Resultado de un pago en línea ─────────────
create function public.settle_online_payment(
  p_reference text,
  p_tx_id text,
  p_status text,
  p_method text default '',
  p_detail text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.online_payments;
  res jsonb;
  err text;
  label text;
begin
  select * into a from public.online_payments where reference = p_reference for update;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  -- Ya resuelto: Wompi reintenta los eventos y el huésped puede recargar la página de retorno.
  if a.status in ('approved', 'declined', 'error', 'unapplied') then
    return jsonb_build_object('found', true, 'code', a.reservation_code, 'status', a.status, 'changed', false);
  end if;
  if p_status not in ('pending', 'approved', 'declined', 'error') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  if p_status <> 'approved' then
    update public.online_payments
      set status = p_status, tx_id = left(coalesce(p_tx_id, ''), 80), method = left(coalesce(p_method, ''), 40),
          detail = left(coalesce(p_detail, ''), 300), settled_at = case when p_status = 'pending' then null else now() end
      where reference = p_reference;
    return jsonb_build_object('found', true, 'code', a.reservation_code, 'status', p_status, 'changed', p_status <> a.status);
  end if;

  label := case when a.provider = 'wompi' then 'Wompi' else 'Pago simulado' end
    || case when coalesce(p_method, '') <> '' then ' · ' || p_method else '' end;
  begin
    res := public.apply_payment(a.reservation_code, a.kind, 'Pago en línea · ' || label || ' · ' || a.reference, a.amount, null, now(), a.provider, p_method);
    update public.online_payments
      set status = 'approved', tx_id = left(coalesce(p_tx_id, ''), 80), method = left(coalesce(p_method, ''), 40),
          detail = left(coalesce(p_detail, ''), 300), settled_at = now()
      where reference = p_reference;
    return jsonb_build_object('found', true, 'code', a.reservation_code, 'status', 'approved', 'changed', true, 'outcome', res ->> 'outcome');
  exception when others then
    err := sqlerrm;
  end;

  -- El dinero llegó pero la reserva no se pudo actualizar: queda por revisar y se avisa al equipo.
  update public.online_payments
    set status = 'unapplied', tx_id = left(coalesce(p_tx_id, ''), 80), method = left(coalesce(p_method, ''), 40),
        detail = left('Aprobado sin aplicar (' || err || ')', 300), settled_at = now()
    where reference = p_reference;
  insert into public.admin_notifications (kind, title, body, reservation_code)
  values (
    'payment_refund',
    'Pago en línea por revisar · ' || a.reservation_code,
    left('Wompi aprobó un pago de $' || replace(to_char(a.amount, 'FM999,999,999'), ',', '.') || ' (' || a.reference || '), pero la reserva no se pudo actualizar: '
      || case err
           when 'NO_AVAILABILITY' then 'sus fechas ya no están libres'
           when 'ALREADY_PAID' then 'ya estaba pagada'
           when 'INVALID_AMOUNT' then 'el valor supera lo que debía'
           when 'NOT_APPLICABLE' then 'su estado ya no admite pagos'
           else err
         end || '. Regístralo a mano o devuélvelo desde Wompi.', 500),
    a.reservation_code
  );
  return jsonb_build_object('found', true, 'code', a.reservation_code, 'status', 'unapplied', 'changed', true, 'error', err);
end;
$$;

revoke execute on function public.settle_online_payment(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.settle_online_payment(text, text, text, text, text) to service_role;
