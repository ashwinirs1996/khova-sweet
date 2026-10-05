-- =====================================================================
-- Sweet Sales — login setup
-- Run in Supabase → SQL Editor AFTER creating the 3 users in
-- Authentication → Users (see README steps).
-- =====================================================================

-- 1) Staff table: which auth users are allowed into the app
create table if not exists public.app_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  full_name  text,
  role       text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

drop policy if exists "app_users_select_self" on public.app_users;
create policy "app_users_select_self" on public.app_users
  for select to authenticated using (id = auth.uid());

-- Helper: is the logged-in user an approved staff member?
create or replace function public.is_app_user()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.app_users where id = auth.uid());
$$;

-- 2) Register the 3 staff users (emails must match what you created in Auth)
insert into public.app_users (id, username, full_name, role)
select u.id, split_part(u.email, '@', 1), v.full_name, v.role
from auth.users u
join (values
  ('admin@sweetsales.app',  'Admin',   'admin'),
  ('staff1@sweetsales.app', 'Staff 1', 'staff'),
  ('staff2@sweetsales.app', 'Staff 2', 'staff')
) as v(email, full_name, role) on v.email = u.email
on conflict (id) do nothing;

-- 3) Track who added each sale
alter table public.sales
  add column if not exists created_by uuid references auth.users(id) default auth.uid();

-- 4) Lock down sales: remove public (anon) access, allow approved staff only
drop policy if exists "sales_select" on public.sales;
drop policy if exists "sales_insert" on public.sales;

create policy "sales_select" on public.sales
  for select to authenticated using (public.is_app_user());

create policy "sales_insert" on public.sales
  for insert to authenticated with check (public.is_app_user());

-- Check: should list your 3 users
select username, full_name, role from public.app_users;
