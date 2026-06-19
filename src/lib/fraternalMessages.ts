import { Session } from '../types/auth';

export type FraternalAudience = Pick<Session, 'genderPreference'> | Session['genderPreference'];

type NarrativeVariants = {
  male: string;
  female: string;
  neutral: string;
};

function genderPreferenceOf(audience?: FraternalAudience) {
  if (audience && typeof audience === 'object') {
    return audience.genderPreference ?? null;
  }
  return audience ?? null;
}

export function narrativeMessage(audience: FraternalAudience | undefined, variants: NarrativeVariants) {
  const preference = genderPreferenceOf(audience);
  if (preference === 'male') {
    return variants.male;
  }
  if (preference === 'female') {
    return variants.female;
  }
  return variants.neutral;
}

export const fraternalMessages = {
  loginWelcome() {
    return 'Qué alegría encontrarte de nuevo. ¿Iniciamos sesión?';
  },
  approvedWelcome(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'Bienvenido a Palestra, hermano. Tu perfil ya está aprobado.',
      female: 'Bienvenida a Palestra, hermana. Tu perfil ya está aprobado.',
      neutral: 'Te damos la bienvenida a Palestra. Tu perfil ya está aprobado.'
    });
  },
  approvalConfirmed(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'Perfil aprobado. Este hermano ya puede ingresar a Palestra.',
      female: 'Perfil aprobado. Esta hermana ya puede ingresar a Palestra.',
      neutral: 'Perfil aprobado. Ya puede ingresar a Palestra.'
    });
  },
  profilePending(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'Tu perfil está en revisión, hermano. Te avisaremos cuando esté listo.',
      female: 'Tu perfil está en revisión, hermana. Te avisaremos cuando esté listo.',
      neutral: 'Tu perfil está en revisión. Te avisaremos cuando esté listo.'
    });
  },
  profilePendingTitle() {
    return 'Tu perfil está en camino';
  },
  profileBlocked(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'Tu acceso está pausado, hermano. Contactá a un dirigente para revisarlo.',
      female: 'Tu acceso está pausado, hermana. Contactá a un dirigente para revisarlo.',
      neutral: 'Tu acceso está pausado. Contactá a un dirigente para revisarlo.'
    });
  },
  registrationReceived(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'Recibimos tu registro, hermano. Revisá tu correo para confirmar la cuenta.',
      female: 'Recibimos tu registro, hermana. Revisá tu correo para confirmar la cuenta.',
      neutral: 'Recibimos tu registro. Revisá tu correo para confirmar la cuenta.'
    });
  },
  mailConfirmed(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'Todo listo, hermano. Ya podés ingresar a Palestra.',
      female: 'Todo listo, hermana. Ya podés ingresar a Palestra.',
      neutral: 'Todo listo. Ya podés ingresar a Palestra.'
    });
  },
  mailConfirmationFailed() {
    return 'No pudimos validar el enlace. Solicitá uno nuevo o pedí ayuda a un dirigente.';
  },
  privateAccessRequired(action?: string) {
    const purpose = action?.trim() ? ` para ${action.trim()}` : '';
    return `Iniciá sesión con un perfil aprobado${purpose}. Si necesitás ayuda, contactá a un dirigente.`;
  },
  communityEmpty() {
    return 'Tu comunidad todavía no tiene novedades. Cuando haya algo para compartir, va a aparecer acá.';
  },
  inboxEmpty() {
    return 'Todavía no tenés mensajes. Cuando alguien te escriba, la conversación va a aparecer acá.';
  },
  pastoralSupport(audience?: FraternalAudience) {
    return narrativeMessage(audience, {
      male: 'No estás solo, hermano. Tu comunidad está para acompañarte.',
      female: 'No estás sola, hermana. Tu comunidad está para acompañarte.',
      neutral: 'Contás con tu comunidad en este camino. Estamos para acompañarte.'
    });
  }
} as const;
