import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type PushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
};

function notificationTitle(intent: any) {
  if (String(intent.notification_type ?? '').includes('intencion')) {
    return 'Intenciones';
  }
  if (String(intent.notification_type ?? '').includes('privado')) {
    return 'Mensaje privado';
  }
  if (String(intent.notification_type ?? '').includes('recordatorio') || intent.source_type === 'event') {
    return 'Recordatorio';
  }
  if (intent.target_kind === 'comunidad') {
    return `Aviso comunitario · ${intent.community || intent.target_value || 'Comunidad'}`;
  }
  if (intent.target_kind === 'provincia') {
    return `Aviso provincial · ${intent.province || intent.target_value || 'Provincia'}`;
  }
  return 'Aviso nacional · Palestra';
}

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
      .select('id, created_by, notification_type, title, body, payload, tab_key, source_type, source_id, target_kind, target_value, target_scope, province, community, min_role, status')
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
        title: notificationTitle(intent),
        subtitle: intent.title,
        body: intent.body,
        priority: 'high',
        channelId: 'default',
        data: {
          ...(intent.payload ?? {}),
          notification_type: intent.notification_type,
          intent_id: intent.id,
          tab: intent.tab_key,
          source_type: intent.source_type,
          source_id: intent.source_id,
          province_id: intent.province ?? null,
          community_id: intent.community ?? null,
          scope: intent.target_scope ?? intent.target_kind,
          target_kind: intent.target_kind,
          target_value: intent.target_value,
          min_role: intent.min_role,
          created_by: intent.created_by
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
