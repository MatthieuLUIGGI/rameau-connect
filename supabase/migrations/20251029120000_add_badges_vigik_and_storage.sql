-- Create table for badges Vigik stock (singleton row)
create table
if not exists public.badges_vigik_stock
(
  id uuid primary key default gen_random_uuid
(),
  available_count integer not null default 0 check
(available_count >= 0),
  next_reception_date date null,
  created_at timestamptz not null default now
(),
  updated_at timestamptz not null default now
()
);

-- Trigger to keep updated_at in sync
create or replace function public.set_updated_at
()
returns trigger as $$
begin
  new.updated_at = now
();
return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_badges
on public.badges_vigik_stock;
create trigger set_updated_at_badges
before
update on public.badges_vigik_stock
for each row
execute
procedure public.set_updated_at
();

-- Row Level Security
alter table public.badges_vigik_stock enable row level security;

-- Policy: everyone authenticated can read
create policy
if not exists badges_vigik_select on public.badges_vigik_stock
  for
select using (auth.role() = 'authenticated');

-- Policy: only AG role can write
create policy
if not exists badges_vigik_write on public.badges_vigik_stock
  for all
  using
(
    auth.role
() = 'authenticated' and exists
(
      select 1
from public.user_roles ur
where ur.user_id = auth.uid() and ur.role = 'ag'
    )
) with check
(
    auth.role
() = 'authenticated' and exists
(
      select 1
from public.user_roles ur
where ur.user_id = auth.uid() and ur.role = 'ag'
    )
);

-- Optionally seed a singleton row if empty
insert into public.badges_vigik_stock
    (available_count, next_reception_date)
select 0, null
where not exists (select 1
from public.badges_vigik_stock);

-- Storage bucket for syndic members photos
select
    case when exists (
    select 1
    from storage.buckets
    where id = 'membres-photos'
  ) then null else storage.create_bucket('membres-photos', public => true)
  end;

-- Storage RLS policies for 'membres-photos'
-- Allow public read
create policy
if not exists "Public read membres-photos" on storage.objects
  for
select using (bucket_id = 'membres-photos');

-- Allow AG to upload/update/delete
create policy
if not exists "AG write membres-photos" on storage.objects
  for all using
(
    bucket_id = 'membres-photos'
    and auth.role
() = 'authenticated'
    and exists
(select 1
from public.user_roles ur
where ur.user_id = auth.uid() and ur.role = 'ag')
) with check
(
    bucket_id = 'membres-photos'
    and auth.role
() = 'authenticated'
    and exists
(select 1
from public.user_roles ur
where ur.user_id = auth.uid() and ur.role = 'ag')
);
