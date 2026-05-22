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

  select coalesce(max(qa.attempt_number), 0) + 1
  into next_attempt_number
  from public.quiz_attempts qa
  where qa.user_id = auth.uid()
    and qa.quiz_id = input_quiz_id;

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
