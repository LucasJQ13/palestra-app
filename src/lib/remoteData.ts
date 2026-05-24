import { communities as fallbackCommunities, notilestra as fallbackNotilestra } from '../data/content';
import { Session } from '../types/auth';
import { canAccessProvince, roleRank } from './roles';
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
  latitude: number | null;
  longitude: number | null;
  is_active?: boolean | null;
  archived_at?: string | null;
  provinces: {
    name: string;
    region: string;
  } | null;
};

export type AppCommunityLocation = (typeof fallbackCommunities)[number]['locations'][number] & {
  latitude?: number | null;
  longitude?: number | null;
};
export type AppCommunity = Omit<(typeof fallbackCommunities)[number], 'locations'> & {
  locations: AppCommunityLocation[];
};
export type RemoteAgendaItem = {
  id?: string;
  source?: 'event' | 'motivador';
  scope: string;
  province?: string;
  date: string;
  dateGroupKey?: string;
  title: string;
  body: string;
  imageUrl?: string;
  mapUrl?: string;
};

export type PublicationComment = {
  id: string;
  publicationId: string;
  userId: string | null;
  body: string;
  createdAt: string;
  authorName: string;
  authorRole: string;
  authorAvatarUrl?: string | null;
  authorProvince?: string | null;
  authorCommunity?: string | null;
};

export async function fetchCommunities(): Promise<AppCommunity[]> {
  let data: unknown[] | null = null;
  let error: { message?: string } | null = null;
  try {
    const result = await supabase
      .from('communities')
      .select('id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url, latitude, longitude, is_active, archived_at, provinces(name, region)')
      .is('archived_at', null)
      .order('name');
    data = result.data as unknown[] | null;
    error = result.error;
  } catch {
    return [];
  }

  if (error) {
    try {
      const fallbackResult = await supabase
        .from('communities')
        .select('id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url, is_active, archived_at, provinces(name, region)')
        .is('archived_at', null)
        .order('name');
      data = fallbackResult.data as unknown[] | null;
      error = fallbackResult.error;
    } catch {
      return [];
    }
  }

  if (error || !data) {
    return [];
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
      group: row.group_type,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      isActive: row.is_active ?? true
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
      .select('id, title, body, is_public, created_at, archived_at, provinces(name)')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
  } catch {
    return [];
  }
  const { data, error } = result;

  if (error || !data || data.length === 0) {
    return [];
  }

  return data
    .filter((item: any) => canAccessProvince(session ?? null, item.provinces?.name ?? 'Nacional'))
    .map((item: any) => ({
    id: item.id,
    source: 'news' as const,
    scope: item.provinces?.name ? 'Noticia Provincial' : 'Noticia Nacional',
    title: item.title,
    body: item.body,
    province: item.provinces?.name ?? 'Nacional',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  }));
}

export async function updateNewsEntry(values: { id: string; title: string; body: string; isPublic?: boolean }) {
  try {
    return await supabase.rpc('admin_update_news', {
      p_news_id: values.id,
      p_title: values.title,
      p_body: values.body,
      p_is_public: values.isPublic ?? true
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo actualizar la noticia.'
      }
    };
  }
}

export async function archiveNewsEntry(newsId: string) {
  try {
    return await supabase.rpc('admin_archive_news', {
      p_news_id: newsId
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo eliminar la noticia.'
      }
    };
  }
}

export async function createCommunityPublication(values: {
  kind: 'aviso' | 'noticia' | 'fecha' | 'encuesta';
  title: string;
  body: string;
  eventDate?: string | null;
  visibility: 'publica' | 'registrados' | 'sedimentadores';
  pollOptions?: string[];
}) {
  try {
    return await supabase.rpc('create_community_publication', {
      p_kind: values.kind,
      p_title: values.title,
      p_body: values.body,
      p_event_date: values.eventDate ?? null,
      p_visibility: values.visibility,
      p_poll_options: values.pollOptions ?? null
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo conectar con Supabase.'
      }
    };
  }
}

export async function updateCommunityPublication(values: {
  publicationId: string;
  title: string;
  body: string;
  status?: 'activo' | 'cerrado';
}) {
  try {
    return await supabase.rpc('update_community_publication', {
      p_publication_id: values.publicationId,
      p_title: values.title,
      p_body: values.body,
      p_status: values.status ?? 'activo'
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo actualizar la publicacion.'
      }
    };
  }
}

export async function archiveCommunityPublication(publicationId: string) {
  try {
    return await supabase.rpc('archive_community_publication', {
      p_publication_id: publicationId
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo eliminar la publicacion.'
      }
    };
  }
}

