import { Session } from '../../types/auth';
import { supabase } from '../supabase';

export type CommunityAdvisorAssignment = {
  id: string;
  community_id: string;
  community_name: string;
  province: string;
  advisor_user_id: string;
  advisor_name: string;
  advisor_avatar_url?: string | null;
  assigned_at: string;
};

export async function fetchCommunityAdvisorAssignments(communityId: string) {
  if (!communityId) {
    return [] as CommunityAdvisorAssignment[];
  }
  const { data, error } = await supabase.rpc('get_community_advisor_assignments', {
    p_community_id: communityId
  });
  if (error || !data) {
    return [] as CommunityAdvisorAssignment[];
  }
  return data as CommunityAdvisorAssignment[];
}

export function canManageCommunityAdvisors(session: Session | null) {
  return Boolean(session && ['coordinador_comunidad', 'vocal', 'administrador'].includes(session.role));
}

export async function fetchMyCommunityAdvisors() {
  try {
    const { data, error } = await supabase.rpc('get_my_community_advisors');
    if (error || !data) {
      return [] as CommunityAdvisorAssignment[];
    }
    return data as CommunityAdvisorAssignment[];
  } catch {
    return [] as CommunityAdvisorAssignment[];
  }
}

export async function assignCommunityAdvisor(communityId: string, advisorUserId: string) {
  return supabase.rpc('assign_community_advisor', {
    p_community_id: communityId,
    p_advisor_user_id: advisorUserId
  });
}

export async function removeCommunityAdvisor(assignmentId: string) {
  return supabase.rpc('remove_community_advisor', {
    p_assignment_id: assignmentId
  });
}
