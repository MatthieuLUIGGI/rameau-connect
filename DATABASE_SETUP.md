# Configuration de votre propre base de données Supabase

## Étape 1 : Modifier les variables d'environnement

Dans le fichier `.env` à la racine de votre projet, remplacez les valeurs par celles de votre projet Supabase :

```env
VITE_SUPABASE_PROJECT_ID="votre_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="votre_anon_key"
VITE_SUPABASE_URL="https://votre_project_id.supabase.co"
```

Pour trouver ces valeurs dans votre projet Supabase :
1. Connectez-vous à https://supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez l'**URL** et l'**anon/public key**

## Étape 2 : Créer les tables et la configuration

Exécutez le script SQL suivant dans l'éditeur SQL de votre projet Supabase (**SQL Editor**) :

```sql
-- =====================================================
-- 1. Créer l'enum pour les rôles
-- =====================================================
CREATE TYPE app_role AS ENUM ('user', 'ag');

-- =====================================================
-- 2. Créer les tables
-- =====================================================

-- Table profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table artisans
CREATE TABLE public.artisans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Autre',
  domain TEXT NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table membres_assemblee
CREATE TABLE public.membres_assemblee (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table actualites
CREATE TABLE public.actualites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table comptes_rendus_ag
CREATE TABLE public.comptes_rendus_ag (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  file_url TEXT NOT NULL,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table sondages
CREATE TABLE public.sondages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table votes
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sondage_id UUID NOT NULL,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. Activer RLS sur toutes les tables
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres_assemblee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actualites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_rendus_ag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sondages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Créer les fonctions
-- =====================================================

-- Fonction pour vérifier les rôles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  
  -- Donner le rôle 'user' par défaut aux nouveaux utilisateurs
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction pour obtenir les résultats des sondages
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id UUID)
RETURNS TABLE(option_index INTEGER, vote_count BIGINT, percentage INTEGER)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_votes BIGINT;
BEGIN
  -- Obtenir le total de votes pour ce sondage
  SELECT COUNT(*) INTO total_votes
  FROM votes
  WHERE sondage_id = poll_id;
  
  -- Retourner les résultats agrégés avec les comptes et pourcentages
  RETURN QUERY
  SELECT 
    v.option_index,
    COUNT(*) as vote_count,
    CASE 
      WHEN total_votes > 0 THEN ROUND((COUNT(*) * 100.0 / total_votes)::numeric, 0)::INTEGER
      ELSE 0
    END as percentage
  FROM votes v
  WHERE v.sondage_id = poll_id
  GROUP BY v.option_index
  ORDER BY v.option_index;
END;
$$;

-- =====================================================
-- 5. Créer les triggers
-- =====================================================

-- Trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artisans_updated_at
  BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membres_assemblee_updated_at
  BEFORE UPDATE ON public.membres_assemblee
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actualites_updated_at
  BEFORE UPDATE ON public.actualites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comptes_rendus_ag_updated_at
  BEFORE UPDATE ON public.comptes_rendus_ag
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sondages_updated_at
  BEFORE UPDATE ON public.sondages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. Créer les RLS Policies
-- =====================================================

-- Policies pour profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "AG members can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'ag'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies pour user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only AG members can manage roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'ag'));

-- Policies pour artisans
CREATE POLICY "Anyone authenticated can view artisans"
  ON public.artisans FOR SELECT
  USING (true);

CREATE POLICY "Only AG members can manage artisans"
  ON public.artisans FOR ALL
  USING (has_role(auth.uid(), 'ag'));

-- Policies pour membres_assemblee
CREATE POLICY "Anyone authenticated can view membres"
  ON public.membres_assemblee FOR SELECT
  USING (true);

CREATE POLICY "Only AG members can manage membres"
  ON public.membres_assemblee FOR ALL
  USING (has_role(auth.uid(), 'ag'));

-- Policies pour actualites
CREATE POLICY "Anyone authenticated can view actualites"
  ON public.actualites FOR SELECT
  USING (true);

CREATE POLICY "Only AG members can manage actualites"
  ON public.actualites FOR ALL
  USING (has_role(auth.uid(), 'ag'));

-- Policies pour comptes_rendus_ag
CREATE POLICY "Anyone authenticated can view AG reports"
  ON public.comptes_rendus_ag FOR SELECT
  USING (true);

CREATE POLICY "Only AG members can manage AG reports"
  ON public.comptes_rendus_ag FOR ALL
  USING (has_role(auth.uid(), 'ag'));

-- Policies pour sondages
CREATE POLICY "Anyone authenticated can view sondages"
  ON public.sondages FOR SELECT
  USING (true);

CREATE POLICY "Only AG members can manage sondages"
  ON public.sondages FOR ALL
  USING (has_role(auth.uid(), 'ag'));

-- Policies pour votes
CREATE POLICY "Users can view their own votes"
  ON public.votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "AG members can view all votes"
  ON public.votes FOR SELECT
  USING (has_role(auth.uid(), 'ag'));

CREATE POLICY "Users can insert their own votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. Créer le bucket de stockage
-- =====================================================

-- Créer le bucket pour les rapports d'AG
INSERT INTO storage.buckets (id, name, public)
VALUES ('ag-reports', 'ag-reports', true);

-- Policies pour le bucket ag-reports
CREATE POLICY "Anyone authenticated can view AG reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ag-reports');

CREATE POLICY "Only AG members can upload AG reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ag-reports' AND
    has_role(auth.uid(), 'ag')
  );

CREATE POLICY "Only AG members can delete AG reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ag-reports' AND
    has_role(auth.uid(), 'ag')
  );
```

## Étape 3 : Configurer l'authentification

Dans votre projet Supabase :
1. Allez dans **Authentication** > **Providers**
2. Activez **Email** comme provider
3. Allez dans **Authentication** > **Settings**
4. Désactivez **"Confirm email"** pour permettre l'inscription sans validation d'email (recommandé pour le développement)

## Étape 4 : Créer un utilisateur admin

Une fois la base de données configurée, créez un premier utilisateur et donnez-lui le rôle 'ag' :

```sql
-- Insérez ceci après avoir créé votre premier compte utilisateur
-- Remplacez 'votre-user-id' par l'ID de l'utilisateur que vous voulez rendre admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('votre-user-id', 'ag');
```

Pour trouver votre user_id, allez dans **Authentication** > **Users** dans Supabase.

## Notes importantes

- Le rôle 'user' est attribué automatiquement à tous les nouveaux utilisateurs
- Le rôle 'ag' doit être attribué manuellement aux administrateurs
- Tous les utilisateurs authentifiés peuvent consulter les contenus
- Seuls les membres 'ag' peuvent créer/modifier/supprimer du contenu