export async function fetchCommunityPublications(session?: Session | null) {
  if (session) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_community_publications');
      if (!rpcError && rpcData) {
        return (rpcData as any[]).map((item) => ({
          id: item.id,
          kind: item.kind,
          communityName: item.community_name ?? 'Comunidad',
          visibility: item.visibility,
          eventDate: item.event_date,
          pollOptions: item.poll_options ?? [],
          pollResults: item.poll_results ?? {},
          status: item.status ?? 'activo',
          createdBy: item.created_by ?? null,
          createdAt: item.created_at ?? null,
          authorName: item.author_name ?? 'Palestrista',
          authorRole: item.author_role ?? 'palestrista',
          scope: `${item.kind} - ${item.community_name ?? 'Comunidad'}`,
          title: item.title,
          body: item.event_date ? `${String(item.event_date).slice(0, 10)} - ${item.body}` : item.body,
          imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
        }));
      }
    } catch {
      // Fall back to direct table reads for projects that did not apply the SQL patch yet.
    }
  }

  let result;
  try {
    result = await supabase
      .from('community_publications')
      .select('id, kind, title, body, event_date, visibility, poll_options, poll_results, status, created_by, created_at, profiles(full_name, role), communities(name, provinces(name))')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(100);
  } catch {
    return [];
  }

  const { data, error } = result;
  if (error || !data) {
    return [];
  }

  const role = session?.role ?? 'invitado';
  const canSeeSedimentadores = ['sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(role);
  const canSeeRegistered = role !== 'invitado';

  return (data as any[])
    .filter((item) => {
      const province = item.communities?.provinces?.name ?? 'Nacional';
      const communityName = item.communities?.name ?? '';
      if (!canAccessProvince(session ?? null, province)) {
        return false;
      }
      if (communityName && !['vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(role) && communityName !== session?.communityOfOrigin) {
        return false;
      }
      if (item.visibility === 'sedimentadores') {
        return canSeeSedimentadores;
      }
      if (item.visibility === 'registrados') {
        return canSeeRegistered;
      }
      return true;
    })
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      communityName: item.communities?.name ?? 'Comunidad',
      visibility: item.visibility,
      eventDate: item.event_date,
      pollOptions: item.poll_options ?? [],
      pollResults: item.poll_results ?? {},
      status: item.status ?? 'activo',
      createdBy: item.created_by ?? null,
      createdAt: item.created_at ?? null,
      authorName: item.profiles?.full_name ?? 'Palestrista',
      authorRole: item.profiles?.role ?? 'palestrista',
      scope: `${item.kind} - ${item.communities?.name ?? 'Comunidad'}`,
      title: item.title,
      body: item.event_date ? `${String(item.event_date).slice(0, 10)} - ${item.body}` : item.body,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
    }));
}

export async function voteCommunityPoll(publicationId: string, option: string) {
  try {
    return await supabase.rpc('vote_community_poll', {
      p_publication_id: publicationId,
      p_option: option
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo registrar el voto.'
      }
    };
  }
}

export async function fetchPublicationComments(publicationIds: string[]): Promise<Record<string, PublicationComment[]>> {
  if (publicationIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('publication_comments')
      .select('id, publication_id, user_id, body, created_at, profiles(full_name, role, avatar_url, community_name, provinces(name))')
      .in('publication_id', publicationIds)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return {};
    }

    return (data as any[]).reduce<Record<string, PublicationComment[]>>((groups, item) => {
      const publicationId = item.publication_id;
      groups[publicationId] = groups[publicationId] ?? [];
      groups[publicationId].push({
        id: item.id,
        publicationId,
        userId: item.user_id ?? null,
        body: item.body,
        createdAt: item.created_at,
        authorName: item.profiles?.full_name ?? 'Palestrista',
        authorRole: item.profiles?.role ?? 'palestrista',
        authorAvatarUrl: item.profiles?.avatar_url ?? null,
        authorProvince: item.profiles?.provinces?.name ?? null,
        authorCommunity: item.profiles?.community_name ?? null
      });
      return groups;
    }, {});
  } catch {
    return {};
  }
}

export async function createPublicationComment(publicationId: string, body: string) {
  try {
    return await supabase.rpc('create_publication_comment', {
      p_publication_id: publicationId,
      p_body: body
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo publicar el comentario.'
      }
    };
  }
}

export async function reactToPublication(publicationId: string, reaction = 'amen') {
  try {
    return await supabase.rpc('react_to_publication', {
      p_publication_id: publicationId,
      p_reaction: reaction
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo registrar la reaccion.'
      }
    };
  }
}

export async function reportPublication(publicationId: string, reason: string) {
  try {
    return await supabase.rpc('report_publication', {
      p_publication_id: publicationId,
      p_reason: reason
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo enviar el reporte.'
      }
    };
  }
}

