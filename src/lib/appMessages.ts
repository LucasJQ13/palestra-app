import { Role, Session, UserStatus } from '../types/auth';

export type MessageTone = 'functional' | 'fraternal' | 'pastoral';
export type MessageGenderPreference = Session['genderPreference'];
export type EmptyStateContext =
  | 'auth'
  | 'profile'
  | 'community'
  | 'mailbox'
  | 'materials'
  | 'qr'
  | 'notifications'
  | 'content'
  | 'admin'
  | 'generic';

type Treatment = {
  sibling: string;
  welcome: string;
  dear: string;
};

export const APP_MESSAGES = {
  supabaseConnectionError: 'No pudimos conectar con Supabase. Revisa la conexion e intenta nuevamente.',
  saveFailed: 'No pudimos guardar los cambios.',
  operationFailed: 'No pudimos completar la accion. Revisa los datos e intenta nuevamente.',
  messageSent: 'Mensaje enviado.',
  messageSentDone: 'Mensaje enviado.',
  messageSentCorrectly: 'Mensaje enviado correctamente.',
  responseSent: 'Respuesta enviada.',
  reportSentForReview: 'Reporte enviado para revision. Gracias por cuidar la comunidad.',
  reportSentForModeration: 'Reporte enviado para moderacion. Gracias por cuidar la comunidad.',
  selectQrList: 'Selecciona una lista QR antes de continuar.',
  photoPermission: 'Necesitamos permiso para acceder a tus fotos.',
  imageSelectionPermission: 'Necesitamos permiso para seleccionar imagen.',
  imageSelectionPermissionWithArticle: 'Necesitamos permiso para seleccionar una imagen.',
  chooseImagePermission: 'Necesitamos permiso para elegir una imagen.',
  profileReadFailed: 'No pudimos preparar tu perfil. Intenta nuevamente en unos minutos.',
  auth: {
    invalidEmail: 'Revisa el mail: necesitamos una direccion valida para seguir.',
    passwordRequired: 'Ingresa tu contrasena para continuar.',
    loginLoading: 'Estamos preparando tu ingreso...',
    recoveryTitle: 'Recuperar contrasena',
    recoveryHelp: 'Ingresa tu mail y te enviaremos un enlace para crear una nueva contrasena.',
    recoveryInvalidEmail: 'Escribi un mail valido para enviarte el enlace de recuperacion.',
    recoverySending: 'Estamos enviando las instrucciones a tu correo...',
    recoveryFailed: 'No pudimos enviar el enlace ahora. Revisa el mail y volve a intentar en unos minutos.',
    recoverySent: 'Si ese correo pertenece a una cuenta, te enviaremos los pasos para recuperar el acceso.',
    recoverySubmit: 'Enviar enlace',
    recoveryBack: 'Volver al inicio de sesion',
    loginSubmit: 'Iniciar sesion',
    loginLoadingShort: 'Ingresando...',
    registerSubmit: 'Unirme a Palestra',
    registerLoading: 'Estamos preparando tu registro...',
    emailConfirmationSent: 'Correo de confirmacion enviado. Revisa tu bandeja para activar tu cuenta.',
    emailConfirmationErrorTitle: 'No pudimos confirmar tu correo todavia',
    emailConfirmationSuccessTitle: 'Correo confirmado',
    emailConfirmationSuccessText: 'Tu correo fue confirmado. Ya podes ingresar a Palestra APP.',
    pendingProfileTitle: 'Tu perfil esta en camino',
    pendingProfileSubtitle: 'Revisa tu correo para confirmar tu cuenta',
    requestLeaderHelp: 'Si no llega el correo, avisale a un dirigente',
    nameRequired: 'Necesitamos tu nombre y apellido para crear tu perfil.',
    aboutRequired: 'Agrega tu fecha de nacimiento y un contacto para que tu comunidad pueda acompanarte.',
    communityRequired: 'Elegi provincia, comunidad y ano de inicio para ubicarte dentro de Palestra.',
    invalidEmailDomain: 'El dominio del mail no parece recibir correos. Revisalo antes de seguir.',
    unavailableEmailDomain: 'El dominio del mail no existe o no recibe correo.',
    domainValidationFailed: 'No pudimos validar el dominio del mail. Revisa tu conexion e intenta nuevamente.',
    emailAlreadyRegistered: 'Ese mail ya tiene una cuenta. Ingresa o recupera tu contrasena.',
    shortPassword: 'La contrasena debe tener al menos 6 caracteres.',
    narrativeRequired: 'Elegi una opcion narrativa para personalizar el saludo.',
    validatingEmail: 'Validando mail...',
    wizardNameTitle: 'Como te llamas?',
    wizardNameHelp: 'Antes de comenzar esta aventura, nos gustaria saber quien sos y conocer un poco mas de vos.',
    wizardAboutTitle: 'Contanos un poco de vos',
    wizardAboutHelp: 'Esto nos permitira conocerte mejor y preparar esta aventura para vos.',
    wizardCommunityTitle: 'Comunidad y acceso',
    wizardCommunityHelp: 'Elegi la provincia donde perseveras o participas actualmente en Palestra y prepara tus datos de ingreso.',
    wizardNarrativeTitle: 'Narrativa',
    wizardNarrativeHelp: 'Esto nos ayuda a hablarte con una cercania mas personal dentro de la app.'
  },
  adminOnly(action: string) {
    return `Esta accion esta reservada para administradores: ${action}.`;
  }
} as const;

