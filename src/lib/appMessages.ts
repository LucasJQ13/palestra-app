import { Role, Session, UserStatus } from '../types/auth';

export function statusLabel(status: UserStatus) {
  if (status === 'aprobado') {
    return 'Aprobado';
  }
  if (status === 'bloqueado') {
    return 'Bloqueado';
  }
  return 'Pendiente de aprobaci??n';
}

export function changeDone(detail: string) {
  return `Cambio realizado. ${detail}`;
}

export function isMissingProfileScope(session: Session | null) {
  if (!session || session.role === 'invitado') {
    return false;
  }
  return !session.province || session.province === 'Sin provincia' || !session.communityOfOrigin || session.communityOfOrigin === 'Sin comunidad asignada';
}

export function provinceDowngradesRole(role: Role) {
  return ['animador_comunidad', 'coordinador_comunidad', 'vocal', 'coordinador_diocesano'].includes(role);
}

export function communityDowngradesRole(role: Role) {
  return ['animador_comunidad', 'coordinador_comunidad'].includes(role);
}

export function roleAfterScopeChange(role: Role, changesProvince: boolean, changesCommunity: boolean): Role {
  if (['administrador', 'coordinador_nacional', 'vocal_nacional', 'asesor'].includes(role)) {
    return role;
  }
  if (changesProvince && ['vocal', 'coordinador_diocesano'].includes(role)) {
    return 'sedimentador';
  }
  if ((changesProvince || changesCommunity) && ['animador_comunidad', 'coordinador_comunidad'].includes(role)) {
    return 'sedimentador';
  }
  return role;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function emailDomainOf(value: string) {
  return value.trim().toLowerCase().split('@')[1] ?? '';
}

export function hasPlausibleEmailDomain(value: string) {
  const domain = emailDomainOf(value);
  if (!domain || domain.length > 253 || domain.includes('..')) {
    return false;
  }
  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }
  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    && /^[a-z]{2,24}$/.test(labels[labels.length - 1]);
}

export async function verifyEmailDomainExists(value: string) {
  const domain = emailDomainOf(value);
  if (!hasPlausibleEmailDomain(value)) {
    return false;
  }
  try {
    const mxResponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    const mxData = await mxResponse.json();
    if (mxData?.Status === 0 && Array.isArray(mxData.Answer) && mxData.Answer.length > 0) {
      return true;
    }
    const aResponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const aData = await aResponse.json();
    return Boolean(aData?.Status === 0 && Array.isArray(aData.Answer) && aData.Answer.length > 0);
  } catch {
    return null;
  }
}

export function friendlyUploadError(message?: string | null) {
  const text = String(message ?? '');
  if (/row-level security|violates row-level|policy/i.test(text)) {
    return 'No tenes permisos para subir este archivo. Revis?? tu rango, provincia o ejecut?? el patch de permisos de materiales.';
  }
  if (/storage|bucket|object/i.test(text)) {
    return 'No se pudo guardar el archivo en Storage. Revis?? permisos de Supabase o intent?? nuevamente.';
  }
  return text || 'No se pudo completar la operaci??n.';
}

export function safeAuthError(message?: string) {
  const text = (message ?? '').toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'Mail o contrase??a incorrectos.';
  }
  if (text.includes('email not confirmed')) {
    return 'Tu correo todav??a no est?? confirmado.';
  }
  if (text.includes('already') || text.includes('existe')) {
    return 'Ya existe un usuario con ese correo.';
  }
  if (text.includes('password') || text.includes('contrasena')) {
    return 'Revis?? la contrase??a indicada.';
  }
  return 'No pudimos completar la acci??n. Revis?? los datos e intenta nuevamente.';
}
