-- Un pago recibido por el equipo se puede dividir entre efectivo y transferencia.
--
-- · El medio de un pago del equipo queda en payments.method ('cash' o 'transfer'), no solo en la nota.
-- · apply_payment recibe p_cash: la parte en efectivo de un pago dividido (lo demás es transferencia). Cada cabaña recibe su
--   parte como siempre y esa parte se registra en una fila por medio (un pago dividido de una cabaña son dos filas, con el
--   mismo tipo: abono, total o saldo). La nota de cada fila empieza por su medio: «Efectivo · …», «Transferencia · …».
-- · register_manual_payment recibe el medio (p_method: cash, transfer o both) y la parte en efectivo (p_cash, con both).
--   Sin medio, como antes: la nota llega tal cual (así siguen entrando las operaciones guardadas sin conexión antes de esto).

drop function if exists public.register_manual_payment(text, public.payment_kind, text, integer, uuid, timestamptz);
drop function if exists public.apply_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, text);

create function public.apply_payment(
  p_code text,
  p_kind public.payment_kind,
  p_note text default '',
  p_amount integer default null,
  p_op_id uuid default null,
  p_occurred_at timestamptz default null,
  p_provider text default 'manual',
  p_method text default '',
  p_cash integer default null
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
  part_method text[];
  part_left integer[];
  j integer := 1;
  rest integer;
  piece integer;
  note text := nullif(trim(coalesce(p_note, '')), '');
  label text;
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

  -- Partes del pago por medio: dividido, primero el efectivo y luego la transferencia; si no, una sola.
  if p_cash is not null then
    if p_provider <> 'manual' or p_cash <= 0 or p_cash >= amt then raise exception 'INVALID_SPLIT' using errcode = 'P0001'; end if;
    part_method := array['cash', 'transfer'];
    part_left := array[p_cash, amt - p_cash];
  else
    part_method := array[left(coalesce(p_method, ''), 40)];
    part_left := array[amt];
  end if;

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

  -- La parte de cada cabaña se toma de las partes por medio, en orden: una fila por cabaña y medio.
  for i in 1..n loop
    continue when share[i] <= 0;
    k := case when grp_rows[i].deposit_paid_at is not null then 'balance' when share[i] >= owed_i[i] then 'full' else 'deposit' end;
    rest := share[i];
    while rest > 0 loop
      while part_left[j] = 0 loop
        j := j + 1;
      end loop;
      piece := least(rest, part_left[j]);
      label := case when p_provider = 'manual' then case part_method[j] when 'cash' then 'Efectivo' when 'transfer' then 'Transferencia' end end;
      insert into public.payments (reference, reservation_code, kind, amount, provider, method, status, status_detail, approved_at, client_op_id)
      values (
        grp_rows[i].code || '-' || case k when 'deposit' then 'A' when 'full' then 'T' else 'S' end || case when p_provider = 'manual' then '-M' else '-W' end || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
        grp_rows[i].code, k, piece, p_provider, part_method[j], 'approved',
        left(coalesce(nullif(concat_ws(' · ', label, note), ''), 'Registrado por el equipo') || case when n > 1 then ' (pago del grupo ' || principal.code || ')' else '' end, 300),
        paid_at,
        case when first_payment then p_op_id end
      );
      first_payment := false;
      part_left[j] := part_left[j] - piece;
      rest := rest - piece;
    end loop;
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

revoke execute on function public.apply_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, text, integer) from public, anon, authenticated;
grant execute on function public.apply_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, text, integer) to service_role;

-- El pago registrado por el equipo. p_method: cash, transfer o both (con p_cash, la parte en efectivo); vacío, sin medio.
create function public.register_manual_payment(
  p_code text,
  p_kind public.payment_kind,
  p_note text default '',
  p_amount integer default null,
  p_op_id uuid default null,
  p_occurred_at timestamptz default null,
  p_method text default '',
  p_cash integer default null
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
  if coalesce(p_method, '') not in ('', 'cash', 'transfer', 'both') or ((p_method = 'both') <> (p_cash is not null)) then
    raise exception 'INVALID_SPLIT' using errcode = 'P0001';
  end if;
  return public.apply_payment(
    p_code, p_kind, p_note, p_amount, p_op_id, p_occurred_at, 'manual',
    case when p_method = 'both' then '' else coalesce(p_method, '') end,
    p_cash
  );
end;
$$;

revoke execute on function public.register_manual_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, integer) from public, anon;
grant execute on function public.register_manual_payment(text, public.payment_kind, text, integer, uuid, timestamptz, text, integer) to authenticated, service_role;