export async function fetchNotilestra(session?: Session | null) {
  let result;
  try {
    result = await supabase
      .from('events')
      .select('id, title, description, starts_at, is_public, archived_at, provinces(name)')
      .is('archived_at', null)
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
    id: item.id,
    source: 'event' as const,
    scope: item.provinces?.name ? `${item.is_public ? 'Agenda' : 'Privado'} - ${item.provinces.name}` : item.is_public ? 'Agenda nacional' : 'Privado nacional',
    province: item.provinces?.name ?? 'Nacional',
    date: String(item.starts_at).slice(0, 10),
    title: item.title,
    body: item.description
  }));
}

export async function updateAgendaEvent(values: { id: string; title: string; body: string; startsAt: string; isPublic?: boolean }) {
  try {
    return await supabase.rpc('admin_update_event', {
      p_event_id: values.id,
      p_title: values.title,
      p_description: values.body,
      p_starts_at: values.startsAt,
      p_is_public: values.isPublic ?? true
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo actualizar el evento.'
      }
    };
  }
}

export async function archiveAgendaEvent(eventId: string) {
  try {
    return await supabase.rpc('admin_archive_event', {
      p_event_id: eventId
    });
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'No se pudo eliminar el evento.'
      }
    };
  }
}

export async function fetchMotivadorPeriods(session?: Session | null): Promise<RemoteAgendaItem[]> {
  let result;
  try {
    result = await supabase
      .from('motivador_periods')
      .select('id, gender, pm_number, selected_dates, starts_on, ends_on, retreat_house, address, opening_time, closing_time, description, place_photo_url, flyer_url, visible_to_lower_roles, status, provinces(name)')
      .eq('is_visible', true)
      .eq('status', 'activo')
      .order('starts_on', { ascending: true });
  } catch {
    return [];
  }

  const { data, error } = result;
  if (error || !data) {
    return [];
  }

  return (data as any[])
    .filter((item) => {
      const currentRole = session?.role ?? 'invitado';
      const minimumRole = item.visible_to_lower_roles ? 'palestrista' : 'sedimentador';
      return canAccessProvince(session ?? null, item.provinces?.name ?? 'Nacional') && roleRank(currentRole) >= roleRank(minimumRole);
    })
    .flatMap((item) => {
      const province = item.provinces?.name ?? 'Nacional';
      const genderLabel = item.gender === 'femenino' ? 'Femenino' : 'Masculino';
      const startsOn = String(item.starts_on).slice(0, 10);
      const endsOn = String(item.ends_on).slice(0, 10);
      const selectedDateList = Array.isArray(item.selected_dates) && item.selected_dates.length > 0
        ? item.selected_dates.map((date: string) => String(date).slice(0, 10))
        : startsOn === endsOn ? [startsOn] : buildDateRange(startsOn, endsOn);
      const selectedDates = formatSpanishDateRange(selectedDateList);
      const description = item.description ? ` ${item.description}` : '';
      const address = item.address ?? 'Direccion a confirmar';
      const opening = item.opening_time ? ` Apertura: ${item.opening_time}.` : '';
      const closing = item.closing_time ? ` Clausura: ${item.closing_time}.` : '';
      const periodId = item.id ?? `${province}-${item.gender}-${item.pm_number}`;

      return selectedDateList.map((date: string) => ({
        id: `${periodId}-${date}`,
        source: 'motivador' as const,
        dateGroupKey: periodId,
        scope: `PM - ${province}`,
        province,
        date,
        title: `PM ${genderLabel} ${item.pm_number}`,
        body: `Dias: ${selectedDates}. Casa de retiro: ${item.retreat_house}. Direccion: ${address}.${opening}${closing}${description}`,
        imageUrl: item.flyer_url ?? item.place_photo_url ?? undefined,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      }));
    });
}

function buildDateRange(startsOn: string, endsOn: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startsOn}T00:00:00`);
  const end = new Date(`${endsOn}T00:00:00`);
  while (!Number.isNaN(cursor.getTime()) && cursor <= end && dates.length < 15) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startsOn];
}

function formatSpanishDateRange(dateList: string[]) {
  const dates = dateList
    .map((date) => new Date(`${date}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) {
    return 'Fecha a confirmar';
  }

  const first = dates[0];
  const last = dates[dates.length - 1];
  const sameDay = first.toDateString() === last.toDateString();
  const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameDay) {
    return `${first.getDate()} de ${spanishMonth(first)} del ${first.getFullYear()}`;
  }
  if (sameMonth) {
    return `del ${first.getDate()} al ${last.getDate()} de ${spanishMonth(first)} del ${first.getFullYear()}`;
  }
  if (sameYear) {
    return `del ${first.getDate()} de ${spanishMonth(first)} al ${last.getDate()} de ${spanishMonth(last)} del ${first.getFullYear()}`;
  }
  return `del ${first.getDate()} de ${spanishMonth(first)} del ${first.getFullYear()} al ${last.getDate()} de ${spanishMonth(last)} del ${last.getFullYear()}`;
}

function spanishMonth(date: Date) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[date.getMonth()] ?? '';
}
