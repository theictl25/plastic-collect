-- Run once in Supabase SQL Editor to authorize an existing account as an admin.
-- This creates the role tables if they do not yet exist.

create table if not exists public.roles (
  id smallserial primary key,
  code varchar(40) not null unique,
  name varchar(100) not null
);

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id smallint not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create index if not exists user_roles_user_id_idx on public.user_roles(user_id);

alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

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

insert into public.roles (code, name)
values ('admin', 'Administrator')
on conflict (code) do update set name = excluded.name;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.code = 'admin'
where u.email = 'the.sst.ictlao@gmail.com'
on conflict (user_id, role_id) do nothing;

-- Verification: this must return one row with role_code = admin.
select u.email, u.display_name, r.code as role_code
from public.users u
join public.user_roles ur on ur.user_id = u.id
join public.roles r on r.id = ur.role_id
where u.email = 'the.sst.ictlao@gmail.com';
