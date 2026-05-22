drop policy if exists "Learning users insert certificates storage" on storage.objects;
drop policy if exists "Learning users update certificates storage" on storage.objects;

create policy "Learning users insert certificates storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'certificates'
  and name like ('%/' || auth.uid()::text || '/%')
);

create policy "Learning users update certificates storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'certificates'
  and name like ('%/' || auth.uid()::text || '/%')
)
with check (
  bucket_id = 'certificates'
  and name like ('%/' || auth.uid()::text || '/%')
);
