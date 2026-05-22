-- Fix recursive RLS policies that read public.profiles from public.profiles policies.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company FROM public.profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios podem ver seu proprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários veem módulos da sua empresa ou Seven" ON public.modules;
DROP POLICY IF EXISTS "Usuarios veem modulos da sua empresa ou Seven" ON public.modules;
DROP POLICY IF EXISTS "Admins veem todos os progressos" ON public.user_progress;

CREATE POLICY "Usuarios podem ver seu proprio perfil"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (public.current_user_role() = 'admin');

CREATE POLICY "Usuarios veem modulos da sua empresa ou Seven"
ON public.modules
FOR SELECT
USING (
  company = 'Seven'
  OR company = public.current_user_company()
  OR public.current_user_role() = 'admin'
);

CREATE POLICY "Admins veem todos os progressos"
ON public.user_progress
FOR SELECT
USING (public.current_user_role() = 'admin');
