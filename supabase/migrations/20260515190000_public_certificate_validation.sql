alter table public.certificates
  add column if not exists validation_code text;

create unique index if not exists certificates_validation_code_key
  on public.certificates (validation_code)
  where validation_code is not null;

update public.certificates c
set validation_code = upper('ARQO-' || substr(md5(
  coalesce(nullif(p.full_name, ''), p.username, c.user_id::text)
  || '-' || coalesce(co.title, c.course_id::text)
  || '-' || coalesce(c.completed_at::text, c.issued_at::text, c.id::text)
), 1, 8))
from public.profiles p, public.courses co
where c.user_id = p.id
  and c.course_id = co.id
  and c.validation_code is null;

create or replace function public.validate_certificate_code(input_code text)
returns table (
  certificate_id uuid,
  certificate_url text,
  validation_code text,
  issued_at timestamptz,
  completed_at timestamptz,
  workload_minutes integer,
  student_name text,
  course_title text,
  company text
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as certificate_id,
    c.certificate_url,
    c.validation_code,
    c.issued_at,
    c.completed_at,
    c.workload_minutes,
    coalesce(nullif(p.full_name, ''), p.username) as student_name,
    co.title as course_title,
    co.company as company
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  join public.courses co on co.id = c.course_id
  where c.validation_code = upper(trim(input_code))
    and c.validation_code is not null
  limit 1;
$$;

revoke all on function public.validate_certificate_code(text) from public;
grant execute on function public.validate_certificate_code(text) to anon, authenticated;

drop policy if exists "Public read validated certificate storage" on storage.objects;
create policy "Public read validated certificate storage"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'certificates'
  and exists (
    select 1
    from public.certificates c
    where c.certificate_url = storage.objects.name
      and c.validation_code is not null
  )
);
