-- Create a secure RPC function to verify the conseil syndical password
CREATE OR REPLACE FUNCTION public.verify_conseil_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
  input_hash TEXT;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO stored_hash
  FROM conseil_syndical_config
  LIMIT 1;
  
  -- If no password is configured, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Hash the input password using SHA256 and compare
  input_hash := encode(sha256(input_password::bytea), 'hex');
  
  RETURN input_hash = stored_hash;
END;
$$;

-- Create a function to set the conseil syndical password (only for AG members)
CREATE OR REPLACE FUNCTION public.set_conseil_password(new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  password_hash TEXT;
  existing_id UUID;
BEGIN
  -- Check if user has AG role
  IF NOT has_role(auth.uid(), 'ag'::app_role) THEN
    RAISE EXCEPTION 'Access denied - AG members only';
  END IF;
  
  -- Validate password strength
  IF LENGTH(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  
  -- Hash the password
  password_hash := encode(sha256(new_password::bytea), 'hex');
  
  -- Check if config exists
  SELECT id INTO existing_id FROM conseil_syndical_config LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    -- Update existing
    UPDATE conseil_syndical_config SET password_hash = password_hash, updated_at = now() WHERE id = existing_id;
  ELSE
    -- Insert new
    INSERT INTO conseil_syndical_config (password_hash) VALUES (password_hash);
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_conseil_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_conseil_password(TEXT) TO authenticated;