
-- Add last_sign_in_at column to profiles
ALTER TABLE public.profiles ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE;
