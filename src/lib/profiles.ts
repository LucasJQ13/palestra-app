import { supabase } from './supabase';

function networkError(error: unknown) {
  return {
    data: null,
    error: {
      message: error instanceof Error ? error.message : 'No se pudo conectar con Supabase.'
    }
  };
}

export type PendingProfile = {
  id: string;
  full_name: string;
  status: string;
  role: string;
  community_name: string | null;
};

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  province: string | null;
  community_name: string | null;
  status: string;
  role: string;
  email_confirmed_at: string | null;
};

export type CommunityMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  community_name: string | null;
  province: string | null;
};

export async function fetchPendingProfiles(): Promise<PendingProfile[]> {
  const { data, error } = await supabase.rpc('admin_get_pending_profiles');

  if (error || !data) {
    return [];
  }

  return data as PendingProfile[];
}

export async function approveProfile(id: string, role: string) {
  return supabase.rpc('admin_approve_profile', {
    p_profile_id: id,
    p_role: role
  });
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase.rpc('admin_get_users');

    if (error || !data) {
      return [];
    }

    return data as AdminUser[];
  } catch {
    return [];
  }
}

export async function updateAdminUser(values: {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  province: string;
  communityName: string;
  status: string;
  role: string;
}) {
  try {
    return await supabase.rpc('admin_update_user', {
      p_profile_id: values.id,
      p_email: values.email,
      p_password: values.password || null,
      p_full_name: values.fullName,
      p_phone: values.phone,
      p_province: values.province,
      p_community_name: values.communityName,
      p_status: values.status,
      p_role: values.role
    });
  } catch (error) {
    return networkError(error);
  }
}

export type UserRequestRecord = {
  id: string;
  user_id: string | null;
  title: string;
  requester: string;
  definition: string;
  created_at: string;
  status: string;
  admin_message: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  resolved_by_role: string | null;
  target_user_id?: string | null;
  target_user_name?: string | null;
  target_role?: string | null;
  community_name?: string | null;
};

export async function fetchMyRequests(): Promise<UserRequestRecord[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_requests');
    if (error || !data) {
      return [];
    }
    return data as UserRequestRecord[];
  } catch {
    return [];
  }
}

export async function fetchAdminRequests(): Promise<UserRequestRecord[]> {
  try {
    const { data, error } = await supabase.rpc('admin_get_requests');
    if (error || !data) {
      return [];
    }
    return data as UserRequestRecord[];
  } catch {
    return [];
  }
}

