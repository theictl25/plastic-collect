-- ==============================================================================
-- 🌿 Green Point: Complete Database Schema, Security (RLS), Functions & Seed
-- Project: plastic_collect_v1
-- Instruction: Run this entire script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/inifnbnhuaibhbgubrxw/sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ------------------------------------------------------------------------------

-- 2.1 USERS PROFILE (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  display_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'staff', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  points_balance integer not null default 0 check (points_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 WASTE TYPES (plastic, paper, metal, other)
create table if not exists public.waste_types (
  id smallserial primary key,
  code text not null unique check (code in ('plastic', 'paper', 'metal', 'other')),
  name_th text not null,
  name_en text not null,
  points_per_kg integer not null default 10 check (points_per_kg > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2.3 SMART BINS & COLLECTION STATIONS
create table if not exists public.bins (
  id uuid primary key default gen_random_uuid(),
  bin_code text not null unique,
  name text not null,
  latitude double precision not null default 17.9752000,
  longitude double precision not null default 102.6331000,
  status text not null default 'available' check (status in ('available', 'near_full', 'full', 'maintenance')),
  capacity_kg integer not null default 100 check (capacity_kg > 0),
  current_weight_kg double precision not null default 0 check (current_weight_kg >= 0),
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.4 BIN ACCEPTED WASTE TYPES (Junction Table)
create table if not exists public.bin_waste_types (
  bin_id uuid not null references public.bins(id) on delete cascade,
  waste_type_id smallint not null references public.waste_types(id) on delete cascade,
  primary key (bin_id, waste_type_id)
);

-- 2.5 REWARDS CATALOG
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  category text not null check (category in ('food', 'merch', 'discount')),
  points_cost integer not null check (points_cost > 0),
  image_url text not null default '🎁',
  description text,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.6 RECYCLE TRANSACTIONS (Disposal records & Photo Proof)
create table if not exists public.recycle_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bin_id uuid not null references public.bins(id) on delete restrict,
  waste_type_id smallint not null references public.waste_types(id) on delete restrict,
  weight_kg double precision default 0.1 check (weight_kg >= 0),
  points_awarded integer not null default 10 check (points_awarded >= 0),
  verification_status text not null default 'auto_approved' check (verification_status in ('pending', 'approved', 'rejected', 'auto_approved')),
  photo_url text,
  rejection_reason text,
  scanned_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references public.users(id) on delete set null
);

-- 2.7 REWARD REDEMPTIONS
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  points_spent integer not null check (points_spent > 0),
  redemption_code text not null unique,
  status text not null default 'unclaimed' check (status in ('unclaimed', 'claimed', 'cancelled', 'expired')),
  redeemed_at timestamptz not null default now(),
  claimed_at timestamptz
);

-- 2.8 POINTS AUDIT LEDGER (Immutable point history)
create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  points_delta integer not null,
  recycle_transaction_id uuid references public.recycle_transactions(id) on delete set null,
  redemption_id uuid references public.redemptions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- 2.9 SYSTEM CONFIGURATION (Points Multiplier, Anti-Fraud, Alert thresholds)
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ------------------------------------------------------------------------------
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_bins_code on public.bins(bin_code);
create index if not exists idx_bins_status on public.bins(status);
create index if not exists idx_rewards_active on public.rewards(is_active);
create index if not exists idx_recycle_tx_user on public.recycle_transactions(user_id);
create index if not exists idx_recycle_tx_status on public.recycle_transactions(verification_status);
create index if not exists idx_redemptions_user on public.redemptions(user_id);
create index if not exists idx_redemptions_code on public.redemptions(redemption_code);
create index if not exists idx_point_ledger_user on public.point_ledger(user_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ------------------------------------------------------------------------------

-- Enable RLS
alter table public.users enable row level security;
alter table public.bins enable row level security;
alter table public.waste_types enable row level security;
alter table public.bin_waste_types enable row level security;
alter table public.rewards enable row level security;
alter table public.recycle_transactions enable row level security;
alter table public.redemptions enable row level security;
alter table public.point_ledger enable row level security;
alter table public.system_settings enable row level security;

-- Helper function: Is current user an Admin or Staff?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('admin', 'staff')
      and status = 'active'
  );
$$;

-- Drop existing old policies to prevent duplicates
drop policy if exists "users_read_profile" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "admin_manage_users" on public.users;

drop policy if exists "bins_read_all" on public.bins;
drop policy if exists "admin_manage_bins" on public.bins;

drop policy if exists "waste_types_read_all" on public.waste_types;
drop policy if exists "admin_manage_waste_types" on public.waste_types;

drop policy if exists "bin_waste_types_read_all" on public.bin_waste_types;
drop policy if exists "admin_manage_bin_waste_types" on public.bin_waste_types;

drop policy if exists "rewards_read_active" on public.rewards;
drop policy if exists "admin_manage_rewards" on public.rewards;

drop policy if exists "transactions_read_policy" on public.recycle_transactions;
drop policy if exists "transactions_insert_policy" on public.recycle_transactions;
drop policy if exists "admin_manage_transactions" on public.recycle_transactions;

drop policy if exists "redemptions_read_policy" on public.redemptions;
drop policy if exists "admin_manage_redemptions" on public.redemptions;

drop policy if exists "point_ledger_read_policy" on public.point_ledger;
drop policy if exists "admin_manage_point_ledger" on public.point_ledger;

drop policy if exists "system_settings_read" on public.system_settings;
drop policy if exists "admin_manage_settings" on public.system_settings;

-- 4.1 USERS POLICIES
-- Users can read own profile; Admins can read all profiles
create policy "users_read_profile" on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy "users_update_own" on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin_manage_users" on public.users
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.2 BINS POLICIES (Public read for Map & Navigation)
create policy "bins_read_all" on public.bins
  for select using (true);

create policy "admin_manage_bins" on public.bins
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.3 WASTE TYPES POLICIES
create policy "waste_types_read_all" on public.waste_types
  for select using (true);

create policy "admin_manage_waste_types" on public.waste_types
  for all using (public.is_admin())
  with check (public.is_admin());

create policy "bin_waste_types_read_all" on public.bin_waste_types
  for select using (true);

create policy "admin_manage_bin_waste_types" on public.bin_waste_types
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.4 REWARDS POLICIES
create policy "rewards_read_active" on public.rewards
  for select using (is_active = true or public.is_admin());

create policy "admin_manage_rewards" on public.rewards
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.5 TRANSACTIONS POLICIES
create policy "transactions_read_policy" on public.recycle_transactions
  for select using (user_id = auth.uid() or public.is_admin());

create policy "transactions_insert_policy" on public.recycle_transactions
  for insert with check (user_id = auth.uid());

create policy "admin_manage_transactions" on public.recycle_transactions
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.6 REDEMPTIONS POLICIES
create policy "redemptions_read_policy" on public.redemptions
  for select using (user_id = auth.uid() or public.is_admin());

create policy "admin_manage_redemptions" on public.redemptions
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.7 POINT LEDGER POLICIES
create policy "point_ledger_read_policy" on public.point_ledger
  for select using (user_id = auth.uid() or public.is_admin());

create policy "admin_manage_point_ledger" on public.point_ledger
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4.8 SYSTEM SETTINGS POLICIES
create policy "system_settings_read" on public.system_settings
  for select using (true);

create policy "admin_manage_settings" on public.system_settings
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. AUTOMATED TRIGGERS & FUNCTIONS
-- ------------------------------------------------------------------------------

-- 5.1 Auto-create Profile when user signs up in Auth
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'member';
begin
  -- First registered user automatically becomes Admin
  if not exists (select 1 from public.users) then
    v_role := 'admin';
  elsif new.email like '%admin%' then
    v_role := 'admin';
  end if;

  insert into public.users (id, email, phone, display_name, avatar_url, role, points_balance)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'member'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    v_role,
    0
  )
  on conflict (id) do update
  set email = excluded.email,
      phone = coalesce(excluded.phone, public.users.phone),
      display_name = coalesce(excluded.display_name, public.users.display_name),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

-- Backfill profiles for existing accounts
insert into public.users (id, email, phone, display_name, avatar_url, role, points_balance)
select
  id,
  email,
  phone,
  coalesce(raw_user_meta_data ->> 'display_name', split_part(coalesce(email, 'member'), '@', 1)),
  raw_user_meta_data ->> 'avatar_url',
  case when email like '%admin%' then 'admin' else 'member' end,
  0
from auth.users
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 6. RPC STORED PROCEDURES (Atomic Business Operations)
-- ------------------------------------------------------------------------------

-- 6.1 RECORD RECYCLING (Scans QR, Awards Points, Increments Bin Load)
create or replace function public.record_recycling(
  p_bin_code text,
  p_waste_type text default 'plastic',
  p_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bin public.bins%rowtype;
  v_waste_type public.waste_types%rowtype;
  v_transaction_id uuid;
  v_points integer;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required. Please sign in.';
  end if;

  -- 1. Validate Bin
  select * into v_bin from public.bins where bin_code = upper(trim(p_bin_code));
  if not found or v_bin.status not in ('available', 'near_full') then
    raise exception 'Bin % is currently unavailable or full.', p_bin_code;
  end if;

  -- 2. Validate Waste Type
  select * into v_waste_type from public.waste_types
  where code = lower(trim(p_waste_type)) and is_active = true;
  if not found then
    raise exception 'Invalid or inactive waste type: %', p_waste_type;
  end if;

  -- 3. Anti-Fraud Cooldown (60 seconds)
  if exists (
    select 1 from public.recycle_transactions
    where user_id = v_user_id and bin_id = v_bin.id and scanned_at > now() - interval '60 seconds'
  ) then
    raise exception 'Cooldown active: Please wait 60 seconds before scanning this bin again.';
  end if;

  v_points := v_waste_type.points_per_kg;

  -- 4. Record Transaction
  insert into public.recycle_transactions (
    user_id, bin_id, waste_type_id, weight_kg, points_awarded,
    verification_status, photo_url, verified_at
  )
  values (
    v_user_id, v_bin.id, v_waste_type.id, 0.1, v_points,
    'auto_approved', p_photo_url, now()
  )
  returning id into v_transaction_id;

  -- 5. Update Bin weight load
  update public.bins
  set current_weight_kg = current_weight_kg + 0.1,
      status = case
        when current_weight_kg + 0.1 >= capacity_kg then 'full'
        when current_weight_kg + 0.1 >= capacity_kg * 0.8 then 'near_full'
        else status
      end,
      updated_at = now()
  where id = v_bin.id;

  -- 6. Credit points to user
  update public.users
  set points_balance = points_balance + v_points, updated_at = now()
  where id = v_user_id
  returning points_balance into v_balance;

  -- 7. Add to Point Ledger
  insert into public.point_ledger (user_id, action, points_delta, recycle_transaction_id, note)
  values (
    v_user_id, 'earn_recycle', v_points, v_transaction_id,
    v_bin.bin_code || ' · ' || v_waste_type.name_en
  );

  return jsonb_build_object(
    'transaction_id', v_transaction_id,
    'points_awarded', v_points,
    'points_balance', v_balance,
    'bin_code', v_bin.bin_code
  );
end;
$$;

-- 6.2 REDEEM REWARD
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
    raise exception 'Authentication required. Please sign in.';
  end if;

  -- Lock Reward row for stock check
  select * into v_reward from public.rewards where id = p_reward_id and is_active = true for update;
  if not found then
    raise exception 'Reward is unavailable or inactive.';
  end if;
  if v_reward.stock_quantity is not null and v_reward.stock_quantity <= 0 then
    raise exception 'Reward is out of stock.';
  end if;

  -- Lock User row for balance check
  select points_balance into v_balance from public.users where id = v_user_id for update;
  if v_balance < v_reward.points_cost then
    raise exception 'Insufficient points. Required: %, Available: %', v_reward.points_cost, v_balance;
  end if;

  -- Generate unique claim voucher code
  v_code := 'GP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  -- Insert Redemption record
  insert into public.redemptions (user_id, reward_id, points_spent, redemption_code, status, redeemed_at)
  values (v_user_id, v_reward.id, v_reward.points_cost, v_code, 'unclaimed', now())
  returning id into v_redemption_id;

  -- Deduct user points
  update public.users
  set points_balance = points_balance - v_reward.points_cost, updated_at = now()
  where id = v_user_id
  returning points_balance into v_balance;

  -- Decrement stock if finite
  if v_reward.stock_quantity is not null then
    update public.rewards
    set stock_quantity = stock_quantity - 1, updated_at = now()
    where id = v_reward.id;
  end if;

  -- Record in Ledger
  insert into public.point_ledger (user_id, action, points_delta, redemption_id, note)
  values (v_user_id, 'redeem_reward', -v_reward.points_cost, v_redemption_id, coalesce(v_reward.name_en, v_reward.name_th));

  return jsonb_build_object(
    'redemption_id', v_redemption_id,
    'redemption_code', v_code,
    'points_balance', v_balance,
    'reward_name', v_reward.name_en
  );
end;
$$;

-- 6.3 ADMIN EMPTY BIN
create or replace function public.admin_empty_bin(p_bin_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bin public.bins%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin or Staff privileges required.';
  end if;

  update public.bins
  set current_weight_kg = 0,
      status = 'available',
      updated_at = now()
  where bin_code = upper(trim(p_bin_code))
  returning * into v_bin;

  return jsonb_build_object('success', true, 'bin_code', v_bin.bin_code, 'status', v_bin.status);
end;
$$;

-- 6.4 ADMIN ADJUST USER POINTS
create or replace function public.admin_adjust_points(
  p_user_id uuid,
  p_delta integer,
  p_note text default 'Admin manual adjustment'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin or Staff privileges required.';
  end if;

  update public.users
  set points_balance = greatest(0, points_balance + p_delta),
      updated_at = now()
  where id = p_user_id
  returning points_balance into v_new_balance;

  insert into public.point_ledger (user_id, action, points_delta, note)
  values (p_user_id, case when p_delta >= 0 then 'admin_grant' else 'admin_deduct' end, p_delta, p_note);

  return jsonb_build_object('success', true, 'user_id', p_user_id, 'points_balance', v_new_balance);
end;
$$;

-- Grant execution permissions
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.record_recycling(text, text, text) to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.admin_empty_bin(text) to authenticated;
grant execute on function public.admin_adjust_points(uuid, integer, text) to authenticated;

-- ------------------------------------------------------------------------------
-- 7. INITIAL STARTER SEED DATA
-- ------------------------------------------------------------------------------

-- 7.1 Waste Types
insert into public.waste_types (code, name_th, name_en, points_per_kg)
values
  ('plastic', 'พลาสติก (ขวด PET)', 'Plastic Bottle', 10),
  ('paper', 'กระดาษและลัง', 'Paper & Carton', 8),
  ('metal', 'โลหะและกระป๋องอลูมิเนียม', 'Metal & Can', 12),
  ('other', 'ขยะรีไซเคิลอื่นๆ', 'Other Recyclables', 5)
on conflict (code) do update
set name_th = excluded.name_th,
    name_en = excluded.name_en,
    points_per_kg = excluded.points_per_kg;

-- 7.2 Smart Bins
insert into public.bins (bin_code, name, latitude, longitude, status, capacity_kg, current_weight_kg, address)
values
  ('BIN-001', 'Green Point – North Gate', 17.9752000, 102.6331000, 'available', 100, 25.0, 'North Gate Bldg A'),
  ('BIN-002', 'Green Point – Library', 17.9748000, 102.6340000, 'near_full', 100, 78.0, 'Central Library 1st Fl'),
  ('BIN-003', 'Green Point – Student Center', 17.9745000, 102.6328000, 'available', 100, 15.0, 'Student Union Cafeteria'),
  ('BIN-004', 'Green Point – Sports Complex', 17.9757000, 102.6350000, 'available', 100, 30.0, 'Indoor Gym Stadium'),
  ('BIN-005', 'Green Point – Parking Area', 17.9738000, 102.6346000, 'full', 100, 100.0, 'Zone B Motorcycle Park'),
  ('BIN-006', 'Green Point – Cafeteria East', 17.9739000, 102.6322000, 'available', 100, 45.0, 'Food Court Exit 2'),
  ('BIN-007', 'Green Point – Dormitory Hall', 17.9760000, 102.6324000, 'maintenance', 100, 35.0, 'Dormitory Bldg 3')
on conflict (bin_code) do update
set name = excluded.name,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    status = excluded.status,
    capacity_kg = excluded.capacity_kg,
    current_weight_kg = excluded.current_weight_kg,
    address = excluded.address;

-- Link Bins to Waste Types
insert into public.bin_waste_types (bin_id, waste_type_id)
select b.id, w.id
from (values
  ('BIN-001', 'plastic'), ('BIN-002', 'paper'), ('BIN-003', 'plastic'),
  ('BIN-004', 'metal'), ('BIN-005', 'other'), ('BIN-006', 'paper'), ('BIN-007', 'metal')
) as mapping(bin_code, waste_code)
join public.bins b on b.bin_code = mapping.bin_code
join public.waste_types w on w.code = mapping.waste_code
on conflict do nothing;

-- 7.3 Rewards
insert into public.rewards (name_th, name_en, category, points_cost, image_url, description, stock_quantity, is_active)
values
  ('ชุดอาหารกลางวัน', 'Lunch Set', 'food', 50, '🍱', 'Healthy nutritious lunch set coupon for cafeteria', 48, true),
  ('เครื่องดื่มน้ำผลไม้', 'Fresh Fruit Drink', 'food', 30, '🥤', 'Refreshing fruit smoothie or juice at participating stalls', 92, true),
  ('กระเป๋าผ้ารักษ์โลก', 'Eco Tote Bag', 'merch', 100, '👜', 'Durable Green Point organic canvas tote bag', 15, true),
  ('กระบอกน้ำเก็บความเย็น', 'Insulated Water Bottle', 'merch', 80, '🧴', 'Stainless steel eco flask to reduce single-use plastic', 24, true),
  ('เสื้อยืดกรีนพอยท์', 'Green Point T-Shirt', 'merch', 150, '👕', 'Eco cotton official campaign t-shirt', 20, true),
  ('บัตรกำนัลร้านค้าพันธมิตร', 'Campus Partner Voucher', 'discount', 200, '🎟️', 'Special gift voucher for bookstores and campus cafes', 35, true),
  ('ร่มพับรักษ์โลก', 'Eco Umbrella', 'merch', 120, '☂️', 'Compact umbrella made from recycled PET fabric', 18, true),
  ('กล่องข้าวอาหารรักษ์โลก', 'Reusable Lunch Box', 'merch', 100, '🥡', 'BPA-free microwave safe food container', 25, true)
on conflict do nothing;

-- 7.4 System Settings Defaults
insert into public.system_settings (key, value, description)
values
  ('cooldown_seconds', '60'::jsonb, 'Cooldown period between scans for same bin in seconds'),
  ('daily_point_cap', '300'::jsonb, 'Maximum daily points accumulation per member'),
  ('alert_threshold_near_full', '80'::jsonb, 'Percentage capacity trigger for near-full warning'),
  ('alert_threshold_critical', '95'::jsonb, 'Percentage capacity trigger for critical full alarm'),
  ('organization_profile', '{"name": "Green Point Campus", "contact_email": "support@greenpoint.org"}'::jsonb, 'Campus organization details')
on conflict (key) do update
set value = excluded.value,
    description = excluded.description;
