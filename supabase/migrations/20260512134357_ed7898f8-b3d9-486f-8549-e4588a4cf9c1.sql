
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '1 year';
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_audit_logs_daily') THEN
    PERFORM cron.schedule(
      'purge_audit_logs_daily',
      '0 3 * * *',
      $cmd$ SELECT public.purge_old_audit_logs(); $cmd$
    );
  END IF;
END $$;
