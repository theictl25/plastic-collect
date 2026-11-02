
drop policy if exists "users create own profile" on public.users;
create policy "users create own profile" on public.users
for insert to authenticated with check (id = auth.uid());


-- Admin authorization. Only users explicitly assigned the admin role may open /admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.code = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;
