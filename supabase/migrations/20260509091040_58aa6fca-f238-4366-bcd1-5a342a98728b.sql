ALTER TABLE public.vitrine
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS description_font text DEFAULT 'sans',
  ADD COLUMN IF NOT EXISTS description_size text DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS description_style text[] DEFAULT '{}';