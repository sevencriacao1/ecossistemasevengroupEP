-- Move LMS completion/quiz/certificate writes behind validated database functions.
-- Direct client writes were too broad: a collaborator could mark lessons,
-- forge quiz attempts, and issue certificates by calling the REST API.

drop policy if exists "Learning users manage own lesson progress" on public.lesson_progress;
drop policy if exists "Learning users read own lesson progress" on public.lesson_progress;
drop policy if exists "Learning admins manage lesson progress" on public.lesson_progress;
drop policy if exists "Learning admins read lesson progress" on public.lesson_progress;

create policy "Learning users read own lesson progress"
on public.lesson_progress for select to authenticated
using (user_id = auth.uid());

create policy "Learning admins manage lesson progress"
on public.lesson_progress for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users manage own quiz attempts" on public.quiz_attempts;
drop policy if exists "Learning users read own quiz attempts" on public.quiz_attempts;
drop policy if exists "Learning admins manage quiz attempts" on public.quiz_attempts;

create policy "Learning users read own quiz attempts"
on public.quiz_attempts for select to authenticated
using (user_id = auth.uid());

create policy "Learning admins manage quiz attempts"
on public.quiz_attempts for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users manage own course failures" on public.course_failures;
drop policy if exists "Learning users update own course failures" on public.course_failures;
drop policy if exists "Learning users read own course failures" on public.course_failures;
drop policy if exists "Learning admins manage course failures" on public.course_failures;

create policy "Learning users read own course failures"
on public.course_failures for select to authenticated
using (user_id = auth.uid());

create policy "Learning admins manage course failures"
on public.course_failures for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users read active quizzes" on public.quizzes;
drop policy if exists "Learning users read company quizzes" on public.quizzes;

create policy "Learning users read company quizzes"
on public.quizzes for select to authenticated
using (
  app_private.current_user_role() = 'admin'
  or (
    is_active
    and app_private.current_user_status() = 'ativo'
    and exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id
        and c.is_active
        and c.company = app_private.current_user_company()
    )
  )
);

drop policy if exists "Learning users read quiz questions" on public.quiz_questions;
drop policy if exists "Learning users read company quiz questions" on public.quiz_questions;

create policy "Learning users read company quiz questions"
on public.quiz_questions for select to authenticated
using (
  app_private.current_user_role() = 'admin'
  or exists (
    select 1
    from public.quizzes q
    join public.modules m on m.id = q.module_id
    join public.courses c on c.id = m.course_id
    where q.id = quiz_questions.quiz_id
      and q.is_active
      and c.is_active
      and c.company = app_private.current_user_company()
      and app_private.current_user_status() = 'ativo'
  )
);

drop policy if exists "Learning users manage own certificates" on public.certificates;
drop policy if exists "Learning users update own certificates" on public.certificates;
drop policy if exists "Learning admins manage certificates" on public.certificates;
drop policy if exists "Learning users read own certificates" on public.certificates;

create policy "Learning users read own certificates"
on public.certificates for select to authenticated
using (user_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "Learning admins manage certificates"
on public.certificates for all to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning users insert certificates storage" on storage.objects;
drop policy if exists "Learning users update certificates storage" on storage.objects;
drop policy if exists "Learning users upload certificates storage" on storage.objects;

create policy "Learning users insert own certificates storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'certificates'
  and (
    app_private.current_user_role() = 'admin'
    or position('/' || auth.uid()::text || '/' in name) > 0
  )
);

create or replace function public.complete_lesson_progress(input_lesson_id uuid, input_progress integer default 100)
returns public.lesson_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  next_progress integer := greatest(0, least(100, coalesce(input_progress, 100)));
  next_completed boolean := next_progress >= 100;
  saved_progress public.lesson_progress;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if app_private.current_user_status() <> 'ativo' then
    raise exception 'Inactive users cannot update lesson progress.';
  end if;

  if not exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = input_lesson_id
      and l.is_active
      and c.is_active
      and c.company = app_private.current_user_company()
  ) then
    raise exception 'Lesson is not available for this user.';
  end if;

  insert into public.lesson_progress (
    user_id,
    lesson_id,
    progress,
    completed,
    completed_at,
    updated_at
  )
  values (
    auth.uid(),
    input_lesson_id,
    next_progress,
    next_completed,
    case when next_completed then now() else null end,
    now()
  )
  on conflict (user_id, lesson_id) do update
  set
    progress = excluded.progress,
    completed = excluded.completed,
    completed_at = case
      when excluded.completed then coalesce(public.lesson_progress.completed_at, excluded.completed_at)
      else null
    end,
    updated_at = now()
  returning * into saved_progress;

  return saved_progress;
