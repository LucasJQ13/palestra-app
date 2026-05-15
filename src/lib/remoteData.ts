import { communities as fallbackCommunities } from '../data/content';
import { news as fallbackNews, notilestra as fallbackNotilestra } from '../data/content';
import { Session } from '../types/auth';
import { canAccessProvince } from './roles';
import { supabase } from './supabase';

type RemoteCommunityRow = {
  id: string;
  name: string;
  group_type: 'jovenes' | 'adultos';
  address: string;
  phone: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  description: string | null;
  image_url: string | null;
  provinces: {
    name: string;
    region: string;
  } | null;
};

export type AppCommunity = (typeof fallbackCommunities)[number];

export async function fetchCommunities(): Promise<AppCommunity[]> {
  let result;
  try {
    result = await supabase
      .from('communities')
      .select('id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url, provinces(name, region)')
      .order('name');
  } catch {
    return fallbackCommunities;
  }
  const { data, error } = result;

  if (error || !data) {
    return fallbackCommunities;
  }

  const grouped = new Map<string, AppCommunity>();

  (data as unknown as RemoteCommunityRow[]).forEach((row) => {
    const province = row.provinces?.name ?? 'Sin provincia';
    const region = row.provinces?.region ?? 'Sin region';
    const current = grouped.get(province) ?? {
      province,
      region,
      description: 'Comunidades cargadas desde Supabase.',
      locations: []
    };

    current.locations.push({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone ?? 'Sin contacto',
      meetingDay: row.meeting_day ?? 'A confirmar',
      meetingTime: row.meeting_time ?? 'A confirmar',
      description: row.description ?? 'Descripcion pendiente.',
      imageUrl: row.image_url ?? 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png',
      group: row.group_type
    });

    current.description = `${current.locations.length} comunidades activas.`;
    grouped.set(province, current);
  });

  return Array.from(grouped.values());
}

export async function fetchNews(session?: Session | null) {
  let result;
  try {
    result = await supabase
      .from('news')
      .select('title, body, is_public, created_at, provinces(name)')
      .order('created_at', { ascending: false })
      .limit(20);
  } catch {
    return fallbackNews;
  }
  const { data, error } = result;

  if (error || !data || data.length === 0) {
    return fallbackNews;
  }

  return data
    .filter((item: any) => canAccessProvince(session ?? null, item.provinces?.name ?? 'Nacional'))
    .map((item: any) => ({
    scope: item.provinces?.name ? `${item.is_public ? 'Publico' : 'Interno'} - ${item.provinces.name}` : item.is_public ? 'Publico nacional' : 'Interno nacional',
    title: item.title,
    body: item.body,
    province: item.provinces?.name ?? 'Nacional',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  }));
}

export async function fetchNotilestra(session?: Session | null) {
  let result;
  try {
    result = await supabase
      .from('events')
      .select('title, description, starts_at, is_public, provinces(name)')
      .order('starts_at', { ascending: true })
      .limit(30);
  } catch {
    return fallbackNotilestra;
  }
  const { data, error } = result;

  if (error || !data || data.length === 0) {
    return fallbackNotilestra;
  }

  return data
    .filter((item: any) => canAccessProvince(session ?? null, item.provinces?.name ?? 'Nacional'))
    .map((item: any) => ({
    scope: item.provinces?.name ? `${item.is_public ? 'Agenda' : 'Privado'} - ${item.provinces.name}` : item.is_public ? 'Agenda nacional' : 'Privado nacional',
    province: item.provinces?.name ?? 'Nacional',
    date: String(item.starts_at).slice(0, 10),
    title: item.title,
    body: item.description
  }));
}