export function fraternalTreatment(genderPreference?: MessageGenderPreference): Treatment {
  if (genderPreference === 'male') {
    return {
      sibling: 'hermano',
      welcome: 'Bienvenido',
      dear: 'Querido'
    };
  }
  if (genderPreference === 'female') {
    return {
      sibling: 'hermana',
      welcome: 'Bienvenida',
      dear: 'Querida'
    };
  }
  return {
    sibling: 'hermano/a',
    welcome: 'Bienvenido/a',
    dear: 'Querido/a'
  };
}

function firstNameOfSession(session: Pick<Session, 'fullName' | 'nickname' | 'useNicknameInGreetings'> | null) {
  if (!session) {
    return 'Palestrista';
  }
  if (session.useNicknameInGreetings && session.nickname?.trim()) {
    return session.nickname.trim();
  }
  return session.fullName.trim().split(/\s+/)[0] || 'Palestrista';
}

export function fraternalWelcomeMessage(session: Session | null, tone: MessageTone = 'pastoral') {
  const treatment = fraternalTreatment(session?.genderPreference);
  const name = firstNameOfSession(session);
  if (tone === 'functional') {
    return `${treatment.welcome}, ${name}.`;
  }
  if (tone === 'fraternal') {
    return `${treatment.welcome}, ${treatment.sibling} ${name}.`;
  }
  return `${treatment.welcome}, ${treatment.sibling} ${name}. Caminemos juntos en Cristo.`;
}

export function pendingProfileMessage(genderPreference?: MessageGenderPreference, tone: MessageTone = 'pastoral') {
  const treatment = fraternalTreatment(genderPreference);
  if (tone === 'functional') {
    return 'Tu registro quedo pendiente de revision.';
  }
  if (tone === 'fraternal') {
    return `Tu registro ya esta en camino, ${treatment.sibling}.`;
  }
  return `Tu registro ya esta en camino, ${treatment.sibling}. Te avisaremos cuando un dirigente lo revise.`;
}

export function blockedProfileMessage(genderPreference?: MessageGenderPreference, tone: MessageTone = 'functional') {
  const treatment = fraternalTreatment(genderPreference);
  if (tone === 'pastoral') {
    return `Tu cuenta esta detenida por ahora, ${treatment.sibling}. Escribi a un dirigente para que podamos acompanarte.`;
  }
  return 'Tu cuenta esta detenida por ahora. Escribi a un dirigente para que podamos acompanarte.';
}

export function accountStatusMessage(status: UserStatus, genderPreference?: MessageGenderPreference, tone: MessageTone = 'fraternal') {
  if (status === 'aprobado') {
    const treatment = fraternalTreatment(genderPreference);
    if (tone === 'functional') {
      return 'Cuenta aprobada.';
    }
    return `Cuenta aprobada. ${treatment.welcome} a Palestra APP.`;
  }
  if (status === 'bloqueado') {
    return blockedProfileMessage(genderPreference, tone === 'pastoral' ? 'pastoral' : 'functional');
  }
  return pendingProfileMessage(genderPreference, tone);
}

