/*
  # Evolução do Schema - Ecossistema Seven
  Criação de perfis, módulos, progresso e inserção de usuários iniciais.
*/

-- 1. Criação da tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'colaborador')) DEFAULT 'colaborador',
  company TEXT CHECK (company IN ('Seven', 'ARQO', 'Nexa')) DEFAULT 'Seven',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criação da tabela de Módulos
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT CHECK (company IN ('Seven', 'ARQO', 'Nexa')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criação da tabela de Progresso do Usuário
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pendente', 'em_andamento', 'concluido')) DEFAULT 'pendente',
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
-- Perfis: Admin vê todos, Colaborador vê apenas o seu
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (id = auth.uid());

-- Módulos: Visíveis baseados na empresa do usuário (Seven é global)
CREATE POLICY "Usuários veem módulos da sua empresa ou Seven" ON public.modules FOR SELECT USING (
  company = 'Seven' OR 
  company = (SELECT company FROM public.profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Progresso: Usuário gerencia o seu, Admin vê todos
CREATE POLICY "Usuários gerenciam seu progresso" ON public.user_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins veem todos os progressos" ON public.user_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Trigger para auto-criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, company)
  VALUES (
    new.id,
    SPLIT_PART(new.email, '@', 1),
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'colaborador'),
    COALESCE(new.raw_user_meta_data->>'company', 'Seven')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Seed Data: Inserir Módulos Iniciais (ARQO)
INSERT INTO public.modules (company, title, description, duration, order_index) VALUES
('ARQO', 'Bem-vindo à ARQO', 'Introdução ao ecossistema e cultura.', '15 min', 1),
('ARQO', 'Cultura comercial', 'Pilares das nossas negociações.', '45 min', 2),
('ARQO', 'Operação de vendas', 'Processos e rotinas de alta performance.', '1h 20m', 3),
('ARQO', 'CRM e leads', 'Gestão inteligente de contatos.', '50 min', 4);

-- Nota: Para criar os usuários 'admin' e 'gabriel' com senhas criptografadas corretamente,
-- utilizaremos uma função de seed no frontend ou você pode criá-los via painel do Supabase.
-- Como o Supabase gerencia o hash de senhas (Bcrypt), a inserção direta via SQL requer a extensão pgcrypto.
