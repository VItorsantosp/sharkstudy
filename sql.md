-- 1. LIMPEZA MANUAL DE POLÍTICAS ANTIGAS (Para evitar erros de "already exists")
-- Executamos o DROP individualmente para cada tabela
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON public.categories;
DROP POLICY IF EXISTS "Leitura pública de livros aprovados" ON public.books;
DROP POLICY IF EXISTS "Utilizadores logados sugerem livros" ON public.books;
DROP POLICY IF EXISTS "Perfis visíveis para todos" ON public.profiles;
DROP POLICY IF EXISTS "Utilizadores editam o seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Comentários visíveis para todos" ON public.book_comments;
DROP POLICY IF EXISTS "Utilizadores logados comentam" ON public.book_comments;
DROP POLICY IF EXISTS "Utilizadores gerem o seu progresso" ON public.user_progress;

-- 2. CRIAÇÃO/ATUALIZAÇÃO DAS TABELAS
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category_id INTEGER REFERENCES public.categories(id),
  difficulty_level TEXT CHECK (difficulty_level IN ('Iniciante', 'Intermediário', 'Avançado')),
  file_url TEXT NOT NULL,
  cover_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploader_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  last_page INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 3. ATIVAÇÃO DE RLS (SEGURANÇA)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 4. CRIAÇÃO DAS POLÍTICAS DE ACESSO
CREATE POLICY "Permitir leitura pública de categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Leitura pública de livros aprovados" ON public.books FOR SELECT USING (status = 'approved');
CREATE POLICY "Utilizadores logados sugerem livros" ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Perfis visíveis para todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Utilizadores editam o seu perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Comentários visíveis para todos" ON public.book_comments FOR SELECT USING (true);
CREATE POLICY "Utilizadores logados comentam" ON public.book_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Utilizadores gerem o seu progresso" ON public.user_progress FOR ALL USING (auth.uid() = user_id);

-- 5. TRIGGER PARA PERFIL AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Estudante Shark'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. DADOS INICIAIS
INSERT INTO public.categories (name) VALUES 
('Matemática'), ('Física'), ('Biologia'), ('História'), ('Programação')
ON CONFLICT (name) DO NOTHING;
