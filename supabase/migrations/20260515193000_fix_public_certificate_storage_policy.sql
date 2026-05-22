create or replace function public.is_valid_certificate_storage_object(object_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.certificates c
    where c.certificate_url = object_name
      and c.validation_code is not null
  );
$$;

revoke all on function public.is_valid_certificate_storage_object(text) from public;
grant execute on function public.is_valid_certificate_storage_object(text) to anon, authenticated;

drop policy if exists "Public read validated certificate storage" on storage.objects;
create policy "Public read validated certificate storage"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'certificates'
  and public.is_valid_certificate_storage_object(name)
);
