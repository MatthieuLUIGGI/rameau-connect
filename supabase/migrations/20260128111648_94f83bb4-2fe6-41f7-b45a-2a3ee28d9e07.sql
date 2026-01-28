-- Add order_index column to comptes_rendus_conseil_syndical
ALTER TABLE public.comptes_rendus_conseil_syndical 
ADD COLUMN order_index INTEGER DEFAULT 0;

-- Add link_url column for optional link instead of file
ALTER TABLE public.comptes_rendus_conseil_syndical 
ADD COLUMN link_url TEXT;

-- Make file_url nullable since we can have a link instead
ALTER TABLE public.comptes_rendus_conseil_syndical 
ALTER COLUMN file_url DROP NOT NULL;