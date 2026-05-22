/*
# Initial Schema for Ecossistema Seven
Creates the core tables for users, companies, and learning modules.

## Query Description:
This migration sets up the foundational database structure for the Seven Ecosystem.
It creates custom profiles linked to auth, companies reference, and module tracking.

## Metadata:
- Schema-Category: Structural
- Impact-Level: Low
- Requires-Backup: false
- Reversible: true
*/

-- Create enum for access levels
CREATE TYPE access_level AS ENUM ('admin', 'colaborador');
CREATE TYPE user_status AS ENUM ('ativo', 'inativo');
CREATE TYPE company_name AS ENUM ('Seven', 'ARQO', 'Nexa');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    empresa company_name NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    nivel_acesso access_level DEFAULT 'colaborador',
    status user_status DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create modules table
CREATE TABLE public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa company_name NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create user progress table
CREATE TABLE public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_andamento, concluido
    progresso INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Basic Policies (To be refined based on exact business rules)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND nivel_acesso = 'admin')
);

CREATE POLICY "Users can view modules for their company or Seven" ON public.modules FOR SELECT USING (
    empresa = (SELECT empresa FROM public.profiles WHERE id = auth.uid()) OR empresa = 'Seven'
);
