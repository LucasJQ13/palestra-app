import * as ImagePicker from 'expo-image-picker';
import { normalizeExternalUrl } from '../urls';

export type CommunityNoticeBodyFormat = 'normal' | 'bold' | 'underline';

export type CommunityNoticeDraft = {
  title: string;
  subtitle: string;
  body: string;
  bodyFormat: CommunityNoticeBodyFormat;
  imageUrl: string;
  imageAsset: ImagePicker.ImagePickerAsset | null;
  linkLabel: string;
  linkUrl: string;
};

export const emptyCommunityNoticeDraft: CommunityNoticeDraft = {
  title: '',
  subtitle: '',
  body: '',
  bodyFormat: 'normal',
  imageUrl: '',
  imageAsset: null,
  linkLabel: '',
  linkUrl: ''
};

export function normalizeCommunityNoticeFormat(value?: string | null): CommunityNoticeBodyFormat {
  return value === 'bold' || value === 'underline' ? value : 'normal';
}

export function normalizeCommunityNoticeLink(value: string) {
  const trimmed = value.trim();
  return trimmed ? normalizeExternalUrl(trimmed) : null;
}

export function validateCommunityNoticeDraft(draft: CommunityNoticeDraft) {
  if (!draft.body.trim()) {
    return 'Completá el mensaje antes de publicar.';
  }
  if (draft.linkUrl.trim() && !/^https?:\/\/|^www\./i.test(draft.linkUrl.trim())) {
    return 'El enlace debe comenzar con https:// o www.';
  }
  if (draft.imageUrl.trim() && !/^https?:\/\//i.test(draft.imageUrl.trim())) {
    return 'La imagen por enlace debe comenzar con https://.';
  }
  return null;
}
