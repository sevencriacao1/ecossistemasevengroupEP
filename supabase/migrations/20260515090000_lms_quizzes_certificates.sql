alter table public.modules add column if not exists has_quiz boolean not null default false;
alter table public.lessons add column if not exists video_duration_seconds integer;

alter table public.quizzes add column if not exists passing_score integer not null default 70;
alter table public.quizzes add column if not exists time_per_question_minutes integer not null default 2;
alter table public.quizzes add column if not exists updated_at timestamptz not null default now();

update public.quizzes
set module_id = coalesce(module_id, (
  select l.module_id from public.lessons l where l.id = quizzes.lesson_id limit 1
))
where module_id is null;

alter table public.quiz_questions add column if not exists type text not null default 'single';
alter table public.quiz_questions add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quiz_questions_type_check'
  ) then
    alter table public.quiz_questions
      add constraint quiz_questions_type_check check (type in ('single', 'multiple'));
  end if;
end $$;

alter table public.quiz_attempts add column if not exists module_id uuid references public.modules(id) on delete cascade;
alter table public.quiz_attempts add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.quiz_attempts add column if not exists passed boolean not null default false;
alter table public.quiz_attempts add column if not exists attempt_number integer not null default 1;

update public.quiz_attempts qa
set
  module_id = coalesce(qa.module_id, q.module_id),
  course_id = coalesce(qa.course_id, m.course_id),
  passed = coalesce(qa.passed, qa.score >= coalesce(q.passing_score, 70))
from public.quizzes q
left join public.modules m on m.id = q.module_id
where q.id = qa.quiz_id;

create unique index if not exists quiz_attempts_one_per_cycle
on public.quiz_attempts (quiz_id, user_id, attempt_number);

create table if not exists public.course_failures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  failure_count integer not null default 0,
  last_failed_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.course_failures enable row level security;
grant select, insert, update, delete on public.course_failures to authenticated;

drop policy if exists "Learning admins manage quizzes" on public.quizzes;
drop policy if exists "Learning admins manage quiz questions" on public.quiz_questions;
create policy "Learning admins manage quizzes"
on public.quizzes for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

create policy "Learning admins manage quiz questions"
on public.quiz_questions for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users read own course failures" on public.course_failures;
drop policy if exists "Learning users manage own course failures" on public.course_failures;
drop policy if exists "Learning users update own course failures" on public.course_failures;
drop policy if exists "Learning admins manage course failures" on public.course_failures;
create policy "Learning users read own course failures"
on public.course_failures for select to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning users manage own course failures"
on public.course_failures for insert to authenticated
with check (user_id = auth.uid());

create policy "Learning users update own course failures"
on public.course_failures for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Learning admins manage course failures"
on public.course_failures for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

alter table public.certificates add column if not exists workload_minutes integer not null default 0;
alter table public.certificates add column if not exists started_at timestamptz;
alter table public.certificates add column if not exists completed_at timestamptz;
alter table public.certificates add column if not exists updated_at timestamptz not null default now();

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

drop policy if exists "Learning admins manage certificates storage" on storage.objects;
drop policy if exists "Learning users upload certificates storage" on storage.objects;
drop policy if exists "Learning users insert certificates storage" on storage.objects;
drop policy if exists "Learning users update certificates storage" on storage.objects;
drop policy if exists "Learning users read own certificates storage" on storage.objects;

create policy "Learning admins manage certificates storage"
on storage.objects for all to authenticated
using (
  bucket_id = 'certificates'
  and app_private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'certificates'
  and app_private.current_user_role() = 'admin'
);

create policy "Learning users read own certificates storage"
on storage.objects for select to authenticated
using (
  bucket_id = 'certificates'
  and (
    app_private.current_user_role() = 'admin'
    or exists (
      select 1
      from public.certificates c
      where c.user_id = auth.uid()
        and c.certificate_url like '%' || storage.objects.name
    )
  )
);

create policy "Learning users insert certificates storage"
on storage.objects for insert to authenticated
with check (bucket_id = 'certificates');

create policy "Learning users update certificates storage"
on storage.objects for update to authenticated
using (bucket_id = 'certificates')
with check (bucket_id = 'certificates');

drop policy if exists "Learning users read own certificates" on public.certificates;
drop policy if exists "Learning users manage own certificates" on public.certificates;
drop policy if exists "Learning users update own certificates" on public.certificates;
drop policy if exists "Learning admins manage certificates" on public.certificates;

create policy "Learning users read own certificates"
on public.certificates for select to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning users manage own certificates"
on public.certificates for insert to authenticated
with check (user_id = auth.uid());

create policy "Learning users update own certificates"
on public.certificates for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Learning admins manage certificates"
on public.certificates for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');
