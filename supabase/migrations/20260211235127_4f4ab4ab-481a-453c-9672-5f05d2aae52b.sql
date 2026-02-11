
CREATE OR REPLACE FUNCTION public.set_admin_board_password(new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
  
  hashed_pw := encode(sha256(new_password::bytea), 'hex');
  
  SELECT id INTO existing_id FROM admin_board_config LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    UPDATE admin_board_config SET password_hash = hashed_pw, updated_at = now() WHERE id = existing_id;
  ELSE
    INSERT INTO admin_board_config (password_hash) VALUES (hashed_pw);
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Fix the same bug in set_conseil_password
CREATE OR REPLACE FUNCTION public.set_conseil_password(new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
  
  hashed_pw := encode(sha256(new_password::bytea), 'hex');
  
  SELECT id INTO existing_id FROM conseil_syndical_config LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    UPDATE conseil_syndical_config SET password_hash = hashed_pw, updated_at = now() WHERE id = existing_id;
  ELSE
    INSERT INTO conseil_syndical_config (password_hash) VALUES (hashed_pw);
  END IF;
  
  RETURN TRUE;
END;
$$;
