import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { password } = await req.json().catch(() => ({}))
    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: ok, error: vErr } = await admin.rpc('verify_conseil_password', {
      input_password: password,
    })
    if (vErr || ok !== true) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rows, error: qErr } = await admin
      .from('comptes_rendus_conseil_syndical')
      .select('id,title,date,file_url,link_url,order_index,created_at')
      .order('order_index', { ascending: true })
    if (qErr) throw qErr

    const BUCKET = 'conseil-syndical-reports'
    const items = await Promise.all(
      (rows || []).map(async (r: any) => {
        let signed_url: string | null = null
        if (r.file_url) {
          // Extract storage path after the bucket id
          const marker = `/${BUCKET}/`
          const idx = r.file_url.indexOf(marker)
          const path = idx >= 0 ? r.file_url.substring(idx + marker.length) : null
          if (path) {
            const { data: signed } = await admin.storage
              .from(BUCKET)
              .createSignedUrl(decodeURIComponent(path), 3600)
            signed_url = signed?.signedUrl ?? null
          }
        }
        return {
          id: r.id,
          title: r.title,
          date: r.date,
          link_url: r.link_url,
          signed_url,
          order_index: r.order_index,
          created_at: r.created_at,
        }
      })
    )

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