end;
$$;

create or replace function public.submit_quiz_attempt(input_quiz_id uuid, input_answers jsonb)
returns table (
  id uuid,
  quiz_id uuid,
  module_id uuid,
  course_id uuid,
  user_id uuid,
  score integer,
  passed boolean,
  answers jsonb,
  attempt_number integer,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_record record;
  question_record record;
  total_questions integer := 0;
  correct_questions integer := 0;
  expected_ids text[];
  received_ids text[];
  available_ids text[];
  next_score integer;
  next_passed boolean;
  next_attempt_number integer;
  saved_attempt public.quiz_attempts;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if app_private.current_user_status() <> 'ativo' then
    raise exception 'Inactive users cannot submit quizzes.';
  end if;

  select q.id, q.module_id, m.course_id, q.passing_score
  into quiz_record
  from public.quizzes q
  join public.modules m on m.id = q.module_id
  join public.courses c on c.id = m.course_id
  where q.id = input_quiz_id
    and q.is_active
    and c.is_active
    and c.company = app_private.current_user_company();

  if quiz_record.id is null then
    raise exception 'Quiz is not available for this user.';
  end if;

  for question_record in
    select qq.id, qq.options
    from public.quiz_questions qq
    where qq.quiz_id = input_quiz_id
    order by qq.order_index
  loop
    total_questions := total_questions + 1;

    select coalesce(array_agg(option_item->>'id' order by option_item->>'id'), array[]::text[])
    into expected_ids
    from jsonb_array_elements(question_record.options) option_item
    where (option_item->>'isCorrect')::boolean is true;

    select coalesce(array_agg(option_item->>'id'), array[]::text[])
    into available_ids
    from jsonb_array_elements(question_record.options) option_item;

    select coalesce(array_agg(answer_id order by answer_id), array[]::text[])
    into received_ids
    from jsonb_array_elements_text(coalesce(input_answers -> question_record.id::text, '[]'::jsonb)) answer_id;

    if array_length(received_ids, 1) is null then
      raise exception 'All quiz questions must be answered.';
    end if;

    if not received_ids <@ available_ids then
      raise exception 'Quiz answer contains an invalid option.';
    end if;

    if received_ids = expected_ids then
      correct_questions := correct_questions + 1;
    end if;
  end loop;

  if total_questions = 0 then
    raise exception 'Quiz has no questions.';
  end if;

  next_score := round((correct_questions::numeric / total_questions::numeric) * 100)::integer;
  next_passed := next_score >= coalesce(quiz_record.passing_score, 70);

  select coalesce(failure_count, 0) + 1
  into next_attempt_number
  from public.course_failures
  where user_id = auth.uid()
    and course_id = quiz_record.course_id;

  next_attempt_number := coalesce(next_attempt_number, 1);

  insert into public.quiz_attempts (
    quiz_id,
    module_id,
    course_id,
    user_id,
    score,
    passed,
    answers,
    attempt_number,
    completed_at
  )
  values (
    input_quiz_id,
    quiz_record.module_id,
    quiz_record.course_id,
    auth.uid(),
    next_score,
    next_passed,
    coalesce(input_answers, '{}'::jsonb),
    next_attempt_number,
    now()
  )
  returning * into saved_attempt;

  if not next_passed then
    insert into public.course_failures (user_id, course_id, failure_count, last_failed_at)
    values (auth.uid(), quiz_record.course_id, 1, now())
    on conflict (user_id, course_id) do update
    set
      failure_count = public.course_failures.failure_count + 1,
      last_failed_at = now();

    delete from public.lesson_progress lp
    using public.lessons l
    join public.modules m on m.id = l.module_id
    where lp.lesson_id = l.id
      and lp.user_id = auth.uid()
      and m.course_id = quiz_record.course_id;
  end if;

  return query
  select
    saved_attempt.id,
    saved_attempt.quiz_id,
    saved_attempt.module_id,
    saved_attempt.course_id,
    saved_attempt.user_id,
    saved_attempt.score,
    saved_attempt.passed,
    saved_attempt.answers,
    saved_attempt.attempt_number,
    saved_attempt.completed_at;
end;
$$;

create or replace function public.issue_course_certificate(
  input_user_id uuid,
  input_course_id uuid,
  input_certificate_url text,
  input_workload_minutes integer,
  input_started_at timestamptz,
  input_completed_at timestamptz,
  input_validation_code text
)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_is_admin boolean := app_private.current_user_role() = 'admin';
  target_profile record;
  course_record record;
  missing_lessons integer;
  missing_quizzes integer;
  saved_certificate public.certificates;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not requester_is_admin and input_user_id <> auth.uid() then
    raise exception 'Cannot issue certificates for another user.';
  end if;

  select id, company, status
  into target_profile
  from public.profiles
  where id = input_user_id;

  if target_profile.id is null or target_profile.status <> 'ativo' then
    raise exception 'Target user is not active.';
  end if;

  select id, company, is_active
  into course_record
  from public.courses
  where id = input_course_id;

  if course_record.id is null or not course_record.is_active or course_record.company <> target_profile.company then
    raise exception 'Course is not available for this user.';
  end if;

  select count(*)
  into missing_lessons
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = input_course_id
    and l.is_active
    and not exists (
      select 1
      from public.lesson_progress lp
      where lp.user_id = input_user_id
        and lp.lesson_id = l.id
        and lp.completed
    );

  if missing_lessons > 0 then
    raise exception 'Course has incomplete lessons.';
  end if;

  select count(*)
  into missing_quizzes
  from public.quizzes q
  join public.modules m on m.id = q.module_id
  where m.course_id = input_course_id
    and q.is_active
    and not exists (
      select 1
      from public.quiz_attempts qa
      where qa.user_id = input_user_id
        and qa.quiz_id = q.id
        and qa.passed
    );

  if missing_quizzes > 0 then
    raise exception 'Course has pending quizzes.';
  end if;

  if nullif(trim(input_certificate_url), '') is null then
    raise exception 'Certificate URL is required.';
  end if;

  if nullif(trim(input_validation_code), '') is null then
    raise exception 'Certificate validation code is required.';
  end if;

  if not requester_is_admin and position('/' || auth.uid()::text || '/' in input_certificate_url) = 0 then
    raise exception 'Invalid certificate path.';
  end if;

  insert into public.certificates (
    user_id,
    course_id,
    certificate_url,
    workload_minutes,
    started_at,
    completed_at,
    validation_code,
    issued_at,
    updated_at
  )
  values (
    input_user_id,
    input_course_id,
    input_certificate_url,
    greatest(0, coalesce(input_workload_minutes, 0)),
    input_started_at,
    coalesce(input_completed_at, now()),
    upper(trim(input_validation_code)),
    now(),
    now()
  )
  on conflict (user_id, course_id) do update
  set
    certificate_url = excluded.certificate_url,
    workload_minutes = excluded.workload_minutes,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at,
    validation_code = excluded.validation_code,
    issued_at = excluded.issued_at,
    updated_at = now()
  returning * into saved_certificate;

  return saved_certificate;
end;
$$;

revoke all on function public.complete_lesson_progress(uuid, integer) from public;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;
revoke all on function public.issue_course_certificate(uuid, uuid, text, integer, timestamptz, timestamptz, text) from public;

grant execute on function public.complete_lesson_progress(uuid, integer) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
grant execute on function public.issue_course_certificate(uuid, uuid, text, integer, timestamptz, timestamptz, text) to authenticated;
