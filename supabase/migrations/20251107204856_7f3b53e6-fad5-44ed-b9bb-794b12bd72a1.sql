-- Add apartment_number to profiles table
ALTER TABLE public.profiles
ADD COLUMN apartment_number INTEGER;

-- Add constraint to ensure apartment_number is between 1 and 113
ALTER TABLE public.profiles
ADD CONSTRAINT apartment_number_range CHECK (apartment_number >= 1 AND apartment_number <= 113);

-- Add apartment_number to votes table
ALTER TABLE public.votes
ADD COLUMN apartment_number INTEGER NOT NULL DEFAULT 1;

-- Remove the default after adding the column
ALTER TABLE public.votes
ALTER COLUMN apartment_number DROP DEFAULT;

-- Create unique constraint on votes to ensure one vote per apartment per poll
ALTER TABLE public.votes
ADD CONSTRAINT unique_vote_per_apartment_per_poll UNIQUE (sondage_id, apartment_number);

-- Drop the old constraint if it exists (one vote per user per poll is no longer needed)
-- We keep user_id to track who voted, but the uniqueness is on apartment_number
-- Note: We can't have both constraints, so we need to decide which one to keep
-- Let's keep both user_id for tracking and add apartment_number for the unique constraint