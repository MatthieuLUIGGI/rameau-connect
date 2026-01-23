-- Table pour les comptes rendus du conseil syndical
CREATE TABLE public.comptes_rendus_conseil_syndical (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  date DATE NOT NULL,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour stocker le mot de passe hashé
CREATE TABLE public.conseil_syndical_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.comptes_rendus_conseil_syndical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conseil_syndical_config ENABLE ROW LEVEL SECURITY;

-- Politiques pour comptes_rendus_conseil_syndical
-- Lecture pour tous les utilisateurs authentifiés (la protection se fait par mot de passe côté client)
CREATE POLICY "Authenticated users can view conseil syndical reports"
ON public.comptes_rendus_conseil_syndical
FOR SELECT
TO authenticated
USING (true);

-- Seuls les membres AG peuvent gérer les comptes rendus
CREATE POLICY "Only AG members can manage conseil syndical reports"
ON public.comptes_rendus_conseil_syndical
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ag'::public.app_role));

-- Politiques pour conseil_syndical_config
-- Seuls les membres AG peuvent voir et modifier la config
CREATE POLICY "Only AG members can view conseil syndical config"
ON public.conseil_syndical_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'ag'::public.app_role));

CREATE POLICY "Only AG members can manage conseil syndical config"
ON public.conseil_syndical_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ag'::public.app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_comptes_rendus_conseil_syndical_updated_at
BEFORE UPDATE ON public.comptes_rendus_conseil_syndical
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conseil_syndical_config_updated_at
BEFORE UPDATE ON public.conseil_syndical_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer le bucket storage pour les rapports du conseil syndical
INSERT INTO storage.buckets (id, name, public) VALUES ('conseil-syndical-reports', 'conseil-syndical-reports', true);

-- Politiques storage
CREATE POLICY "Public can view conseil syndical reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'conseil-syndical-reports');

CREATE POLICY "AG members can upload conseil syndical reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'conseil-syndical-reports' AND public.has_role(auth.uid(), 'ag'::public.app_role));

CREATE POLICY "AG members can delete conseil syndical reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'conseil-syndical-reports' AND public.has_role(auth.uid(), 'ag'::public.app_role));