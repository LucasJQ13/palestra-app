import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    const { token, projectId, runtime } = await request.json();
    if (!token || typeof token !== 'string') {
      throw new Error('Token Expo requerido.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const jwt = authHeader.replace('Bearer ', '');
    const { data: caller, error: callerError } = await supabase.auth.getUser(jwt);
    if (callerError || !caller.user) {
      throw new Error('No se pudo validar la sesion.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', caller.user.id)
      .single();

    if (profileError || profile?.role !== 'administrador' || profile?.status !== 'aprobado') {
      throw new Error('Solo Administrador puede ejecutar diagnostico push.');
    }

    const message = {
      to: token,
      sound: 'default',
      title: 'Aviso nacional · Palestra',
      subtitle: 'Prueba push',
      body: 'Notificación remota de prueba para este dispositivo.',
      priority: 'high',
      channelId: 'default',
      data: {
        notification_type: 'debug_push',
        source_type: 'debug',
        source_id: null,
        province_id: null,
        community_id: null,
        scope: 'device',
        created_by: caller.user.id,
        debug: true,
        projectId,
        runtime,
        requestedAt: new Date().toISOString()
      }
    };

    const sendResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const sendBody = await sendResponse.json().catch(() => null);
    const ticket = sendBody?.data;
    const ticketId = Array.isArray(ticket) ? ticket[0]?.id : ticket?.id;

    let receiptBody = null;
    if (ticketId) {
      await sleep(1800);
      const receiptResponse = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [ticketId] })
      });
      receiptBody = await receiptResponse.json().catch(() => null);
    }

    return new Response(JSON.stringify({
      ok: sendResponse.ok,
      expoHttpStatus: sendResponse.status,
      tokenPrefix: token.slice(0, 24),
      projectId,
      runtime,
      ticket: sendBody,
      ticketId,
      receipt: receiptBody
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