export async function createUserRequest(requestType: string, details: string) {
  try {
    return await supabase.rpc('create_user_request', {
      p_request_type: requestType,
      p_details: details
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function fetchMyCommunityMembers(): Promise<CommunityMember[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_community_members');
    if (error || !data) {
      return [];
    }
    return data as CommunityMember[];
  } catch {
    return [];
  }
}

export async function createLeadershipChangeRequest(values: {
  successorUserId: string;
  successorRole: string;
  details: string;
}) {
  try {
    return await supabase.rpc('create_leadership_change_request', {
      p_successor_user_id: values.successorUserId,
      p_successor_role: values.successorRole,
      p_details: values.details
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function resolveUserRequest(requestId: string, status: 'aprobada' | 'rechazada', message: string, assignRole?: string | null) {
  try {
    return await supabase.rpc('admin_resolve_user_request', {
      p_request_id: requestId,
      p_status: status,
      p_admin_message: message,
      p_assign_role: assignRole ?? null
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function confirmAdminUserEmail(id: string) {
  try {
    return await supabase.rpc('admin_confirm_user_email', {
      p_user_id: id
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function updateMyProfile(values: {
  fullName: string;
  phone: string;
  province: string;
  communityName: string;
}) {
  return supabase.rpc('update_my_profile', {
    p_full_name: values.fullName,
    p_phone: values.phone,
    p_province: values.province,
    p_community_name: values.communityName
  });
}

export async function updateMyAvatar(avatarUrl: string) {
  try {
    return await supabase.rpc('update_my_avatar', {
      p_avatar_url: avatarUrl
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function createNews(title: string, body: string, isPublic: boolean) {
  return supabase.rpc('admin_create_news', {
    p_title: title,
    p_body: body,
    p_is_public: isPublic
  });
}

export async function createEvent(title: string, description: string, startsAt: string, isPublic: boolean) {
  return supabase.rpc('admin_create_event', {
    p_title: title,
    p_description: description,
    p_starts_at: startsAt,
    p_is_public: isPublic
  });
}

export type AppTabSetting = {
  key: string;
  label: string;
  is_visible: boolean;
  sort_order: number;
  visible_roles: string[] | null;
};

export async function fetchAppTabs() {
  const { data, error } = await supabase
    .from('app_tabs')
    .select('key, label, is_visible, sort_order, visible_roles')
    .order('sort_order');

  if (error || !data) {
    return [];
  }

  return data as AppTabSetting[];
}

export async function updateAppTab(key: string, label: string, isVisible: boolean, visibleRoles?: string[] | null) {
  return supabase.rpc('admin_update_tab', {
    p_key: key,
    p_label: label,
    p_is_visible: isVisible,
    p_visible_roles: visibleRoles ?? null
  });
}

export async function createAppTab(key: string, label: string, visibleRoles?: string[] | null) {
  return supabase.rpc('admin_create_tab', {
    p_key: key,
    p_label: label,
    p_visible_roles: visibleRoles ?? null
  });
}

export async function updateAppTabPosition(values: {
  key: string;
  label: string;
  isVisible: boolean;
  sortOrder: number;
  visibleRoles?: string[] | null;
}) {
  return supabase.rpc('admin_set_tab_position', {
    p_key: values.key,
    p_label: values.label,
    p_is_visible: values.isVisible,
    p_sort_order: values.sortOrder,
    p_visible_roles: values.visibleRoles ?? null
  });
}

export type AppContentBlock = {
  tab_key: string;
  title: string;
  body: string;
  blocks?: ContentEditorBlock[] | null;
  updated_at: string | null;
};

export type ContentEditorBlock = {
  id: string;
  type: 'titulo' | 'texto' | 'imagen';
  value: string;
};

export type AdminConfigRecord = Record<string, any>;

export type AppMaterialRecord = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  visibility: string | null;
  required_permission: string | null;
  file_url: string | null;
  file_path: string | null;
  sort_order: number | null;
  archived_at: string | null;
  created_at: string | null;
};

export type NewsDraftRecord = {
  id: string;
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function fetchAdminConfig(): Promise<AdminConfigRecord | null> {
  try {
    const { data, error } = await supabase.rpc('get_admin_config');
    if (error || !data) {
      return null;
    }
    return data as AdminConfigRecord;
  } catch {
    return null;
  }
}

export async function saveAdminConfig(config: AdminConfigRecord) {
  try {
    return await supabase.rpc('admin_update_config', {
      p_config: config
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function saveAdminInstagram(instagram: string) {
  try {
    return await supabase.rpc('admin_update_instagram', {
      p_instagram: instagram
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function fetchAppMaterials(): Promise<AppMaterialRecord[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('id, title, description, category, visibility, required_permission, file_url, file_path, sort_order, archived_at, created_at')
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error || !data) {
      return [];
    }
    return data as AppMaterialRecord[];
  } catch {
    return [];
  }
}

export async function saveAppMaterial(values: {
  id?: string | null;
  title: string;
  description: string;
  category: string;
  visibility: string;
  requiredPermission?: string | null;
  fileUrl?: string | null;
  filePath?: string | null;
  sortOrder?: number | null;
}) {
  try {
    return await supabase.rpc('admin_upsert_material', {
      p_id: values.id ?? null,
      p_title: values.title,
      p_description: values.description,
      p_category: values.category,
      p_visibility: values.visibility,
      p_required_permission: values.requiredPermission ?? null,
      p_file_url: values.fileUrl ?? null,
      p_file_path: values.filePath ?? null,
      p_sort_order: values.sortOrder ?? 100
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function archiveAppMaterial(id: string) {
  try {
    return await supabase.rpc('admin_archive_material', {
      p_id: id
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function fetchNewsDrafts(): Promise<NewsDraftRecord[]> {
  try {
    const { data, error } = await supabase
      .from('news_drafts')
      .select('id, title, body, category, image_url, is_featured, status, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error || !data) {
      return [];
    }
    return data as NewsDraftRecord[];
  } catch {
    return [];
  }
}

export async function saveNewsDraft(values: {
  id?: string | null;
  title: string;
  body: string;
  category: string;
  imageUrl?: string | null;
  isFeatured: boolean;
  status: string;
}) {
  try {
    return await supabase.rpc('admin_upsert_news_draft', {
      p_id: values.id ?? null,
      p_title: values.title,
      p_body: values.body,
      p_category: values.category,
      p_image_url: values.imageUrl ?? null,
      p_is_featured: values.isFeatured,
      p_status: values.status
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function fetchAppContent() {
  const { data, error } = await supabase
    .from('app_content')
    .select('tab_key, title, body, blocks, updated_at')
    .order('tab_key');

  if (error || !data) {
    return [];
  }

  return data as AppContentBlock[];
}

export async function updateAppContent(tabKey: string, title: string, body: string, blocks?: ContentEditorBlock[]) {
  return supabase.rpc('admin_update_app_content', {
    p_tab_key: tabKey,
    p_title: title,
    p_body: body,
    p_blocks: blocks ?? null
  });
}

export async function updateCommunity(id: string, values: {
  name?: string;
  address?: string;
  phone?: string;
  meeting_day?: string;
  meeting_time?: string;
  description?: string;
}) {
  try {
    return await supabase.rpc('admin_update_community', {
      p_community_id: id,
      p_name: values.name ?? null,
      p_address: values.address ?? null,
      p_phone: values.phone ?? null,
      p_meeting_day: values.meeting_day ?? null,
      p_meeting_time: values.meeting_time ?? null,
      p_description: values.description ?? null
    });
  } catch (error) {
    return networkError(error);
  }
}
