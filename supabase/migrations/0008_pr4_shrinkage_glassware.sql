alter table public.count_records
  add column if not exists shrinkage_resolution text;

alter table public.count_records
  drop constraint if exists count_records_shrinkage_resolution_check,
  add constraint count_records_shrinkage_resolution_check check (
    shrinkage_resolution is null or shrinkage_resolution in ('Broken', 'Missing', 'Accounted For')
  );

alter table public.pullsheet_items
  drop constraint if exists pullsheet_items_category_check,
  add constraint pullsheet_items_category_check check (
    category in (
      'Alcohol',
      'Dry Goods/Wares',
      'Bar Installations',
      'Bar Essentials',
      'Kitchen + Miscellaneous',
      'SOC Cocktail Mixers',
      'Garnishes',
      'Modifiers/Perishables',
      'Decor',
      'POS & Tech Equipment',
      'Named Sections',
      'Glassware'
    )
  );

-- PR #4 warehouse scope: only alcohol, SOC mixers, glassware, and named countable sections.
drop policy if exists "Users can read own org pullsheet items" on public.pullsheet_items;
create policy "Users can read own org pullsheet items" on public.pullsheet_items
for select using (
  event_id in (
    select e.id from public.events e
    join public.users u on u.org_id = e.org_id
    where u.id = auth.uid()
      and (
        u.role <> 'warehouse'
        or (
          public.pullsheet_items.category in ('Alcohol', 'SOC Cocktail Mixers', 'Glassware', 'Named Sections')
          and coalesce(public.pullsheet_items.alcohol_subcategory, '') <> 'Beer'
        )
      )
  )
);

create index if not exists idx_pullsheet_items_pr4_warehouse_scope
  on public.pullsheet_items(event_id, category, alcohol_subcategory, section_label)
  where category in ('Alcohol', 'SOC Cocktail Mixers', 'Glassware', 'Named Sections');
