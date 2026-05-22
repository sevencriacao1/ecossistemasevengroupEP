create or replace function public.resolve_login_email(input_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(p.email, au.email)
  from public.profiles p
  left join auth.users au on au.id = p.id
  where lower(trim(p.username)) = lower(trim(input_username))
    and coalesce(p.email, au.email) is not null
    and coalesce(p.status, 'ativo') = 'ativo'
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
