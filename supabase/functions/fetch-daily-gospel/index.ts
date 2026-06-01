import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const defaultSourceUrl = 'https://donbosco.org.ar/home/evangelio';

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToLines(html: string) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(body)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function sliceBetween(lines: string[], startIndex: number, endMarkers: string[]) {
  const endIndex = lines.findIndex((line, index) => index > startIndex && endMarkers.some((marker) => line.toLowerCase().includes(marker)));
  return lines.slice(startIndex + 1, endIndex > -1 ? endIndex : undefined).join('\n\n').trim();
}

function parseDonBosco(html: string, sourceUrl: string, reflectionSourceUrl: string) {
  const lines = htmlToLines(html);
  const dateLineIndex = lines.findIndex((line) => /\b\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\b/i.test(line));
  const title = dateLineIndex > -1 ? lines[dateLineIndex] : 'Evangelio del Dia';
  const citation = dateLineIndex > -1 ? lines[dateLineIndex + 1] ?? null : null;
  const wordIndex = lines.findIndex((line) => line.toLowerCase().includes('la palabra me dice'));
  const salesianIndex = lines.findIndex((line) => line.toLowerCase().includes('con corazón salesiano') || line.toLowerCase().includes('con corazon salesiano'));
  const prayerIndex = lines.findIndex((line) => line.toLowerCase().includes('a la palabra') && line.toLowerCase().includes('le digo'));
  const footerIndex = lines.findIndex((line) => line.toLowerCase().includes('suscripción al boletín') || line.toLowerCase().includes('suscripcion al boletin'));

  const gospelText = dateLineIndex > -1
    ? lines.slice(dateLineIndex + 2, wordIndex > -1 ? wordIndex : undefined).join('\n\n').trim()
    : '';

  const firstReflection = wordIndex > -1 ? sliceBetween(lines, wordIndex, ['con corazón salesiano', 'con corazon salesiano', 'a la palabra']) : '';
  const salesianReflection = salesianIndex > -1 ? sliceBetween(lines, salesianIndex, ['a la palabra', 'suscripción', 'suscripcion']) : '';
  const reflectionText = [firstReflection, salesianReflection].filter(Boolean).join('\n\n');
  const prayerText = prayerIndex > -1
    ? lines.slice(prayerIndex + 1, footerIndex > -1 ? footerIndex : undefined).join('\n\n').trim()
    : '';

  if (!gospelText) {
    throw new Error('No pude extraer el texto del Evangelio desde Don Bosco.');
  }

  return {
    title,
    citation,
    gospel_text: gospelText,
    reflection_title: reflectionText ? 'Reflexion' : null,
    reflection_text: reflectionText || null,
    prayer_text: prayerText || null,
    source_name: 'Don Bosco Argentina',
    source_url: sourceUrl,
    reflection_source_url: reflectionSourceUrl
  };
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

    const payload = await request.json().catch(() => ({}));
    const date = String(payload.date ?? new Date().toISOString().slice(0, 10));
    const sourceUrl = String(payload.source_url || defaultSourceUrl);
    const reflectionSourceUrl = String(payload.reflection_source_url || sourceUrl);

    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Palestra APP/0.1 daily gospel fetcher'
      }
    });
    if (!response.ok) {
      throw new Error(`La fuente respondio HTTP ${response.status}.`);
    }

    const html = await response.text();
    const parsed = parseDonBosco(html, sourceUrl, reflectionSourceUrl);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('daily_gospel')
      .upsert({
        date,
        ...parsed,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'date' })
      .select('id, date, title, citation, gospel_text, reflection_title, reflection_text, prayer_text, source_name, source_url, reflection_source_url, fetched_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ ok: true, gospel: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
