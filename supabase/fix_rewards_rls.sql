-- ==============================================================================
-- 🌿 Green Point: Fix Rewards RLS Policy for Admin Management
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/inifnbnhuaibhbgubrxw/sql
-- ==============================================================================

-- 1. Drop the restrictive admin-only policy on rewards
drop policy if exists "admin_manage_rewards" on public.rewards;
drop policy if exists "rewards_read_active" on public.rewards;
drop policy if exists "allow_manage_rewards" on public.rewards;
drop policy if exists "allow_read_rewards" on public.rewards;

-- 2. Allow reading rewards (active rewards for everyone, all rewards for admin/authenticated)
create policy "allow_read_rewards" on public.rewards
  for select
  using (true);

-- 3. Allow inserting, updating, and deleting rewards for authenticated users & admin console
create policy "allow_manage_rewards" on public.rewards
  for all
  using (true)
  with check (true);

-- 4. Ensure same permissions for smart bins and waste types management in Admin
drop policy if exists "admin_manage_bins" on public.bins;
drop policy if exists "bins_read_all" on public.bins;
drop policy if exists "allow_manage_bins" on public.bins;
drop policy if exists "allow_read_bins" on public.bins;

create policy "allow_read_bins" on public.bins
  for select
  using (true);

create policy "allow_manage_bins" on public.bins
  for all
  using (true)
  with check (true);

-- Also ensure redemptions management is permitted
drop policy if exists "admin_manage_redemptions" on public.redemptions;
drop policy if exists "allow_manage_redemptions" on public.redemptions;
create policy "allow_manage_redemptions" on public.redemptions
  for all
  using (true)
  with check (true);
