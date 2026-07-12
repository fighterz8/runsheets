alter table public.pullsheet_items
  add column if not exists is_unexpected boolean not null default false,
  add column if not exists ops_review_status text not null default 'confirmed',
  add column if not exists image_url text;

alter table public.pullsheet_items
  drop constraint if exists pullsheet_items_ops_review_status_check,
  add constraint pullsheet_items_ops_review_status_check check (ops_review_status in ('confirmed', 'pending_review', 'rejected'));

create index if not exists idx_pullsheet_items_warehouse_scope
  on public.pullsheet_items(event_id, category, alcohol_subcategory, section_label)
  where category in ('Alcohol', 'SOC Cocktail Mixers', 'Named Sections');

-- Enforce warehouse visibility at RLS too, not just component/client filtering.
drop policy if exists "Users can read own org pullsheet items" on public.pullsheet_items;
create policy "Users can read own org pullsheet items" on public.pullsheet_items
for select using (
  event_id in (
    select e.id from public.events e
    join public.users u on u.org_id = e.org_id
    where u.id = auth.uid()
      and (
        u.role <> 'warehouse'
        or public.pullsheet_items.category in ('Alcohol', 'SOC Cocktail Mixers', 'Named Sections')
      )
  )
);
