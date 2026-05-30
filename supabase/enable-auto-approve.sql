alter table public.members
alter column role set default '社众',
alter column status set default 'active';

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

  -- Ordinary members can edit profile text/images. New/edited profiles auto-publish,
  -- but members cannot move themselves into or out of the alumni archive.
  if old.status = 'alumni' then
    new.status = old.status;
  elsif new.status not in ('active', 'pending') then
    new.status = 'active';
  end if;
  new.sort_order = old.sort_order;
  new.owner_id = old.owner_id;
  return new;
end;
$$;

drop policy if exists "members can create own pending profile" on public.members;
drop policy if exists "members can create own active profile" on public.members;
create policy "members can create own active profile"
on public.members
for insert
to authenticated
with check ((select auth.uid()) = owner_id and status = 'active');

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
