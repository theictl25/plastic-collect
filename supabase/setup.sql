-- Green Point: run once in the Supabase SQL Editor after creating the tables.
-- This script assumes the schema designed for this project already exists.

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Green Point Member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.users enable row level security;
alter table public.bins enable row level security;
alter table public.waste_types enable row level security;
alter table public.bin_waste_types enable row level security;
alter table public.rewards enable row level security;
alter table public.recycle_transactions enable row level security;
alter table public.point_ledger enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists "users read own profile" on public.users;
create policy "users read own profile" on public.users
for select to authenticated using (id = auth.uid());

drop policy if exists "users update own profile" on public.users;
create policy "users update own profile" on public.users
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "authenticated users read bins" on public.bins;
create policy "authenticated users read bins" on public.bins
for select to authenticated using (true);

drop policy if exists "guests read bins" on public.bins;
create policy "guests read bins" on public.bins
for select to anon using (true);

drop policy if exists "authenticated users read waste types" on public.waste_types;
create policy "authenticated users read waste types" on public.waste_types
for select to authenticated using (true);

drop policy if exists "authenticated users read bin waste types" on public.bin_waste_types;
create policy "authenticated users read bin waste types" on public.bin_waste_types
for select to authenticated using (true);

drop policy if exists "authenticated users read rewards" on public.rewards;
create policy "authenticated users read rewards" on public.rewards
for select to authenticated using (is_active = true);

drop policy if exists "guests read rewards" on public.rewards;
create policy "guests read rewards" on public.rewards
for select to anon using (is_active = true);

drop policy if exists "users read own transactions" on public.recycle_transactions;
create policy "users read own transactions" on public.recycle_transactions
for select to authenticated using (user_id = auth.uid());

drop policy if exists "users read own points" on public.point_ledger;
create policy "users read own points" on public.point_ledger
for select to authenticated using (user_id = auth.uid());

drop policy if exists "users read own redemptions" on public.redemptions;
create policy "users read own redemptions" on public.redemptions
for select to authenticated using (user_id = auth.uid());

create or replace function public.record_recycling(p_bin_code text, p_waste_type text default 'plastic')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bin public.bins%rowtype;
  v_waste_type_id smallint;
  v_transaction_id uuid;
  v_points integer := 10;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  select * into v_bin from public.bins where bin_code = upper(trim(p_bin_code));
  if not found or v_bin.status <> 'available' then
    raise exception 'This bin is unavailable.';
  end if;

  select wt.id into v_waste_type_id
  from public.waste_types wt
  join public.bin_waste_types bwt on bwt.waste_type_id = wt.id
  where bwt.bin_id = v_bin.id and wt.code = lower(trim(p_waste_type)) and wt.is_active;
  if v_waste_type_id is null then
    raise exception 'This bin does not accept that waste type.';
  end if;

  if exists (
    select 1 from public.recycle_transactions
    where user_id = v_user_id and bin_id = v_bin.id and scanned_at > now() - interval '1 minute'
  ) then
    raise exception 'Please wait one minute before recording this bin again.';
  end if;

  insert into public.recycle_transactions
    (user_id, bin_id, waste_type_id, points_awarded, verification_status, verified_at)
  values (v_user_id, v_bin.id, v_waste_type_id, v_points, 'auto_approved', now())
  returning id into v_transaction_id;

  update public.users
  set points_balance = points_balance + v_points, updated_at = now()
  where id = v_user_id
  returning points_balance into v_balance;

  insert into public.point_ledger (user_id, action, points_delta, recycle_transaction_id, note)
  values (v_user_id, 'earn_recycle', v_points, v_transaction_id, v_bin.bin_code || ' · ' || lower(trim(p_waste_type)));

  return jsonb_build_object('transaction_id', v_transaction_id, 'points_awarded', v_points, 'points_balance', v_balance);
end;
$$;

create or replace function public.redeem_reward(p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_redemption_id uuid;
  v_code text;
begin
  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id and is_active for update;
  if not found then raise exception 'Reward is unavailable.'; end if;
  if v_reward.stock_quantity is not null and v_reward.stock_quantity <= 0 then raise exception 'Reward is out of stock.'; end if;

  select points_balance into v_balance from public.users where id = v_user_id for update;
  if v_balance < v_reward.points_cost then raise exception 'Not enough points.'; end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.redemptions (user_id, reward_id, points_spent, redemption_code)
  values (v_user_id, v_reward.id, v_reward.points_cost, v_code)
  returning id into v_redemption_id;

  update public.users set points_balance = points_balance - v_reward.points_cost, updated_at = now()
  where id = v_user_id returning points_balance into v_balance;

  if v_reward.stock_quantity is not null then
    update public.rewards set stock_quantity = stock_quantity - 1 where id = v_reward.id;
  end if;

  insert into public.point_ledger (user_id, action, points_delta, redemption_id, note)
  values (v_user_id, 'redeem_reward', -v_reward.points_cost, v_redemption_id, coalesce(v_reward.name_en, v_reward.name_th));

  return jsonb_build_object('redemption_id', v_redemption_id, 'redemption_code', v_code, 'points_balance', v_balance);
end;
$$;

grant execute on function public.record_recycling(text, text) to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
