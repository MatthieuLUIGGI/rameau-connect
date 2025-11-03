-- Create role_requests table
CREATE TABLE IF NOT EXISTS public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  UNIQUE(user_id, status)
);

-- Enable RLS
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own role requests"
ON public.role_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own requests (only if they don't have a pending one)
CREATE POLICY "Users can create role requests"
ON public.role_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- AG members can view all requests
CREATE POLICY "AG members can view all role requests"
ON public.role_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ag'::app_role));

-- AG members can update requests
CREATE POLICY "AG members can update role requests"
ON public.role_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ag'::app_role));

-- Function to notify AG members of new role requests
CREATE OR REPLACE FUNCTION public.notify_ag_members_of_role_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ag_member_id uuid;
  requester_name text;
BEGIN
  -- Get requester's name from profiles
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO requester_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notifications for all AG members
  FOR ag_member_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'ag'
  LOOP
    INSERT INTO public.notifications (user_id, type, reference_id, title)
    VALUES (
      ag_member_id,
      'role_request',
      NEW.id,
      'Nouvelle demande de rôle AG de ' || COALESCE(requester_name, 'un utilisateur')
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to notify AG members when a new role request is created
CREATE TRIGGER on_role_request_created
  AFTER INSERT ON public.role_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_ag_members_of_role_request();

-- Add role_request to notification_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid 
                 WHERE t.typname = 'notification_type' 
                 AND e.enumlabel = 'role_request') THEN
    ALTER TYPE notification_type ADD VALUE 'role_request';
  END IF;
END $$;