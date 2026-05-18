import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type PushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    }

    const { intent_id: intentId } = await request.json();
    if (!intentId) {
      throw new Error('intent_id requerido.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data: intent, error: intentError } = await supabase
      .from('notification_intents')
      .select('id, title, body, payload, tab_key, source_type, source_id, status')
      .eq('id', intentId)
      .single();

    if (intentError || !intent) {
      throw new Error(intentError?.message ?? 'No se encontro la intencion de notificacion.');
    }

    const { data: recipients, error: recipientsError } = await supabase.rpc('get_notification_recipients', {
      p_intent_id: intentId
    });

    if (recipientsError) {
      throw new Error(recipientsError.message);
    }

    const tokens = Array.from(new Set((recipients ?? []).map((item: any) => item.expo_push_token).filter(Boolean)));
    if (tokens.length === 0) {
      await supabase
        .from('notification_intents')
        .update({
          status: 'procesada',
          sent_count: 0,
          failed_count: 0,
          processed_at: new Date().toISOString(),
          error_message: 'No hay dispositivos con token activo para este alcance.'
        })
        .eq('id', intentId);

      return new Response(JSON.stringify({ ok: true, sent: 0, failed: 0, message: 'Sin destinatarios activos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const tokenGroup of chunk(tokens, 100)) {
      const messages = tokenGroup.map((token) => ({
        to: token,
        sound: 'default',
        title: intent.title,
        body: intent.body,
        data: {
          ...(intent.payload ?? {}),
          intent_id: intent.id,
          tab: intent.tab_key,
          source_type: intent.source_type,
          source_id: intent.source_id
        }
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messages)
      });

      if (!response.ok) {
        failed += tokenGroup.length;
        errors.push(`Expo Push HTTP ${response.status}`);
        continue;
      }

      const payload = await response.json();
      const tickets = Array.isArray(payload.data) ? payload.data as PushTicket[] : [payload.data as PushTicket];
      for (const ticket of tickets) {
        if (ticket?.status === 'ok') {
          sent += 1;
        } else {
          failed += 1;
          errors.push(ticket?.message ?? 'Error desconocido de Expo Push');
        }
      }
    }

    await supabase
      .from('notification_intents')
      .update({
        status: failed > 0 && sent === 0 ? 'fallida' : 'procesada',
        sent_count: sent,
        failed_count: failed,
        sent_at: sent > 0 ? new Date().toISOString() : null,
        processed_at: new Date().toISOString(),
        error_message: errors.slice(0, 5).join(' | ') || null
      })
      .eq('id', intentId);

    return new Response(JSON.stringify({ ok: failed === 0, sent, failed, errors: errors.slice(0, 5) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
