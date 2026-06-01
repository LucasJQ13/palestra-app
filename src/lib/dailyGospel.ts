import { supabase } from './supabase';

export type DailyGospelRecord = {
  id?: string;
  date: string;
  title: string;
  citation: string | null;
  gospel_text: string;
  reflection_title: string | null;
  reflection_text: string | null;
  prayer_text: string | null;
  source_name: string;
  source_url: string;
  reflection_source_url: string | null;
  fetched_at?: string | null;
};

function todayInArgentina() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

export async function fetchDailyGospel(values: { sourceUrl: string; reflectionSourceUrl?: string; forceRefresh?: boolean }) {
  const date = todayInArgentina();

  if (!values.forceRefresh) {
    const { data, error } = await supabase
      .from('daily_gospel')
      .select('id, date, title, citation, gospel_text, reflection_title, reflection_text, prayer_text, source_name, source_url, reflection_source_url, fetched_at')
      .eq('date', date)
      .maybeSingle();

    if (!error && data?.gospel_text) {
      return { data: data as DailyGospelRecord, error: null };
    }
  }

  const { data, error } = await supabase.functions.invoke('fetch-daily-gospel', {
    body: {
      date,
      source_url: values.sourceUrl,
      reflection_source_url: values.reflectionSourceUrl || values.sourceUrl
    }
  });

  if (error) {
    return { data: null, error };
  }

  return { data: data?.gospel as DailyGospelRecord | null, error: null };
}
