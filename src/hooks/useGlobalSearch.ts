import { useState } from 'react';
import { Keyboard } from 'react-native';
import { Role, Session } from '../types/auth';
import { GlobalSearchResult, PublicProfilePreview, TabKey } from '../types/appUi';
import { fetchCommunities, fetchCommunityPublications, fetchMotivadorPeriods, fetchNews, fetchNotilestra } from '../lib/remoteData';
import { RoleAliasConfig } from '../lib/appConfig';
import { fetchAppContent, fetchAppMaterials, fetchPublicUserDirectory, PublicUserDirectoryRecord } from '../lib/profiles';
import { displayRoleLabel } from '../lib/profileDisplay';

type UseGlobalSearchOptions = {
  session: Session | null;
  roleAliases: RoleAliasConfig[];
  tabLabel: (key: TabKey) => string;
  navigateToTab: (tab: TabKey) => void;
};

export function useGlobalSearch({ session, roleAliases, tabLabel, navigateToTab }: UseGlobalSearchOptions) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<PublicProfilePreview | null>(null);

  async function run() {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 2) {
      setResults([]);
      setMessage('Escribe al menos 2 caracteres.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setMessage('');
    try {
      const [
        communitiesRemote,
        materialsRemote,
        contentRemote,
        newsRemote,
        agendaRemote,
        pmRemote,
        communityPublicationsRemote,
        publicUsersRemote
      ] = await Promise.all([
        fetchCommunities(),
        fetchAppMaterials(session?.role === 'administrador'),
        fetchAppContent(),
        fetchNews(session),
        fetchNotilestra(session),
        fetchMotivadorPeriods(session),
        fetchCommunityPublications(session),
        session && session.status === 'aprobado' && session.role !== 'invitado' ? fetchPublicUserDirectory() : Promise.resolve([] as PublicUserDirectoryRecord[])
      ]);

      const matches = (values: Array<string | null | undefined>) => values
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const nextResults: GlobalSearchResult[] = [];

      publicUsersRemote.forEach((user) => {
        if (matches([user.full_name, user.nickname, user.province, user.community_name, user.role])) {
          const role = (user.role || 'palestrista') as Role;
          nextResults.push({
            id: `user-${user.id}`,
            type: 'usuario',
            title: user.full_name ?? 'Usuario',
            subtitle: `${displayRoleLabel(role, user.province, [], roleAliases, user.display_role_label, user.gender_preference ?? null)} - ${user.community_name ?? 'Sin comunidad'} - ${user.province ?? 'Sin provincia'}`,
            tab: 'perfil',
            publicProfile: {
              id: user.id,
              fullName: user.full_name ?? 'Usuario',
              role,
              province: user.province,
              communityName: user.community_name,
              avatarUrl: user.avatar_url,
              contact: '',
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
            }
          });
        }
      });

      communitiesRemote.forEach((province) => {
        province.locations.forEach((community) => {
          if (matches([province.province, community.name, community.address, community.description, community.phone])) {
            nextResults.push({
              id: `community-${community.id ?? province.province}-${community.name}`,
              type: 'comunidad',
              title: community.name,
              subtitle: `${province.province} - ${community.address}`,
              tab: 'comunidades'
            });
          }
        });
      });

      materialsRemote.forEach((material) => {
        if (matches([material.title, material.description, material.category, material.required_permission, material.visibility])) {
          nextResults.push({
            id: `material-${material.id}`,
            type: 'descarga',
            title: material.title,
            subtitle: `${material.category ?? 'Material'} - ${material.visibility}`,
            tab: 'materiales'
          });
        }
      });

      newsRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.scope, item.province])) {
          nextResults.push({
            id: `news-${item.id ?? index}`,
            type: 'noticia',
            title: item.title,
            subtitle: item.scope ?? 'Noticia',
            tab: 'inicio'
          });
        }
      });

      agendaRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.scope, item.date])) {
          nextResults.push({
            id: `agenda-${item.id ?? index}`,
            type: 'noticia',
            title: item.title,
            subtitle: `${item.scope ?? 'Agenda'} - ${item.date}`,
            tab: 'notilestra'
          });
        }
      });

      pmRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.scope, item.province, item.date])) {
          nextResults.push({
            id: `pm-${item.id ?? index}`,
            type: 'pm',
            title: item.title,
            subtitle: `${item.scope ?? 'PM'} - ${item.date}`,
            tab: 'periodo_motivador'
          });
        }
      });

      communityPublicationsRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.communityName, item.scope, item.visibility])) {
          nextResults.push({
            id: `community-publication-${item.id ?? index}`,
            type: 'aviso',
            title: item.title,
            subtitle: item.scope ?? item.communityName ?? 'Aviso comunitario',
            tab: 'perfil'
          });
        }
      });

      contentRemote.forEach((item) => {
        const blocksText = Array.isArray(item.blocks) ? item.blocks.map((block) => `${block.type ?? ''} ${block.value ?? ''}`).join(' ') : '';
        if (matches([item.tab_key, item.title, item.body, blocksText])) {
          nextResults.push({
            id: `content-${item.tab_key}`,
            type: 'contenido',
            title: item.title || item.tab_key,
            subtitle: tabLabel(item.tab_key as TabKey),
            tab: item.tab_key as TabKey
          });
        }
      });

      setResults(nextResults.slice(0, 80));
      setMessage(nextResults.length ? '' : 'No encontré resultados remotos para esa búsqueda.');
    } catch (error) {
      console.error('global search', error);
      setMessage('No pude buscar en Supabase. Revisa la conexión.');
    } finally {
      setLoading(false);
    }
  }

  function close() {
    Keyboard.dismiss();
    setOpen(false);
  }

  function openResult(result: GlobalSearchResult) {
    close();
    if (result.publicProfile) {
      setProfile(result.publicProfile);
      navigateToTab('perfil');
      return;
    }
    if (result.tab) {
      navigateToTab(result.tab);
    }
  }

  return {
    close,
    loading,
    message,
    open,
    openResult,
    profile,
    query,
    results,
    run,
    setOpen,
    setProfile,
    setQuery
  };
}
