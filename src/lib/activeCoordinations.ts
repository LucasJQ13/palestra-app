import { AdminUser, PublicUserDirectoryRecord } from './profiles';

export type ActiveCoordinationUser = AdminUser | PublicUserDirectoryRecord;

const activeCoordinationRoles = new Set(['coordinador_nacional', 'coordinador_diocesano']);

function coordinationRank(user: ActiveCoordinationUser, viewerProvince: string) {
  if (user.role === 'coordinador_nacional') {
    return 0;
  }
  return user.province === viewerProvince ? 1 : 2;
}

export function selectActiveCoordinations(
  sources: ActiveCoordinationUser[][],
  viewerProvince: string
) {
  const usersById = new Map<string, ActiveCoordinationUser>();

  sources.flat().forEach((user) => {
    if (!usersById.has(user.id)) {
      usersById.set(user.id, user);
    }
  });

  return Array.from(usersById.values())
    .filter((user) => user.status === 'aprobado' && activeCoordinationRoles.has(user.role))
    .sort((a, b) => {
      const rankDifference = coordinationRank(a, viewerProvince) - coordinationRank(b, viewerProvince);
      if (rankDifference !== 0) {
        return rankDifference;
      }
      return (a.province ?? '').localeCompare(b.province ?? '')
        || (a.full_name ?? '').localeCompare(b.full_name ?? '');
    });
}
