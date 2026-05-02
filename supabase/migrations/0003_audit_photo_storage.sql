insert into storage.buckets (id, name, public)
values ('audit-photos', 'audit-photos', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload audit photos" on storage.objects;
create policy "Authenticated users can upload audit photos" on storage.objects
for insert to authenticated
with check (bucket_id = 'audit-photos');

drop policy if exists "Authenticated users can read audit photos" on storage.objects;
create policy "Authenticated users can read audit photos" on storage.objects
for select to authenticated
using (bucket_id = 'audit-photos');
