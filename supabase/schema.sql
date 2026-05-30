create extension if not exists pgcrypto;

create table if not exists public.member_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  slug text unique,
  name text not null,
  role text not null default '港内成员',
  status text not null default 'pending' check (status in ('pending', 'active', 'alumni')),
  avatar text,
  portrait text,
  tags text[] not null default array[]::text[],
  quote text,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_member_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.member_admins
    where user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.lock_member_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_member_admin() then
    new.status = old.status;
    new.sort_order = old.sort_order;
    new.owner_id = old.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists members_touch_updated_at on public.members;
create trigger members_touch_updated_at
before update on public.members
for each row
execute function public.touch_updated_at();

drop trigger if exists members_lock_review_fields on public.members;
create trigger members_lock_review_fields
before update on public.members
for each row
execute function public.lock_member_review_fields();

alter table public.members enable row level security;
alter table public.member_admins enable row level security;

drop policy if exists "visible members can be read by everyone" on public.members;
create policy "visible members can be read by everyone"
on public.members
for select
to anon, authenticated
using (status in ('active', 'alumni'));

drop policy if exists "members can read own profile" on public.members;
create policy "members can read own profile"
on public.members
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "members can create own pending profile" on public.members;
create policy "members can create own pending profile"
on public.members
for insert
to authenticated
with check ((select auth.uid()) = owner_id and status = 'pending');

drop policy if exists "members can update own profile" on public.members;
create policy "members can update own profile"
on public.members
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "admins can manage all members" on public.members;
create policy "admins can manage all members"
on public.members
for all
to authenticated
using (public.is_member_admin())
with check (public.is_member_admin());

drop policy if exists "admins can read admin list" on public.member_admins;
create policy "admins can read admin list"
on public.member_admins
for select
to authenticated
using (public.is_member_admin() or user_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values ('member-portraits', 'member-portraits', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read member portraits" on storage.objects;
create policy "public can read member portraits"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'member-portraits');

drop policy if exists "members can upload own portraits" on storage.objects;
create policy "members can upload own portraits"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'member-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "members can update own portraits" on storage.objects;
create policy "members can update own portraits"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'member-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'member-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "members can delete own portraits" on storage.objects;
create policy "members can delete own portraits"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'member-portraits'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
