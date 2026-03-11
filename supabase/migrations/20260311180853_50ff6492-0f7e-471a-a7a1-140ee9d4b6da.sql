
-- Create vitrine table
CREATE TABLE public.vitrine (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text,
  description text,
  credits text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vitrine ENABLE ROW LEVEL SECURITY;

-- Everyone can view the vitrine
CREATE POLICY "Anyone can view vitrine" ON public.vitrine FOR SELECT TO public USING (true);

-- Only AG members can manage vitrine
CREATE POLICY "Only AG members can manage vitrine" ON public.vitrine FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ag'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'ag'::app_role));

-- Create storage bucket for vitrine images
INSERT INTO storage.buckets (id, name, public) VALUES ('vitrine', 'vitrine', true);

-- Storage policies
CREATE POLICY "Anyone can view vitrine images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'vitrine');
CREATE POLICY "AG members can upload vitrine images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vitrine' AND public.has_role(auth.uid(), 'ag'::app_role));
CREATE POLICY "AG members can update vitrine images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vitrine' AND public.has_role(auth.uid(), 'ag'::app_role));
CREATE POLICY "AG members can delete vitrine images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vitrine' AND public.has_role(auth.uid(), 'ag'::app_role));

-- Insert a default empty row
INSERT INTO public.vitrine (id) VALUES (gen_random_uuid());
