-- Enable pgcrypto for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Replace conseil & admin board password functions to use bcrypt with salt
CREATE OR REPLACE FUNCTION public.set_conseil_password(new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  hashed_pw TEXT;
  existing_id UUID;
BEGIN
  IF NOT has_role(auth.uid(), 'ag'::app_role) THEN
    RAISE EXCEPTION 'Access denied - AG members only';
  END IF;
  IF LENGTH(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  hashed_pw := crypt(new_password, gen_salt('bf', 10));
  SELECT id INTO existing_id FROM conseil_syndical_config LIMIT 1;
  IF existing_id IS NOT NULL THEN
    UPDATE conseil_syndical_config SET password_hash = hashed_pw, updated_at = now() WHERE id = existing_id;
  ELSE
    INSERT INTO conseil_syndical_config (password_hash) VALUES (hashed_pw);
  END IF;
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_conseil_password(input_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM conseil_syndical_config LIMIT 1;
  IF stored_hash IS NULL THEN RETURN FALSE; END IF;
  -- bcrypt hashes start with $2
  IF stored_hash LIKE '$2%' THEN
    RETURN crypt(input_password, stored_hash) = stored_hash;
  END IF;
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_admin_board_password(new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  hashed_pw TEXT;
  existing_id UUID;
BEGIN
  IF NOT has_role(auth.uid(), 'ag'::app_role) THEN
    RAISE EXCEPTION 'Access denied - AG members only';
  END IF;
  IF LENGTH(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  hashed_pw := crypt(new_password, gen_salt('bf', 10));
  SELECT id INTO existing_id FROM admin_board_config LIMIT 1;
  IF existing_id IS NOT NULL THEN
    UPDATE admin_board_config SET password_hash = hashed_pw, updated_at = now() WHERE id = existing_id;
  ELSE
    INSERT INTO admin_board_config (password_hash) VALUES (hashed_pw);
  END IF;
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_admin_board_password(input_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM admin_board_config LIMIT 1;
  IF stored_hash IS NULL THEN RETURN FALSE; END IF;
  IF stored_hash LIKE '$2%' THEN
    RETURN crypt(input_password, stored_hash) = stored_hash;
  END IF;
  RETURN FALSE;
END;
$function$;

-- Make conseil syndical bucket private and lock down read access
UPDATE storage.buckets SET public = false WHERE id = 'conseil-syndical-reports';

DROP POLICY IF EXISTS "Public can view conseil syndical reports" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view conseil syndical reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view conseil syndical reports" ON storage.objects;

-- Only AG members can list/manage objects directly; signed URLs handle reads for users
DROP POLICY IF EXISTS "AG members can manage conseil syndical files" ON storage.objects;
CREATE POLICY "AG members can manage conseil syndical files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'conseil-syndical-reports' AND has_role(auth.uid(), 'ag'::app_role))
WITH CHECK (bucket_id = 'conseil-syndical-reports' AND has_role(auth.uid(), 'ag'::app_role));
