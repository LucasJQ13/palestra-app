export type CommunityGroupType = 'jovenes' | 'adultos' | 'jovenes_adultos';

export type CommunitySectionVisibility = Record<CommunityGroupType, boolean>;

export const communitySectionOptions: { key: CommunityGroupType; label: string }[] = [
  { key: 'jovenes', label: 'Jóvenes' },
  { key: 'adultos', label: 'Adultos' },
  { key: 'jovenes_adultos', label: 'Jóvenes Adultos' }
];

const emptyVisibility: CommunitySectionVisibility = {
  jovenes: false,
  adultos: false,
  jovenes_adultos: false
};

function normalizeProvinceName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function defaultCommunitySectionVisibility(provinceName: string): CommunitySectionVisibility {
  const normalized = normalizeProvinceName(provinceName);
  if (normalized === 'tucuman' || normalized === 'catamarca') {
    return {
      jovenes: true,
      adultos: true,
      jovenes_adultos: false
    };
  }
  if (['salta', 'jujuy', 'san luis'].includes(normalized)) {
    return {
      jovenes: true,
      adultos: false,
      jovenes_adultos: false
    };
  }
  return { ...emptyVisibility };
}

export function resolveCommunitySectionVisibility(
  provinceName: string,
  configured?: Partial<CommunitySectionVisibility> | null
): CommunitySectionVisibility {
  return {
    ...defaultCommunitySectionVisibility(provinceName),
    ...(configured ?? {})
  };
}

export function communityGroupLabel(groupType?: string | null) {
  return communitySectionOptions.find((item) => item.key === groupType)?.label ?? 'Jóvenes';
}

export function normalizeCommunityGroup(groupType?: string | null): CommunityGroupType {
  return groupType === 'adultos' || groupType === 'jovenes_adultos' ? groupType : 'jovenes';
}
