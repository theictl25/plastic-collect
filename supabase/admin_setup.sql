-- ==============================================================================
-- Green Point: Admin Setup & Starter Seed SQL
-- Copy and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/inifnbnhuaibhbgubrxw/sql
-- ==============================================================================

-- 1. Enable RLS on all tables
alter table if exists public.users enable row level security;
alter table if exists public.bins enable row level security;
alter table if exists public.waste_types enable row level security;
alter table if exists public.bin_waste_types enable row level security;
alter table if exists public.rewards enable row level security;
alter table if exists public.recycle_transactions enable row level security;
alter table if exists public.point_ledger enable row level security;
alter table if exists public.redemptions enable row level security;

-- 2. Drop any conflicting restrictive policies for Admin access
drop policy if exists "allow read all users" on public.users;
drop policy if exists "allow manage all users" on public.users;
drop policy if exists "allow read all bins" on public.bins;
drop policy if exists "allow manage all bins" on public.bins;
drop policy if exists "allow read all waste types" on public.waste_types;
drop policy if exists "allow manage all waste types" on public.waste_types;
drop policy if exists "allow read all rewards" on public.rewards;
drop policy if exists "allow manage all rewards" on public.rewards;
drop policy if exists "allow read all transactions" on public.recycle_transactions;
drop policy if exists "allow manage all transactions" on public.recycle_transactions;
drop policy if exists "allow read all redemptions" on public.redemptions;
drop policy if exists "allow manage all redemptions" on public.redemptions;
drop policy if exists "allow read all point ledger" on public.point_ledger;
drop policy if exists "allow manage all point ledger" on public.point_ledger;

-- 3. Grant full SELECT & MANAGE policies for authenticated and anon roles for Green Point Demo/Admin
create policy "allow read all users" on public.users for select using (true);
create policy "allow manage all users" on public.users for all using (true) with check (true);

create policy "allow read all bins" on public.bins for select using (true);
create policy "allow manage all bins" on public.bins for all using (true) with check (true);

create policy "allow read all waste types" on public.waste_types for select using (true);
create policy "allow manage all waste types" on public.waste_types for all using (true) with check (true);

create policy "allow read all bin waste types" on public.bin_waste_types for select using (true);
create policy "allow manage all bin waste types" on public.bin_waste_types for all using (true) with check (true);

create policy "allow read all rewards" on public.rewards for select using (true);
create policy "allow manage all rewards" on public.rewards for all using (true) with check (true);

create policy "allow read all transactions" on public.recycle_transactions for select using (true);
create policy "allow manage all transactions" on public.recycle_transactions for all using (true) with check (true);

create policy "allow read all redemptions" on public.redemptions for select using (true);
create policy "allow manage all redemptions" on public.redemptions for all using (true) with check (true);

create policy "allow read all point ledger" on public.point_ledger for select using (true);
create policy "allow manage all point ledger" on public.point_ledger for all using (true) with check (true);

-- 4. Seed Waste Types
insert into public.waste_types (code, name_th, name_en, points_per_kg)
values
  ('plastic', 'พลาสติก', 'Plastic', 10),
  ('paper', 'กระดาษ', 'Paper', 8),
  ('metal', 'โลหะ', 'Metal', 12),
  ('other', 'อื่น ๆ', 'Other', 5)
on conflict (code) do update
set name_th = excluded.name_th,
    name_en = excluded.name_en,
    points_per_kg = excluded.points_per_kg;

-- 5. Seed Smart Bins
insert into public.bins (bin_code, name, latitude, longitude, status, capacity_kg, current_weight_kg, address)
values
  ('BIN-001', 'Green Point – North Gate', 17.9752000, 102.6331000, 'available', 100, 25, 'North Gate Bldg A'),
  ('BIN-002', 'Green Point – Library', 17.9748000, 102.6340000, 'near_full', 100, 78, 'Central Library 1st Fl'),
  ('BIN-003', 'Green Point – Student Center', 17.9745000, 102.6328000, 'available', 100, 15, 'Student Union Cafeteria'),
  ('BIN-004', 'Green Point – Sports Complex', 17.9757000, 102.6350000, 'available', 100, 30, 'Indoor Gym Stadium'),
  ('BIN-005', 'Green Point – Parking Area', 17.9738000, 102.6346000, 'full', 100, 100, 'Zone B Motorcycle Park'),
  ('BIN-006', 'Green Point – Cafeteria East', 17.9739000, 102.6322000, 'available', 100, 45, 'Food Court Exit 2'),
  ('BIN-007', 'Green Point – Dormitory Hall', 17.9760000, 102.6324000, 'maintenance', 100, 35, 'Dormitory Bldg 3')
on conflict (bin_code) do update
set name = excluded.name,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    status = excluded.status,
    capacity_kg = excluded.capacity_kg,
    current_weight_kg = excluded.current_weight_kg,
    address = excluded.address;

