
-- Create admin board config table
CREATE TABLE public.admin_board_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_board_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only AG members can view admin board config"
ON public.admin_board_config FOR SELECT
USING (has_role(auth.uid(), 'ag'::app_role));

CREATE POLICY "Only AG members can manage admin board config"
ON public.admin_board_config FOR ALL
USING (has_role(auth.uid(), 'ag'::app_role));

-- RPC to verify admin board password
CREATE OR REPLACE FUNCTION public.verify_admin_board_password(input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash TEXT;
  input_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM admin_board_config
  LIMIT 1;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  input_hash := encode(sha256(input_password::bytea), 'hex');
  RETURN input_hash = stored_hash;
END;
$$;

-- RPC to set admin board password (AG only)
CREATE OR REPLACE FUNCTION public.set_admin_board_password(new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  password_hash TEXT;
  existing_id UUID;
BEGIN
  IF NOT has_role(auth.uid(), 'ag'::app_role) THEN
    RAISE EXCEPTION 'Access denied - AG members only';
  END IF;
  
  IF LENGTH(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  
  password_hash := encode(sha256(new_password::bytea), 'hex');
  
  SELECT id INTO existing_id FROM admin_board_config LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    UPDATE admin_board_config SET password_hash = password_hash, updated_at = now() WHERE id = existing_id;
  ELSE
    INSERT INTO admin_board_config (password_hash) VALUES (password_hash);
  END IF;
  
  RETURN TRUE;
END;
$$;
