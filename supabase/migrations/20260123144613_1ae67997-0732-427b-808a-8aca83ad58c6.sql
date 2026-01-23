-- Créer la table badges_vigik_stock avec une zone de texte
CREATE TABLE public.badges_vigik_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  info_text TEXT,
  price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.badges_vigik_stock ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les badges" 
ON public.badges_vigik_stock 
FOR SELECT 
TO authenticated
USING (true);

-- Politique d'écriture pour les membres AG uniquement
CREATE POLICY "Les membres AG peuvent modifier les badges" 
ON public.badges_vigik_stock 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'ag'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'ag'::public.app_role));

-- Insérer une ligne par défaut
INSERT INTO public.badges_vigik_stock (info_text, price)
VALUES ('Badges disponibles. Contactez le conseil syndical pour plus d''informations.', 15.00);