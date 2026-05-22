create or replace function public.resolve_login_email(input_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select p.email
  from public.profiles p
  where lower(trim(p.username)) = lower(trim(input_username))
    and p.email is not null
    and coalesce(p.status, 'ativo') = 'ativo'
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
