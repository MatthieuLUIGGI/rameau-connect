-- Add gestionnaire and assistante fields to membres_assemblee table
ALTER TABLE public.membres_assemblee 
ADD COLUMN gestionnaire TEXT,
ADD COLUMN assistante TEXT;