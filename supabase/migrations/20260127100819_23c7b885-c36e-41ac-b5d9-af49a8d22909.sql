-- Add order_index column to track position of AG reports
ALTER TABLE public.comptes_rendus_ag 
ADD COLUMN order_index integer DEFAULT 0;

-- Update existing records with sequential order based on date
UPDATE public.comptes_rendus_ag 
SET order_index = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY date DESC) as row_num
  FROM public.comptes_rendus_ag
) as subquery
WHERE public.comptes_rendus_ag.id = subquery.id;