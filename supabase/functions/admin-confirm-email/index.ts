import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = request.headers.get('Authorization');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    }
    if (!authHeader) {
      throw new Error('Sesion requerida.');
    }

    const { user_id: userId } = await request.json();
    if (!userId) {
      throw new Error('user_id requerido.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const jwt = authHeader.replace('Bearer ', '');
    const { data: caller, error: callerError } = await supabase.auth.getUser(jwt);
    if (callerError || !caller.user) {
      throw new Error('No se pudo validar la sesion administradora.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', caller.user.id)
      .single();

    if (profileError || profile?.role !== 'administrador' || profile?.status !== 'aprobado') {
      throw new Error('Solo Administrador puede confirmar mails.');
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (error) {
      throw new Error(error.message);
    }

    await supabase
      .from('audit_logs')
      .insert({
        actor_id: caller.user.id,
        action: 'admin_confirm_user_email_edge',
        metadata: { user_id: userId, email: data.user?.email ?? null }
      });

    return new Response(JSON.stringify({ ok: true, user_id: userId, email: data.user?.email ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
