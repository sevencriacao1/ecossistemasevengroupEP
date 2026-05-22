-- Learning platform foundation for Ecossistema Seven Group / ARQO.
-- This migration is intentionally compatibility-first: it adds the new
-- learning schema without dropping the current institutional experience data.

create schema if not exists app_private;

create or replace function app_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(to_jsonb(p)->>'role', to_jsonb(p)->>'nivel_acesso', 'colaborador')
  from public.profiles p
  where id = auth.uid()
$$;

create or replace function app_private.current_user_company()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(to_jsonb(p)->>'company', to_jsonb(p)->>'empresa', 'Seven')
  from public.profiles p
  where id = auth.uid()
$$;

create or replace function app_private.current_user_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(to_jsonb(p)->>'status', 'ativo')
  from public.profiles p
  where id = auth.uid()
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.current_user_role() to authenticated;
grant execute on function app_private.current_user_company() to authenticated;
grant execute on function app_private.current_user_status() to authenticated;

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'colaborador';
alter table public.profiles add column if not exists company text default 'Seven';
alter table public.profiles add column if not exists status text default 'ativo';
alter table public.profiles add column if not exists updated_at timestamptz default now();

update public.profiles
set
  username = coalesce(username, split_part(email, '@', 1), to_jsonb(profiles)->>'nome'),
  full_name = coalesce(full_name, to_jsonb(profiles)->>'nome'),
  role = case
    when coalesce(role, to_jsonb(profiles)->>'nivel_acesso', 'colaborador') = 'admin' then 'admin'
    else 'colaborador'
  end,
  company = case
    when coalesce(company, to_jsonb(profiles)->>'empresa', 'Seven') = 'ARQO' then 'ARQO'
    else 'Seven'
  end,
  status = case
    when coalesce(status, 'ativo') = 'inativo' then 'inativo'
    else 'ativo'
  end;

