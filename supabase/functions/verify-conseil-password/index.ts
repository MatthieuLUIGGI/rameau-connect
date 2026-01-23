import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for password verification (using Web Crypto API)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { password, action, newPassword } = await req.json();

    // Get authorization header to verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: set password (only AG members)
    if (action === 'set') {
      // Check if user is AG member
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'ag')
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Accès refusé - réservé aux membres AG' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!newPassword || newPassword.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hashedPassword = await hashPassword(newPassword);

      // Check if config exists
      const { data: existingConfig } = await supabase
        .from('conseil_syndical_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingConfig) {
        // Update existing
        await supabase
          .from('conseil_syndical_config')
          .update({ password_hash: hashedPassword })
          .eq('id', existingConfig.id);
      } else {
        // Insert new
        await supabase
          .from('conseil_syndical_config')
          .insert({ password_hash: hashedPassword });
      }

      console.log('Password set successfully by user:', user.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Mot de passe défini avec succès' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: verify password
    if (action === 'verify') {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Mot de passe requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: config } = await supabase
        .from('conseil_syndical_config')
        .select('password_hash')
        .limit(1)
        .maybeSingle();

      if (!config) {
        return new Response(
          JSON.stringify({ error: 'Aucun mot de passe configuré. Contactez un administrateur.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hashedInput = await hashPassword(password);
      const isValid = hashedInput === config.password_hash;

      console.log('Password verification attempt by user:', user.id, 'Result:', isValid);

      return new Response(
        JSON.stringify({ valid: isValid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-conseil-password:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
