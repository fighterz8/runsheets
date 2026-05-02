-- Seed Snake Oil org (logo_url updated after upload to Supabase Storage)
insert into public.orgs (id, name, logo_url)
values ('00000000-0000-0000-0000-000000000001', 'Snake Oil Cocktail Co.', null)
on conflict (id) do update set name = excluded.name;
