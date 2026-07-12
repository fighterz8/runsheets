-- Categorize parsed pullsheet items and preserve physical pullsheet sections.
alter table public.pullsheet_items
  add column if not exists category text not null default 'Kitchen + Miscellaneous',
  add column if not exists alcohol_subcategory text,
  add column if not exists section_label text not null default 'Kitchen + Miscellaneous';

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
      'Named Sections'
    )
  );

alter table public.pullsheet_items
  drop constraint if exists pullsheet_items_alcohol_subcategory_check,
  add constraint pullsheet_items_alcohol_subcategory_check check (
    alcohol_subcategory is null
    or alcohol_subcategory in ('Spirits', 'Wine', 'Beer', 'Champagne/Sparkling', 'Sake/Other')
  );

create index if not exists idx_pullsheet_items_event_category_section
  on public.pullsheet_items(event_id, category, section_label);
