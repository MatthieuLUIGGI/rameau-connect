-- Add price column to badges_vigik_stock to store badge unit price
alter table
if exists public.badges_vigik_stock
add column
if not exists price numeric
(10,2) null;

-- Optional: no data migration required; existing singleton row will have price = null by default
