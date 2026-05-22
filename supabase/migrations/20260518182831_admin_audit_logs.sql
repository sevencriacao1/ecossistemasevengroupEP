create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Administrador',
  category text not null check (category in ('usuarios', 'admins', 'colaboradores', 'conteudo', 'midia', 'certificados', 'sistema')),
  action text not null,
  target_id text,
  target_type text,
  target_name text,
  company text check (company in ('Seven', 'ARQO')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  reverted_at timestamptz,
  reverted_by uuid references public.profiles(id) on delete set null,
  revert_log_id uuid references public.admin_audit_logs(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

grant select, insert, update on public.admin_audit_logs to authenticated;

drop policy if exists "Learning admins read audit logs" on public.admin_audit_logs;
create policy "Learning admins read audit logs"
on public.admin_audit_logs for select to authenticated
using (app_private.current_user_role() = 'admin');

drop policy if exists "Learning admins insert audit logs" on public.admin_audit_logs;
create policy "Learning admins insert audit logs"
on public.admin_audit_logs for insert to authenticated
with check (app_private.current_user_role() = 'admin');

drop policy if exists "Learning admins update audit logs" on public.admin_audit_logs;
create policy "Learning admins update audit logs"
on public.admin_audit_logs for update to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

create index if not exists admin_audit_logs_created_at_idx
on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_category_created_at_idx
on public.admin_audit_logs (category, created_at desc);

create index if not exists admin_audit_logs_actor_created_at_idx
on public.admin_audit_logs (actor_id, created_at desc);
