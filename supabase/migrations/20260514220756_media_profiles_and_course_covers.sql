alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('course-covers', 'course-covers', false)
on conflict (id) do update set public = false;

drop policy if exists "Learning admins manage profile images" on storage.objects;
drop policy if exists "Learning users read profile images" on storage.objects;
drop policy if exists "Learning admins manage course covers" on storage.objects;
drop policy if exists "Learning users read course covers" on storage.objects;

create policy "Learning admins manage profile images"
on storage.objects for all to authenticated
using (
  bucket_id = 'profile-images'
  and app_private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'profile-images'
  and app_private.current_user_role() = 'admin'
);

create policy "Learning users read profile images"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-images'
  and app_private.current_user_status() = 'ativo'
);

create policy "Learning admins manage course covers"
on storage.objects for all to authenticated
using (
  bucket_id = 'course-covers'
  and app_private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'course-covers'
  and app_private.current_user_role() = 'admin'
);

create policy "Learning users read course covers"
on storage.objects for select to authenticated
using (
  bucket_id = 'course-covers'
  and app_private.current_user_status() = 'ativo'
);
