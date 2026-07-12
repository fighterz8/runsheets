-- Avoid recursive RLS checks when policies need the current user's org/role.

create or replace function public.current_user_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from public.users where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid()
$$;

grant execute on function public.current_user_org_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;

-- Users: everyone can read their own profile; same-org visibility uses definer helper.
drop policy if exists "Users can read own org users" on public.users;
create policy "Users can read own profile and org users" on public.users
for select using (
  id = auth.uid()
  or org_id = public.current_user_org_id()
);

-- Orgs
drop policy if exists "Users can read own org" on public.orgs;
create policy "Users can read own org" on public.orgs
for select using (id = public.current_user_org_id());

-- Events
drop policy if exists "Users can read own org events" on public.events;
create policy "Users can read own org events" on public.events
for select using (org_id = public.current_user_org_id());

drop policy if exists "Admins and warehouse can insert events" on public.events;
create policy "Admins and warehouse can insert events" on public.events
for insert with check (
  org_id = public.current_user_org_id()
  and public.current_user_role() in ('admin', 'warehouse')
);

drop policy if exists "Admins and warehouse can update events" on public.events;
create policy "Admins and warehouse can update events" on public.events
for update using (
  org_id = public.current_user_org_id()
  and public.current_user_role() in ('admin', 'warehouse')
) with check (
  org_id = public.current_user_org_id()
  and public.current_user_role() in ('admin', 'warehouse')
);

-- Pullsheet items
drop policy if exists "Users can read own org pullsheet items" on public.pullsheet_items;
create policy "Users can read own org pullsheet items" on public.pullsheet_items
for select using (
  event_id in (select id from public.events where org_id = public.current_user_org_id())
);

drop policy if exists "Admins and warehouse can manage pullsheet items" on public.pullsheet_items;
create policy "Admins and warehouse can manage pullsheet items" on public.pullsheet_items
for all using (
  public.current_user_role() in ('admin', 'warehouse')
  and event_id in (select id from public.events where org_id = public.current_user_org_id())
) with check (
  public.current_user_role() in ('admin', 'warehouse')
  and event_id in (select id from public.events where org_id = public.current_user_org_id())
);

-- Count records
drop policy if exists "Users can read own org count records" on public.count_records;
create policy "Users can read own org count records" on public.count_records
for select using (
  pullsheet_item_id in (
    select pi.id from public.pullsheet_items pi
    join public.events e on e.id = pi.event_id
    where e.org_id = public.current_user_org_id()
  )
);

drop policy if exists "Warehouse can insert count records" on public.count_records;
create policy "Warehouse can insert count records" on public.count_records
for insert with check (
  counted_by = auth.uid()
  and public.current_user_role() = 'warehouse'
  and pullsheet_item_id in (
    select pi.id from public.pullsheet_items pi
    join public.events e on e.id = pi.event_id
    where e.org_id = public.current_user_org_id()
      and e.status = 'active'
  )
);

create policy "Warehouse can update own count records" on public.count_records
for update using (
  counted_by = auth.uid()
  and public.current_user_role() = 'warehouse'
) with check (
  counted_by = auth.uid()
  and public.current_user_role() = 'warehouse'
);
