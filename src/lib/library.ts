import { supabase } from './supabase';

export type LibrarySection = 'oraciones' | 'cancionero' | 'himno';
export type LibraryStatus = 'publicado' | 'borrador';

export type AppLibraryItem = {
  id: string;
  section: LibrarySection;
  title: string;
  subtitle: string | null;
  body: string;
  image_url: string | null;
  category: string | null;
  source: string | null;
  item_date: string | null;
  status: LibraryStatus;
  sort_order: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type LibraryPermissionDebug = {
  auth_uid: string | null;
  email: string | null;
  profile_id: string | null;
  role: string | null;
  status: string | null;
  can_publish: boolean;
};

export async function fetchLibraryItems(section: LibrarySection): Promise<AppLibraryItem[]> {
  try {
    const { data, error } = await supabase
      .from('app_library_items')
      .select('id, section, title, subtitle, body, image_url, category, source, item_date, status, sort_order, created_by, created_at, updated_at')
      .eq('section', section)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }
    return data as AppLibraryItem[];
  } catch {
    return [];
  }
}

export async function saveLibraryItem(values: {
  id?: string | null;
  section: LibrarySection;
  title: string;
  subtitle?: string | null;
  body: string;
  imageUrl?: string | null;
  category?: string | null;
  source?: string | null;
  itemDate?: string | null;
  status: LibraryStatus;
  sortOrder?: number | null;
}) {
  try {
    return await supabase.rpc('admin_upsert_library_item', {
      p_id: values.id ?? null,
      p_section: values.section,
      p_title: values.title,
      p_subtitle: values.subtitle ?? null,
      p_body: values.body,
      p_image_url: values.imageUrl ?? null,
      p_category: values.category ?? null,
      p_source: values.source ?? null,
      p_item_date: values.itemDate ?? null,
      p_status: values.status,
      p_sort_order: values.sortOrder ?? 100
    });
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function debugLibraryPermission(): Promise<LibraryPermissionDebug | null> {
  try {
    const { data, error } = await supabase.rpc('debug_my_library_permission');
    if (error || !data) {
      return null;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return row as LibraryPermissionDebug;
  } catch {
    return null;
  }
}

export async function archiveLibraryItem(id: string) {
  try {
    return await supabase.rpc('admin_archive_library_item', {
      p_id: id
    });
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
