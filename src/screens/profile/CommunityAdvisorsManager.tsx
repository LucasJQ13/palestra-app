import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity } from '../../lib/remoteData';
import { AdminUser, PublicUserDirectoryRecord } from '../../lib/profiles';
import {
  CommunityAdvisorAssignment,
  assignCommunityAdvisor,
  canManageCommunityAdvisors,
  fetchCommunityAdvisorAssignments,
  removeCommunityAdvisor
} from '../../lib/community/advisors';
import { APP_MESSAGES } from '../../lib/appMessages';
import { Session } from '../../types/auth';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

type DirectoryUser = AdminUser | PublicUserDirectoryRecord;

function manageableCommunityGroups(session: Session, communities: AppCommunity[]) {
  if (session.role === 'administrador') {
    return communities;
  }
  if (session.role === 'vocal') {
    return communities.filter((group) => group.province === session.province);
  }
  if (session.role === 'coordinador_comunidad') {
    return communities
      .filter((group) => group.province === session.province)
      .map((group) => ({
        ...group,
        locations: group.locations.filter((community) => community.name === session.communityOfOrigin)
      }))
      .filter((group) => group.locations.length > 0);
  }
  return [];
}

export function CommunityAdvisorsManager({
  session,
  communities,
  users,
  isDark,
  onFeedback,
  onAssignmentsChanged
}: {
  session: Session;
  communities: AppCommunity[];
  users: DirectoryUser[];
  isDark: boolean;
  onFeedback: (message: string) => void;
  onAssignmentsChanged: () => void;
}) {
  const communityGroups = useMemo(
    () => manageableCommunityGroups(session, communities),
    [communities, session.communityOfOrigin, session.province, session.role]
  );
  const [province, setProvince] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [assignments, setAssignments] = useState<CommunityAdvisorAssignment[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedGroup = communityGroups.find((group) => group.province === province) ?? communityGroups[0];
  const selectedCommunity = selectedGroup?.locations.find((community) => community.id === communityId)
    ?? selectedGroup?.locations[0];

  useEffect(() => {
    if (!selectedGroup) {
      setProvince('');
      setCommunityId('');
      return;
    }
    if (province !== selectedGroup.province) {
      setProvince(selectedGroup.province);
    }
    if (selectedCommunity?.id && communityId !== selectedCommunity.id) {
      setCommunityId(selectedCommunity.id);
    }
  }, [communityGroups, province, communityId, selectedGroup?.province, selectedCommunity?.id]);

  async function refreshAssignments() {
    if (!selectedCommunity?.id) {
      setAssignments([]);
      return;
    }
    setAssignments(await fetchCommunityAdvisorAssignments(selectedCommunity.id));
  }

  useEffect(() => {
    refreshAssignments();
  }, [selectedCommunity?.id]);

  const assignedIds = new Set(assignments.map((assignment) => assignment.advisor_user_id));
  const availableAdvisors = assignments.length >= 2 ? [] : users
    .filter((user) => (
      user.status === 'aprobado'
      && user.role === 'asesor'
      && user.province === selectedGroup?.province
      && !assignedIds.has(user.id)
    ))
    .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));

  async function assign(user: DirectoryUser) {
    if (!selectedCommunity?.id || saving) {
      return;
    }
    setSaving(true);
    const { error } = await assignCommunityAdvisor(selectedCommunity.id, user.id);
    setSaving(false);
    if (error) {
      onFeedback(error.message);
      return;
    }
    onFeedback(APP_MESSAGES.community.advisorAssigned);
    await refreshAssignments();
    onAssignmentsChanged();
  }

  async function remove(assignment: CommunityAdvisorAssignment) {
    if (saving) {
      return;
    }
    setSaving(true);
    const { error } = await removeCommunityAdvisor(assignment.id);
    setSaving(false);
    if (error) {
      onFeedback(error.message);
      return;
    }
    onFeedback(APP_MESSAGES.community.advisorRemoved);
    await refreshAssignments();
    onAssignmentsChanged();
  }

  if (!canManageCommunityAdvisors(session)) {
    return null;
  }

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.advisorTitle}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>
        {APP_MESSAGES.community.advisorHelp}
      </Text>

      {communityGroups.length > 1 ? (
        <>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Provincia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {communityGroups.map((group) => (
              <TouchableOpacity
                key={group.province}
                style={[styles.filterChip, isDark && styles.surfaceRowDark, selectedGroup?.province === group.province && styles.filterChipActive]}
                onPress={() => {
                  setProvince(group.province);
                  setCommunityId(group.locations[0]?.id ?? '');
                }}
              >
                <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, selectedGroup?.province === group.province && styles.filterChipTextActive]}>
                  {group.province}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : null}

      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Comunidad</Text>
      <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
        {(selectedGroup?.locations ?? []).map((community) => (
          <TouchableOpacity
            key={community.id ?? community.name}
            style={[styles.dropdownItem, isDark && styles.dropdownItemDark, selectedCommunity?.id === community.id && styles.communityChoiceActive]}
            onPress={() => setCommunityId(community.id ?? '')}
          >
            <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark, selectedCommunity?.id === community.id && styles.filterChipTextActive]}>
              {community.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Asesores asignados</Text>
      {assignments.length === 0 ? (
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.advisorEmpty}</Text>
      ) : null}
      {assignments.map((assignment) => (
        <View key={assignment.id} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
          <View style={styles.adminUserHeaderText}>
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{assignment.advisor_name}</Text>
            <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Asesor de {assignment.community_name}</Text>
          </View>
          <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={() => remove(assignment)} disabled={saving}>
            <Ionicons name="close-outline" size={15} color="#B93232" />
            <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ))}

      {availableAdvisors.length > 0 ? (
        <>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Asignar asesor</Text>
          <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
            {availableAdvisors.map((user) => (
              <TouchableOpacity key={user.id} style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => assign(user)} disabled={saving}>
                <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{user.full_name ?? 'Asesor sin nombre'}</Text>
                <Ionicons name="add-circle-outline" size={18} color={palette.red} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}
