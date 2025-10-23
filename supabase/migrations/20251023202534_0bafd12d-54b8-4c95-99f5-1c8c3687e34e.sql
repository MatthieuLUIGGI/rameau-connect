-- Add type column to artisans table
ALTER TABLE public.artisans 
ADD COLUMN type TEXT NOT NULL DEFAULT 'Autre';

-- Create table for AG reports
CREATE TABLE public.comptes_rendus_ag (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  author_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.comptes_rendus_ag ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comptes_rendus_ag
CREATE POLICY "Anyone authenticated can view AG reports"
ON public.comptes_rendus_ag
FOR SELECT
USING (true);

CREATE POLICY "Only AG members can manage AG reports"
ON public.comptes_rendus_ag
FOR ALL
USING (has_role(auth.uid(), 'ag'::app_role));

-- Create storage bucket for AG reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('ag-reports', 'ag-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for AG reports
CREATE POLICY "Anyone authenticated can view AG report files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ag-reports');

CREATE POLICY "AG members can upload AG report files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ag-reports' AND has_role(auth.uid(), 'ag'::app_role));

CREATE POLICY "AG members can update AG report files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'ag-reports' AND has_role(auth.uid(), 'ag'::app_role));

CREATE POLICY "AG members can delete AG report files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ag-reports' AND has_role(auth.uid(), 'ag'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_comptes_rendus_ag_updated_at
BEFORE UPDATE ON public.comptes_rendus_ag
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();