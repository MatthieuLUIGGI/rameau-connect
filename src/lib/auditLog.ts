import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | 'page_view'
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'password_change';

interface LogParams {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  page?: string;
}

export const logAudit = async ({ action, entityType, entityId, details, page }: LogParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile 
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email 
      : user.email;

    await supabase.from('audit_logs' as any).insert({
      user_id: user.id,
      user_email: user.email,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      page: page || window.location.pathname,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};
