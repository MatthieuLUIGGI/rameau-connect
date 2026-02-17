
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  page text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only AG members can view logs
CREATE POLICY "AG members can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'ag'::app_role));

-- Authenticated users can insert logs (their own actions)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- AG members can insert any logs (for system events)
CREATE POLICY "AG members can insert any audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ag'::app_role));

-- Create index for performance
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