-- Link bins to waste types
insert into public.bin_waste_types (bin_id, waste_type_id)
select b.id, w.id
from (values
  ('BIN-001', 'plastic'), ('BIN-002', 'paper'), ('BIN-003', 'plastic'),
  ('BIN-004', 'metal'), ('BIN-005', 'other'), ('BIN-006', 'paper'), ('BIN-007', 'metal')
) as supported(bin_code, waste_code)
join public.bins b on b.bin_code = supported.bin_code
join public.waste_types w on w.code = supported.waste_code
on conflict do nothing;

-- 6. Seed Rewards
insert into public.rewards (name_th, name_en, category, points_cost, image_url, description, stock_quantity, is_active)
values
  ('ชุดอาหารกลางวัน', 'Lunch Set', 'food', 50, '🍱', 'Healthy lunch coupon for cafeteria', 48, true),
  ('เครื่องดื่มน้ำผลไม้', 'Fresh Fruit Drink', 'food', 30, '🥤', 'Refreshing fruit smoothie or juice', 92, true),
  ('กระเป๋าผ้ารักษ์โลก', 'Eco Tote Bag', 'merch', 100, '👜', 'Reusable durable Green Point canvas bag', 15, true),
  ('กระบอกน้ำเก็บความเย็น', 'Insulated Water Bottle', 'merch', 80, '🧴', 'Stainless steel water flask', 24, true),
  ('เสื้อยืดแคมเปญกรีนพอยท์', 'Green Point T-Shirt', 'merch', 150, '👕', 'Eco cotton limited edition shirt', 20, true),
  ('บัตรกำนัลร้านค้าพันธมิตร', 'Campus Partner Voucher', 'discount', 200, '🎟️', 'Special store discount voucher', 35, true)
on conflict do nothing;

-- 7. Seed Demo Users (if not exists)
insert into public.users (id, email, phone, display_name, points_balance)
values
  ('a0000000-0000-0000-0000-000000000001', 'somsak.k@example.com', '+856 20 5551 2345', 'Somsak Keomany', 1420),
  ('a0000000-0000-0000-0000-000000000002', 'noy.silap@example.com', '+856 20 5223 8899', 'Noy Silaphet', 890),
  ('a0000000-0000-0000-0000-000000000003', 'da.kham@example.com', '+856 20 9988 7766', 'Da Khamvong', 640),
  ('a0000000-0000-0000-0000-000000000004', 'kham.v@example.com', '+856 20 7711 3344', 'Kham Vongphachanh', 120),
  ('a0000000-0000-0000-0000-000000000005', 'may.lisa@example.com', '+856 20 5432 1098', 'May Lisa', 450)
on conflict (id) do update
set display_name = excluded.display_name,
    points_balance = excluded.points_balance,
    phone = excluded.phone;

-- 8. Seed Demo Transactions (Verification / History)
insert into public.recycle_transactions (id, user_id, bin_id, waste_type_id, points_awarded, verification_status, scanned_at, photo_url)
select
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  b.id,
  w.id,
  10,
  'pending',
  now() - interval '5 minutes',
  'https://images.unsplash.com/photo-1574974671999-24b7df56f539?w=600&auto=format&fit=crop&q=80'
from public.bins b, public.waste_types w
where b.bin_code = 'BIN-003' and w.code = 'plastic'
on conflict do nothing;

insert into public.recycle_transactions (id, user_id, bin_id, waste_type_id, points_awarded, verification_status, scanned_at, photo_url)
select
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  b.id,
  w.id,
  8,
  'pending',
  now() - interval '18 minutes',
  'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&auto=format&fit=crop&q=80'
from public.bins b, public.waste_types w
where b.bin_code = 'BIN-002' and w.code = 'paper'
on conflict do nothing;

insert into public.recycle_transactions (id, user_id, bin_id, waste_type_id, points_awarded, verification_status, scanned_at, photo_url)
select
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000005',
  b.id,
  w.id,
  12,
  'approved',
  now() - interval '1 hour',
  'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600&auto=format&fit=crop&q=80'
from public.bins b, public.waste_types w
where b.bin_code = 'BIN-004' and w.code = 'metal'
on conflict do nothing;

-- 9. Seed Demo Redemptions
insert into public.redemptions (id, user_id, reward_id, points_spent, redemption_code, status, redeemed_at)
select
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  r.id,
  50,
  'GP-8F92A1',
  'unclaimed',
  now() - interval '20 minutes'
from public.rewards r
where r.name_en = 'Lunch Set'
on conflict do nothing;

insert into public.redemptions (id, user_id, reward_id, points_spent, redemption_code, status, redeemed_at)
select
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  r.id,
  30,
  'GP-3C44B9',
  'claimed',
  now() - interval '2 hours'
from public.rewards r
where r.name_en = 'Fresh Fruit Drink'
on conflict do nothing;
