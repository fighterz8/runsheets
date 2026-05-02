-- Add viewer role and support pullsheet confirmation before counting.

alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('admin', 'warehouse', 'viewer'));

alter table public.events
  add column if not exists pullsheet_source text not null default 'manual'
    check (pullsheet_source in ('manual', 'ops_upload', 'warehouse_photo')),
  add column if not exists pullsheet_confirmed_at timestamptz,
  add column if not exists pullsheet_confirmed_by uuid references public.users(id);

-- Admin = ops manager; warehouse can confirm physical pullsheet capture; viewer is read-only.
drop policy if exists "Admins can insert events" on public.events;
create policy "Admins and warehouse can insert events" on public.events
for insert with check (
  org_id in (
    select org_id from public.users
    where id = auth.uid() and role in ('admin', 'warehouse')
  )
);

drop policy if exists "Admins can update events" on public.events;
create policy "Admins and warehouse can update events" on public.events
for update using (
  org_id in (
    select org_id from public.users
    where id = auth.uid() and role in ('admin', 'warehouse')
  )
) with check (
  org_id in (
    select org_id from public.users
    where id = auth.uid() and role in ('admin', 'warehouse')
  )
);

drop policy if exists "Admins can manage pullsheet items" on public.pullsheet_items;
create policy "Admins and warehouse can manage pullsheet items" on public.pullsheet_items
for all using (
  event_id in (
    select id from public.events
    where org_id in (
      select org_id from public.users
      where id = auth.uid() and role in ('admin', 'warehouse')
    )
  )
) with check (
  event_id in (
    select id from public.events
    where org_id in (
      select org_id from public.users
      where id = auth.uid() and role in ('admin', 'warehouse')
    )
  )
);