export function emptyStateMessage(context: EmptyStateContext = 'generic', genderPreference?: MessageGenderPreference, tone: MessageTone = 'functional') {
  const treatment = fraternalTreatment(genderPreference);
  const messages: Record<EmptyStateContext, string> = {
    auth: 'No encontramos datos para mostrar en este momento.',
    profile: 'Todavia no hay datos cargados en este perfil.',
    community: 'Todavia no hay informacion cargada para esta comunidad.',
    mailbox: 'No hay mensajes en esta bandeja por ahora.',
    materials: 'Todavia no hay materiales disponibles.',
    qr: 'Todavia no hay listas QR disponibles.',
    notifications: 'No hay notificaciones para mostrar.',
    content: 'Todavia no hay contenido publicado para esta seccion.',
    admin: 'No hay datos administrativos para revisar por ahora.',
    generic: 'Todavia no hay informacion para mostrar.'
  };
  if (tone === 'fraternal') {
    return `${messages[context]} Gracias por esperar, ${treatment.sibling}.`;
  }
  if (tone === 'pastoral') {
    return `${messages[context]} Cuando haya novedades, las vamos a acercar a la comunidad.`;
  }
  return messages[context];
}

export function accessRequiredMessage(context: EmptyStateContext = 'generic', genderPreference?: MessageGenderPreference, tone: MessageTone = 'functional') {
  const treatment = fraternalTreatment(genderPreference);
  if (tone === 'fraternal') {
    return `Para continuar, ${treatment.sibling}, necesitas ingresar con una cuenta aprobada.`;
  }
  if (tone === 'pastoral') {
    return `Para cuidar este espacio comunitario, necesitamos que ingreses con una cuenta aprobada.`;
  }
  if (context === 'qr') {
    return 'Esta herramienta esta reservada para rangos dirigenciales habilitados.';
  }
  return 'Necesitas ingresar con una cuenta aprobada para continuar.';
}

export function actionDoneMessage(action: string, genderPreference?: MessageGenderPreference, tone: MessageTone = 'fraternal') {
  const trimmedAction = action.trim().replace(/\.$/, '');
  if (tone === 'functional') {
    return `Listo. ${trimmedAction}.`;
  }
  const treatment = fraternalTreatment(genderPreference);
  if (tone === 'pastoral') {
    return `Listo, ${treatment.sibling}. ${trimmedAction}. Gracias por cuidar este camino.`;
  }
  return `Listo, ${treatment.sibling}. ${trimmedAction}.`;
}

export function statusLabel(status: UserStatus) {
  if (status === 'aprobado') {
    return 'Aprobado';
  }
  if (status === 'bloqueado') {
    return 'Bloqueado';
  }
  return 'Pendiente de aprobacion';
}

export function changeDone(detail: string) {
  return actionDoneMessage(detail, null, 'functional');
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
    return 'No tenes permisos para subir este archivo. Revisa tu rango, provincia o la configuracion de permisos de materiales.';
  }
  if (/storage|bucket|object/i.test(text)) {
    return 'No pudimos guardar el archivo en Storage. Revisa permisos de Supabase e intenta nuevamente.';
  }
  return text || APP_MESSAGES.operationFailed;
}

export function safeAuthError(message?: string) {
  const text = (message ?? '').toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'El mail o la contrasena no coinciden. Revisalos y volve a intentar.';
  }
  if (text.includes('email not confirmed')) {
    return 'Tu correo todavia no esta confirmado. Revisa tu bandeja o pedi ayuda a un dirigente.';
  }
  if (text.includes('already') || text.includes('existe')) {
    return APP_MESSAGES.auth.emailAlreadyRegistered;
  }
  if (text.includes('password') || text.includes('contrasena')) {
    return 'Revisa la contrasena indicada.';
  }
  return 'No pudimos completar la accion. Revisa los datos e intenta nuevamente.';
}
