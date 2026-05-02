-- Organizations (multi-tenancy from day one — Snake Oil is one row)
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Users (linked to Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete restrict,
  email text not null unique,
  role text not null check (role in ('admin', 'warehouse')),
  created_at timestamptz not null default now()
);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete restrict,
  name text not null,
  event_date date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Pullsheet items (what was supposed to go out)
create table public.pullsheet_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sku text,
  name text not null,
  expected_qty integer not null check (expected_qty >= 0),
  unit_price_cents integer not null default 0,
  is_sealed_case boolean not null default false,
  audit_flagged boolean not null default false,
  created_at timestamptz not null default now()
);

-- Count records (what actually came back)
create table public.count_records (
  id uuid primary key default gen_random_uuid(),
  pullsheet_item_id uuid not null references public.pullsheet_items(id) on delete cascade,
  counted_qty integer not null check (counted_qty >= 0),
  counted_by uuid not null references public.users(id),
  counted_at timestamptz not null default now(),
  audit_photo_url text
);

-- Indexes for common queries
create index idx_events_org_id on public.events(org_id);
create index idx_pullsheet_items_event_id on public.pullsheet_items(event_id);
create index idx_count_records_pullsheet_item_id on public.count_records(pullsheet_item_id);

-- Row-Level Security
alter table public.orgs enable row level security;
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.pullsheet_items enable row level security;
alter table public.count_records enable row level security;

-- Users can read their own org
create policy "Users can read own org" on public.orgs
for select using (
  id in (select org_id from public.users where id = auth.uid())
);

-- Users can read users in their own org
create policy "Users can read own org users" on public.users
for select using (
  org_id in (select org_id from public.users where id = auth.uid())
);

-- Events scoped to org
create policy "Users can read own org events" on public.events
for select using (
  org_id in (select org_id from public.users where id = auth.uid())
);

create policy "Admins can insert events" on public.events
for insert with check (
  org_id in (select org_id from public.users where id = auth.uid() and role = 'admin')
);

create policy "Admins can update events" on public.events
for update using (
  org_id in (select org_id from public.users where id = auth.uid() and role = 'admin')
);

-- Pullsheet items scoped to event's org
create policy "Users can read own org pullsheet items" on public.pullsheet_items
for select using (
  event_id in (
    select id from public.events
    where org_id in (select org_id from public.users where id = auth.uid())
  )
);

create policy "Admins can manage pullsheet items" on public.pullsheet_items
for all using (
  event_id in (
    select id from public.events
    where org_id in (select org_id from public.users where id = auth.uid() and role = 'admin')
  )
) with check (
  event_id in (
    select id from public.events
    where org_id in (select org_id from public.users where id = auth.uid() and role = 'admin')
  )
);

-- Count records — warehouse role can insert/read for their org's events
create policy "Users can read own org count records" on public.count_records
for select using (
  pullsheet_item_id in (
    select pi.id from public.pullsheet_items pi
    join public.events e on e.id = pi.event_id
    where e.org_id in (select org_id from public.users where id = auth.uid())
  )
);

create policy "Warehouse can insert count records" on public.count_records
for insert with check (
  counted_by = auth.uid()
  and pullsheet_item_id in (
    select pi.id from public.pullsheet_items pi
    join public.events e on e.id = pi.event_id
    where e.org_id in (select org_id from public.users where id = auth.uid())
      and e.status = 'active'
  )
);
