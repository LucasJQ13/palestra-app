import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminUser, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { displayRoleLabel } from '../../lib/profileDisplay';
import { AdminModule, PublicProfilePreview } from '../../types/appUi';
import { Role, Session } from '../../types/auth';
import { internalTestSessions } from '../../lib/internalTestSessions';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

type AdminStat = { label: string; value: string; icon: keyof typeof Ionicons.glyphMap };

export function AdminOverviewPanel({
  isDark,
  session,
  adminDraftSummary,
  showLeadershipUsersSummary,
  canManageUsers,
  leadershipSummaryUsers,
  provinceRoleLabels,
  roleAliases,
  isCommunityLeader,
  canAdministrateCommunities,
  canOpenCommunityAdmin,
  onToggleLeadershipUsers,
  onOpenCoordinations,
  onOpenPublicProfile,
  onSetAdminModule,
  onSetCommunityPanel,
  onViewAsSession
}: {
  isDark: boolean;
  session: Session;
  adminDraftSummary: AdminStat[];
  showLeadershipUsersSummary: boolean;
  canManageUsers: boolean;
  leadershipSummaryUsers: AdminUser[];
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  isCommunityLeader: boolean;
  canAdministrateCommunities: boolean;
  canOpenCommunityAdmin: boolean;
  onToggleLeadershipUsers: () => void;
  onOpenCoordinations: () => void;
  onOpenPublicProfile: (profile: PublicProfilePreview) => void;
  onSetAdminModule: (module: AdminModule) => void;
  onSetCommunityPanel: () => void;
  onViewAsSession: (session: Session) => void;
}) {
  const canOpenModeration = ['administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano'].includes(session.role);

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <View style={styles.adminStatRow}>
        {adminDraftSummary.map((item) => (
          <TouchableOpacity key={item.label} style={[styles.adminStat, isDark && styles.surfaceCardDark]} activeOpacity={0.84} onPress={() => item.label === 'Usuarios' ? onToggleLeadershipUsers() : undefined}>
            <Ionicons name={item.icon} size={18} color={palette.red} />
            <Text style={styles.adminStatNumber}>{item.value}</Text>
            <Text style={[styles.adminStatLabel, isDark && styles.textDarkMuted]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {showLeadershipUsersSummary && canManageUsers ? (
        <ScrollView style={styles.leadershipUsersList} nestedScrollEnabled showsVerticalScrollIndicator>
          {leadershipSummaryUsers.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay usuarios cargados para visualizar.</Text> : null}
          {leadershipSummaryUsers.map((user) => {
            const role = (user.role || 'palestrista') as Role;
            return (
              <TouchableOpacity
                key={'summary-' + user.id}
                style={[styles.leadershipUserRow, isDark && styles.surfaceRowDark]}
                activeOpacity={0.85}
                onPress={() => onOpenPublicProfile({
                  id: user.id,
                  fullName: user.full_name ?? 'Usuario sin nombre',
                  role,
                  province: user.province,
                  communityName: user.community_name,
                  avatarUrl: user.avatar_url,
                  contact: user.phone ?? '',
                  displayRoleLabel: user.display_role_label ?? null,
                  genderPreference: user.gender_preference ?? null,
                  nickname: user.nickname ?? null,
                  credentialNameMode: user.credential_name_mode ?? 'name',
                  perseveranceStartYear: user.perseverance_start_year ?? null,
                  personalPmType: user.personal_pm_type ?? null,
                  personalPmNumber: user.personal_pm_number ?? null,
                  personalPmProvince: user.personal_pm_province ?? null,
                  personalPmMotto: user.personal_pm_motto ?? user.pm_motto ?? null,
                  pmMotto: user.pm_motto ?? null
                })}
              >
                <View style={styles.adminUserHeaderText}>
                  <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{user.full_name ?? 'Usuario sin nombre'}</Text>
                  {user.nickname ? <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Apodo: {user.nickname}</Text> : null}
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>
                    {displayRoleLabel(role, user.province, provinceRoleLabels, roleAliases, user.display_role_label, user.gender_preference ?? null)} - {user.province ?? 'Sin provincia'}
                  </Text>
                </View>
                <Ionicons name="id-card-outline" size={18} color={palette.red} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Accesos rapidos</Text>
      <View style={styles.adminQuickGrid}>
        {[
          { label: isCommunityLeader ? 'Nuevo aviso comunitario' : 'Nueva noticia', module: isCommunityLeader ? 'muro_comunitario' : 'noticias', icon: 'add-circle-outline' },
          { label: 'Coordinaciones Activas', module: 'coordinaciones_activas', icon: 'people-circle-outline' },
          { label: canAdministrateCommunities ? 'Crear comunidad' : 'Comunidades', module: 'comunidades', icon: 'location-outline' },
          { label: 'Moderacion', module: 'moderacion', icon: 'shield-checkmark-outline' },
          { label: 'Revisar usuarios', module: 'usuarios', icon: 'people-outline' }
        ].filter((item) => (
          (item.module !== 'usuarios' || canManageUsers)
          && (item.module !== 'comunidades' || canOpenCommunityAdmin)
          && (item.module !== 'moderacion' || canOpenModeration)
        )).map((item) => (
          <TouchableOpacity key={item.label} style={[styles.adminQuickAction, isDark && styles.adminQuickActionDark]} onPress={() => item.module === 'muro_comunitario' ? onSetCommunityPanel() : item.module === 'coordinaciones_activas' ? onOpenCoordinations() : onSetAdminModule(item.module as AdminModule)}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={palette.red} />
            <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {session.role === 'administrador' ? (
        <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Ver como</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Simulacion temporal para revisar la app con otros rangos. No cambia permisos reales ni guarda cambios en Supabase.</Text>
          <View style={styles.adminQuickGrid}>
            {([
              { key: 'palestrista', label: 'Palestrista' },
              { key: 'sedimentador', label: 'Sedimentador' },
              { key: 'coordinador', label: 'Coordinador' },
              { key: 'nacional', label: 'Nacional' }
            ] as const).map((item) => (
              <TouchableOpacity key={item.key} style={[styles.adminQuickAction, isDark && styles.adminQuickActionDark]} onPress={() => onViewAsSession(internalTestSessions[item.key])}>
                <Ionicons name="eye-outline" size={20} color={palette.red} />
                <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
