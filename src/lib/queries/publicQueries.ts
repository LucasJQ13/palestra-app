import { Session } from '../../types/auth';
import { isCommunityOperationalLeader, resolveCommunityInternalRole } from '../community/roles';
import { CommunityScope } from '../community/types';
import { supabase } from '../supabase';
import { PublicQueryRecord, PublicQueryStatus } from './types';

export function canAccessPublicQueries(session: Session | null, scope: CommunityScope) {
  return isCommunityOperationalLeader(resolveCommunityInternalRole(session, scope));
}

export async function fetchPublicQueries(): Promise<PublicQueryRecord[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_public_queries');
    if (error) {
      throw error;
    }
    return (data ?? []) as PublicQueryRecord[];
  } catch {
    return [];
  }
}

export function markPublicQueryRead(queryId: string) {
  return supabase.rpc('set_public_query_status', { p_query_id: queryId, p_status: 'leida' });
}

export function setPublicQueryStatus(queryId: string, status: PublicQueryStatus) {
  return supabase.rpc('set_public_query_status', { p_query_id: queryId, p_status: status });
}

export function respondPublicQuery(queryId: string, response: string) {
  return supabase.rpc('respond_public_query', { p_query_id: queryId, p_response: response });
}

export function createInstitutionalQuery(values: {
  targetUserId: string;
  senderName: string;
  senderContact: string;
  message: string;
  origin: 'equipo_diocesano' | 'equipo_nacional';
}) {
  return supabase.rpc('create_institutional_query', {
    p_target_user_id: values.targetUserId,
    p_sender_name: values.senderName,
    p_sender_contact: values.senderContact,
    p_message: values.message,
    p_origin: values.origin
  });
}
