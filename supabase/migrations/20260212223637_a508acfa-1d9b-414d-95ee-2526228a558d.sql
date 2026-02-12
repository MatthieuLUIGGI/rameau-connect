
CREATE OR REPLACE FUNCTION public.admin_board_password_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_board_config WHERE password_hash IS NOT NULL);
$$;
