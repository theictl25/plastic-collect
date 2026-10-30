
drop policy if exists "users create own profile" on public.users;
create policy "users create own profile" on public.users
for insert to authenticated with check (id = auth.uid());
