import { Role, Session } from '../types/auth';
import { roleRank } from './roles';
import { supabase } from './supabase';

function networkError(error: unknown) {
  return {
    data: null,
    error: {
      message: error instanceof Error ? error.message : 'No se pudo conectar con Supabase.'
    }
  };
}

export type ForumCategory = {
  id: string;
  scope: 'nacional' | 'provincia';
  provinceId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type ForumTopic = {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  minRole: Role;
  authorRole: Role;
  authorId: string;
  authorName: string;
  authorProvince: string | null;
  status: 'abierto' | 'cerrado';
  createdAt: string;
  replyCount: number;
};

export type ForumComment = {
  id: string;
  topicId: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  createdAt: string;
};

export function visibleForumRolesFor(session: Session | null, category?: ForumCategory | null) {
  const rank = roleRank(session?.role ?? 'invitado');
  const roles: Role[] = ['invitado', 'palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'];
  if (session && ['vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role)) {
    return roles;
  }
  if (session && category?.scope === 'provincia' && category.name === session.province && ['vocal', 'coordinador_diocesano'].includes(session.role)) {
    return roles;
  }
  return roles.filter((role) => roleRank(role) <= rank);
}

export function canUseForumCategory(session: Session | null, category: ForumCategory) {
  if (category.scope === 'nacional') {
    return true;
  }
  if (!session || session.status !== 'aprobado') {
    return false;
  }
  if (['asesor', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role)) {
    return true;
  }
  return category.name === session.province;
}

export async function fetchForumCategories(): Promise<ForumCategory[]> {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('id, scope, province_id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return (data as any[]).map((item) => ({
      id: item.id,
      scope: item.scope,
      provinceId: item.province_id,
      name: item.name,
      description: item.description,
      sortOrder: item.sort_order ?? 100
    }));
  } catch {
    return [];
  }
}

export async function fetchForumTopics(categoryId: string): Promise<ForumTopic[]> {
  if (!categoryId) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_forum_topics', {
      p_category_id: categoryId
    });

    if (error || !data) {
      return [];
    }

    return (data as any[]).map((item) => ({
      id: item.id,
      categoryId: item.category_id,
      title: item.title,
      body: item.body,
      minRole: item.min_role,
      authorRole: item.author_role,
      authorId: item.author_id,
      authorName: item.author_name ?? 'Palestrista',
      authorProvince: item.author_province ?? null,
      status: item.status,
      createdAt: item.created_at,
      replyCount: Number(item.reply_count ?? 0)
    }));
  } catch {
    return [];
  }
}

export async function fetchForumComments(topicId: string): Promise<ForumComment[]> {
  if (!topicId) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_forum_comments', {
      p_topic_id: topicId
    });

    if (error || !data) {
      return [];
    }

    return (data as any[]).map((item) => ({
      id: item.id,
      topicId: item.topic_id,
      body: item.body,
      authorId: item.author_id,
      authorName: item.author_name ?? 'Palestrista',
      authorRole: item.author_role,
      createdAt: item.created_at
    }));
  } catch {
    return [];
  }
}

export async function createForumTopic(values: {
  categoryId: string;
  title: string;
  body: string;
  minRole: Role;
}) {
  try {
    return await supabase.rpc('create_forum_topic', {
      p_category_id: values.categoryId,
      p_title: values.title,
      p_body: values.body,
      p_min_role: values.minRole
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function updateForumTopic(values: {
  topicId: string;
  title: string;
  body: string;
  minRole: Role;
}) {
  try {
    return await supabase.rpc('update_forum_topic', {
      p_topic_id: values.topicId,
      p_title: values.title,
      p_body: values.body,
      p_min_role: values.minRole
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function setForumTopicStatus(topicId: string, status: 'abierto' | 'cerrado') {
  try {
    return await supabase.rpc('set_forum_topic_status', {
      p_topic_id: topicId,
      p_status: status
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function archiveForumTopic(topicId: string) {
  try {
    return await supabase.rpc('archive_forum_topic', {
      p_topic_id: topicId
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function createForumComment(topicId: string, body: string) {
  try {
    return await supabase.rpc('create_forum_comment', {
      p_topic_id: topicId,
      p_body: body
    });
  } catch (error) {
    return networkError(error);
  }
}

export async function archiveForumComment(commentId: string) {
  try {
    return await supabase.rpc('archive_forum_comment', {
      p_comment_id: commentId
    });
  } catch (error) {
    return networkError(error);
  }
}
