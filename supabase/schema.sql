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
  role text not null default '社众',
  status text not null default 'active' check (status in ('pending', 'active', 'alumni')),
  avatar text,
  portrait text,
  tags text[] not null default array[]::text[],
  quote text,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.members
alter column role set default '社众',
alter column status set default 'active';

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
  -- SQL Editor / service role has no auth.uid(); allow dashboard maintenance.
  if (select auth.uid()) is null then
    return new;
  end if;

  -- Frontend admins can review and reorder members.
  if public.is_member_admin() then
    return new;
  end if;

  -- Ordinary members can edit profile text/images and choose whether they are
  -- active members or alumni. Pending edits auto-publish as active.
  if new.status not in ('active', 'alumni') then
    new.status = 'active';
  end if;
  new.sort_order = old.sort_order;
  new.owner_id = old.owner_id;
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

update public.members
set status = 'active'
where status = 'pending';

update public.members
set name = '晟楊'
where name = '晟杨';

update public.members
set role = '社众'
where role = '港内成员';

update public.members
set sort_order = 0
where name = '江都夷' and status <> 'alumni';

update public.members
set sort_order = 1
where name = '晟楊' and status <> 'alumni';

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
drop policy if exists "members can create own active profile" on public.members;
drop policy if exists "members can create own visible profile" on public.members;
create policy "members can create own visible profile"
on public.members
for insert
to authenticated
with check ((select auth.uid()) = owner_id and status in ('active', 'alumni'));

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