alter table public.profiles
  alter column role set default 'colaborador',
  alter column company set default 'Seven',
  alter column status set default 'ativo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_learning_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_learning_check check (role in ('admin', 'colaborador'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_company_learning_check'
  ) then
    alter table public.profiles
      add constraint profiles_company_learning_check check (company in ('Seven', 'ARQO'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_learning_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_learning_check check (status in ('ativo', 'inativo'));
  end if;
end $$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  company text not null check (company in ('Seven', 'ARQO')),
  title text not null,
  description text,
  cover_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.modules add column if not exists company text;
alter table public.modules add column if not exists title text;
alter table public.modules add column if not exists description text;
alter table public.modules add column if not exists duration text;
alter table public.modules add column if not exists order_index integer;
alter table public.modules add column if not exists updated_at timestamptz default now();

update public.modules
set
  company = case
    when coalesce(company, to_jsonb(modules)->>'empresa', 'Seven') = 'ARQO' then 'ARQO'
    else 'Seven'
  end,
  title = coalesce(title, to_jsonb(modules)->>'titulo'),
  description = coalesce(description, to_jsonb(modules)->>'descricao'),
  order_index = coalesce(order_index, nullif(to_jsonb(modules)->>'ordem', '')::integer, 1);

insert into public.courses (company, title, description, is_active)
select source.company, source.title, source.description, true
from (
  values
    ('Seven', 'Curso Seven Group', 'Onboarding, cultura, processos e ferramentas da Seven Group.'),
    ('ARQO', 'Curso ARQO', 'Onboarding, cultura comercial e operação da ARQO Inteligência Imobiliária.')
) as source(company, title, description)
where not exists (
  select 1 from public.courses c where c.company = source.company
);

update public.modules m
set course_id = c.id
from public.courses c
where m.course_id is null
  and c.company = coalesce(m.company, 'Seven');

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  attachment_url text,
  content text,
  order_index integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lessons add column if not exists attachment_url text;

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  issued_at timestamptz not null default now(),
  certificate_url text,
  unique (user_id, course_id)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text,
  order_index integer not null default 1
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create table if not exists public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gamification_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  company text check (company in ('Seven', 'ARQO')),
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.certificates enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.lesson_comments enable row level security;
alter table public.gamification_points enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;

grant select, insert, update, delete on
  public.profiles,
  public.courses,
  public.modules,
  public.lessons,
  public.lesson_progress,
  public.certificates,
  public.quizzes,
  public.quiz_questions,
  public.quiz_attempts,
  public.lesson_comments,
  public.gamification_points,
  public.notifications
to authenticated;

drop policy if exists "Authenticated users can read own profile" on public.profiles;
drop policy if exists "Learning admins manage profiles" on public.profiles;
drop policy if exists "Learning users read own profile" on public.profiles;
create policy "Learning users read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());
create policy "Learning admins manage profiles"
on public.profiles for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users read company courses" on public.courses;
drop policy if exists "Learning admins manage courses" on public.courses;
create policy "Learning users read company courses"
on public.courses for select to authenticated
using (
  is_active
  and app_private.current_user_status() = 'ativo'
  and company = app_private.current_user_company()
);
create policy "Learning admins manage courses"
on public.courses for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Usuarios veem modulos da sua empresa ou Seven" on public.modules;
drop policy if exists "Learning users read company modules" on public.modules;
drop policy if exists "Learning admins manage modules" on public.modules;
create policy "Learning users read company modules"
on public.modules for select to authenticated
using (
  app_private.current_user_status() = 'ativo'
  and exists (
    select 1
    from public.courses c
    where c.id = modules.course_id
      and c.is_active
      and c.company = app_private.current_user_company()
  )
);
create policy "Learning admins manage modules"
on public.modules for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users read active company lessons" on public.lessons;
drop policy if exists "Learning admins manage lessons" on public.lessons;
create policy "Learning users read active company lessons"
on public.lessons for select to authenticated
using (
  is_active
  and app_private.current_user_status() = 'ativo'
  and exists (
    select 1
    from public.modules m
    join public.courses c on c.id = m.course_id
    where m.id = lessons.module_id
      and c.is_active
      and c.company = app_private.current_user_company()
  )
);
create policy "Learning admins manage lessons"
on public.lessons for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Usuarios gerenciam seu progresso" on public.user_progress;
drop policy if exists "Learning users manage own lesson progress" on public.lesson_progress;
drop policy if exists "Learning admins read lesson progress" on public.lesson_progress;
create policy "Learning users manage own lesson progress"
on public.lesson_progress for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "Learning admins read lesson progress"
on public.lesson_progress for select to authenticated
using (app_private.current_user_role() = 'admin');

create policy "Learning users read own certificates"
on public.certificates for select to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning users read active quizzes"
on public.quizzes for select to authenticated
using (is_active or app_private.current_user_role() = 'admin');

create policy "Learning users read quiz questions"
on public.quiz_questions for select to authenticated
using (
  app_private.current_user_role() = 'admin'
  or exists (
    select 1 from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and q.is_active
  )
);

create policy "Learning users manage own quiz attempts"
on public.quiz_attempts for all to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin')
with check (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning users manage comments"
on public.lesson_comments for all to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin')
with check (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning users read own points"
on public.gamification_points for select to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning users read own notifications"
on public.notifications for select to authenticated
using (
  app_private.current_user_role() = 'admin'
  or user_id = auth.uid()
  or company = app_private.current_user_company()
);

insert into storage.buckets (id, name, public)
values ('lesson-videos', 'lesson-videos', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('lesson-attachments', 'lesson-attachments', false)
on conflict (id) do update set public = false;

drop policy if exists "Learning admins manage lesson videos" on storage.objects;
drop policy if exists "Learning users read lesson videos" on storage.objects;
drop policy if exists "Learning admins manage lesson attachments" on storage.objects;
drop policy if exists "Learning users read lesson attachments" on storage.objects;
create policy "Learning admins manage lesson videos"
on storage.objects for all to authenticated
using (
  bucket_id = 'lesson-videos'
  and app_private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'lesson-videos'
  and app_private.current_user_role() = 'admin'
);

create policy "Learning users read lesson videos"
on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-videos'
  and app_private.current_user_status() = 'ativo'
  and exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.video_url like '%' || storage.objects.name
      and l.is_active
      and c.is_active
      and c.company = app_private.current_user_company()
  )
);

create policy "Learning admins manage lesson attachments"
on storage.objects for all to authenticated
using (
  bucket_id = 'lesson-attachments'
  and app_private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'lesson-attachments'
  and app_private.current_user_role() = 'admin'
);

create policy "Learning users read lesson attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-attachments'
  and app_private.current_user_status() = 'ativo'
  and exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.attachment_url like '%' || storage.objects.name
      and l.is_active
      and c.is_active
      and c.company = app_private.current_user_company()
  )
);
