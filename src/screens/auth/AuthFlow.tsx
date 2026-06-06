import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { communities } from '../../data/content';
import { checkRegistrationEmailAvailable, createEmailConfirmationRequest } from '../../lib/profiles';
import { AppCommunity, fetchCommunities } from '../../lib/remoteData';
import { getMyProfileSession } from '../../lib/authProfile';
import { supabase } from '../../lib/supabase';
import { hasPlausibleEmailDomain, isValidEmail, safeAuthError, verifyEmailDomainExists } from '../../lib/appMessages';
import { genderNarratives } from '../../lib/profileDisplay';
import { authDeepLinkBaseUrl, authPasswordResetUrl, palestraLogo, perseveranceStartYears, provinceDisplayNames } from '../../lib/constants';
import { Session } from '../../types/auth';
import { AuthSelect, AuthTextInput, BirthDatePicker } from '../../components/AuthInputs';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

type RegisterDraft = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nickname: string;
  contact: string;
  province: string;
  community: string;
  perseveranceStartYear: string;
  email: string;
  password: string;
  genderPreference: 'male' | 'female' | null;
};

type PendingRegistrationProfile = RegisterDraft & {
  userId: string;
  fullName: string;
};

export function AuthScreen({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authMessage, setAuthMessage] = useState('');
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistrationProfile | null>(null);
  const insets = useSafeAreaInsets();

  async function resolveSession(email: string) {
    const result = await getMyProfileSession(email);
    if (result.error || !result.session) {
      setAuthMessage(result.error ?? 'No pude leer tu perfil.');
      return;
    }
    if (result.session.status === 'bloqueado') {
      await supabase.auth.signOut();
      setAuthMessage('Este usuario está bloqueado. Contactá a un dirigente.');
      return;
    }
    onAuthenticated(result.session);
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[
        styles.authFullscreen,
        { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 14) }
      ]}
    >
      <View style={styles.authGlowOne} />
      <View style={styles.authGlowTwo} />
      <TouchableOpacity style={[styles.authCloseButton, { top: Math.max(insets.top + 12, 34) }]} onPress={onClose} activeOpacity={0.85}>
        <Ionicons name="close-outline" size={24} color={palette.white} />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.authKeyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : Math.max(insets.top, 18)}
      >
      {pendingRegistration ? (
        <LimitedPendingProfile
          profile={pendingRegistration}
          message={authMessage}
          onMessage={setAuthMessage}
          onBackToLogin={() => {
            setPendingRegistration(null);
            setMode('login');
            setAuthMessage('');
          }}
        />
      ) : mode === 'login' ? (
        <LoginScreen
          message={authMessage}
          onMessage={setAuthMessage}
          onAuthenticated={resolveSession}
          onRegister={() => {
            setAuthMessage('');
            setMode('register');
          }}
        />
      ) : (
        <RegisterWizard
          message={authMessage}
          onMessage={setAuthMessage}
          onBackToLogin={() => {
            setAuthMessage('');
            setMode('login');
          }}
          onRegistered={resolveSession}
          onPendingRegistration={(profile) => {
            setPendingRegistration(profile);
            setAuthMessage('Mail de confirmación enviado. Revisá tu correo para confirmar tu cuenta.');
          }}
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LoginScreen({ message, onMessage, onAuthenticated, onRegister }: { message: string; onMessage: (message: string) => void; onAuthenticated: (email: string) => Promise<void>; onRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  async function submitLogin() {
    if (!isValidEmail(email)) {
      onMessage('Ingresá un mail válido.');
      return;
    }
    if (!password) {
      onMessage('Ingresá tu contraseña.');
      return;
    }
    setLoading(true);
    onMessage('Iniciando sesión...');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error || !data.user) {
      onMessage(safeAuthError(error?.message));
      return;
    }
    await onAuthenticated(email.trim());
  }

  async function recoverPassword() {
    const targetEmail = recoveryEmail.trim();
    if (!isValidEmail(targetEmail)) {
      onMessage('Ingresa un mail valido para enviar la recuperacion.');
      return;
    }
    setRecoveryLoading(true);
    onMessage('Enviando instrucciones...');
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: authPasswordResetUrl
    });
    setRecoveryLoading(false);
    if (error) {
      onMessage('No pudimos enviar la recuperacion ahora. Revisa el mail e intenta nuevamente en unos minutos.');
      return;
    }
    onMessage('Si el correo esta registrado, recibiras instrucciones para recuperar tu contrasena.');
  }

  function openRecoveryForm() {
    setRecoveryEmail(email.trim());
    setShowRecoveryForm(true);
    onMessage('');
  }

  return (
    <ScrollView contentContainerStyle={styles.authScrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} overScrollMode="always">
      <View style={styles.authBrandHeader}>
        <Image source={palestraLogo} style={styles.authLogo} />
        <Text style={styles.authBrandTitle}>Palestra</Text>
        <Text style={styles.authBrandSubtitle}>Movimiento Católico</Text>
      </View>
      <Text style={styles.authHeroTitle}>Bienvenido/a, ¿iniciamos sesión?</Text>
      <Text style={styles.authHeroText}>Qué alegría volver a encontrarte en este camino.</Text>

      <View style={styles.authFormPanel}>
        {showRecoveryForm ? (
          <>
            <Text style={styles.authInputLabel}>Recuperar contrasena</Text>
            <Text style={styles.authHeroText}>Ingresa tu mail y te enviaremos un enlace para crear una nueva contrasena.</Text>
            <AuthTextInput label="Mail" placeholder="tu.mail@email.com" value={recoveryEmail} onChangeText={setRecoveryEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.authPrimaryButton} onPress={recoverPassword} disabled={recoveryLoading} activeOpacity={0.86}>
              <Text style={styles.authPrimaryText}>{recoveryLoading ? 'Enviando...' : 'Enviar recuperacion'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.authGhostButton}
              onPress={() => {
                setShowRecoveryForm(false);
                onMessage('');
              }}
              disabled={recoveryLoading}
              activeOpacity={0.86}
            >
              <Text style={styles.authGhostText}>Volver al inicio de sesion</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
        <AuthTextInput label="Mail" placeholder="tu.mail@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <View>
          <Text style={styles.authInputLabel}>Contraseña</Text>
          <View style={styles.authPasswordWrap}>
            <TextInput
              style={styles.authInputPassword}
              placeholder="Ingresá tu contraseña"
              placeholderTextColor="rgba(230,243,245,0.62)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.authEyeButton} onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.white} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.authPrimaryButton} onPress={submitLogin} disabled={loading} activeOpacity={0.86}>
          <Text style={styles.authPrimaryText}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authGhostButton} onPress={onRegister} activeOpacity={0.86}>
          <Text style={styles.authGhostText}>Registrarme</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openRecoveryForm} activeOpacity={0.75}>
          <Text style={styles.authLinkText}>Olvidé mi contraseña</Text>
        </TouchableOpacity>
          </>
        )}
        {message ? <Text style={styles.authMessage}>{message}</Text> : null}
      </View>
    </ScrollView>
  );
}

export function MailConfirmedScreen({ onEnter, message, isError = false }: { onEnter: () => void; message?: string; isError?: boolean }) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.authConfirmPanel}>
        <View style={styles.authConfirmLogo}>
          <Image source={palestraLogo} style={styles.brandLogoImage} />
        </View>
        <Text style={styles.authConfirmTitle}>{isError ? 'No pudimos confirmar el mail' : 'Mail confirmado'}</Text>
        <Text style={styles.authConfirmText}>{message ?? 'Tu correo fue confirmado correctamente. Ya podés ingresar a Palestra APP.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onEnter} activeOpacity={0.86}>
          <Text style={styles.primaryButtonText}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const AuthConfirmationScreen = MailConfirmedScreen;

function LimitedPendingProfile({ profile, message, onMessage, onBackToLogin }: { profile: PendingRegistrationProfile; message: string; onMessage: (message: string) => void; onBackToLogin: () => void }) {
  async function requestAdminHelp() {
    onMessage('Enviando mensaje...');
    const { error } = await createEmailConfirmationRequest({
      userId: profile.userId,
      email: profile.email,
      fullName: profile.fullName,
      province: profile.province,
      communityName: profile.community,
      contact: profile.contact
    });
    onMessage(error ? error.message : 'Mensaje enviado');
  }

  return (
    <ScrollView contentContainerStyle={styles.authScrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} overScrollMode="always">
      <View style={styles.authBrandHeader}>
        <Image source={palestraLogo} style={styles.authLogo} />
        <Text style={styles.authBrandTitle}>Perfil pendiente</Text>
        <Text style={styles.authBrandSubtitle}>Revisá tu correo para confirmar tu cuenta</Text>
      </View>
      <View style={styles.authFormPanel}>
        <Text style={styles.authInputLabel}>Nombre</Text>
        <Text style={styles.authHeroText}>{profile.firstName}</Text>
        <Text style={styles.authInputLabel}>Apellido</Text>
        <Text style={styles.authHeroText}>{profile.lastName}</Text>
        <Text style={styles.authInputLabel}>Provincia</Text>
        <Text style={styles.authHeroText}>{profile.province}</Text>
        <Text style={styles.authInputLabel}>Contacto</Text>
        <Text style={styles.authHeroText}>{profile.contact}</Text>
        <Text style={styles.authInputLabel}>Comunidad</Text>
        <Text style={styles.authHeroText}>{profile.community}</Text>
        <TouchableOpacity style={styles.authPrimaryButton} onPress={requestAdminHelp} activeOpacity={0.86}>
          <Text style={styles.authPrimaryText}>En caso de no poder confirmar el mail, contactar con un dirigente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authGhostButton} onPress={onBackToLogin} activeOpacity={0.86}>
          <Text style={styles.authGhostText}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.authMessage}>{message}</Text> : null}
      </View>
    </ScrollView>
  );
}

function RegisterWizard({ message, onMessage, onBackToLogin, onRegistered, onPendingRegistration }: { message: string; onMessage: (message: string) => void; onBackToLogin: () => void; onRegistered: (email: string) => Promise<void>; onPendingRegistration: (profile: PendingRegistrationProfile) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RegisterDraft>({
    firstName: '',
    lastName: '',
    birthDate: '',
    nickname: '',
    contact: '',
    province: '',
    community: '',
    perseveranceStartYear: '',
    email: '',
    password: '',
    genderPreference: null
  });
  const [registrationCommunities, setRegistrationCommunities] = useState<AppCommunity[]>(communities);
  const [loading, setLoading] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const selectedProvince = registrationCommunities.find((item) => item.province === draft.province);

  useEffect(() => {
    fetchCommunities().then((items) => {
      if (items.length > 0) {
        setRegistrationCommunities(items);
      }
    });
  }, []);

  useEffect(() => {
    fade.setValue(0.75);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [step, fade]);

  function patchDraft(values: Partial<RegisterDraft>) {
    setDraft((current) => ({ ...current, ...values }));
    onMessage('');
  }

  function validateStep() {
    if (step === 0 && (!draft.firstName.trim() || !draft.lastName.trim())) {
      onMessage('Completá nombre y apellido para continuar.');
      return false;
    }
    if (step === 1 && (!draft.birthDate || !draft.contact.trim())) {
      onMessage('Completá fecha de nacimiento y contacto.');
      return false;
    }
    if (step === 2) {
      if (!draft.province || !draft.community || !draft.perseveranceStartYear) {
        onMessage('Elegir provincia, comunidad y año de inicio es obligatorio.');
        return false;
      }
      if (!isValidEmail(draft.email)) {
        onMessage('Ingresá un mail válido.');
        return false;
      }
      if (!hasPlausibleEmailDomain(draft.email)) {
        onMessage('El dominio del mail no parece valido.');
        return false;
      }
      if (draft.password.length < 6) {
        onMessage('La contraseña debe tener al menos 6 caracteres.');
        return false;
      }
    }
    if (step === 3 && !draft.genderPreference) {
      onMessage('Elegí una opción narrativa para personalizar el saludo.');
      return false;
    }
    return true;
  }

  async function nextStep() {
    if (!validateStep()) {
      return;
    }
    if (step === 2) {
      setLoading(true);
      onMessage('Validando mail...');
      const [domainExists, availability] = await Promise.all([
        verifyEmailDomainExists(draft.email),
        checkRegistrationEmailAvailable(draft.email.trim())
      ]);
      setLoading(false);
      if (domainExists === false) {
        onMessage('El dominio del mail no existe o no recibe correo.');
        return;
      }
      if (domainExists === null) {
        onMessage('No pudimos validar el dominio del mail. Revisa tu conexion e intenta nuevamente.');
        return;
      }
      if (!availability.available) {
        onMessage(availability.reason || 'Este mail ya se encuentra registrado.');
        return;
      }
    }
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    setLoading(true);
    onMessage('Creando tu registro...');
    const fullName = `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: draft.email.trim(),
      password: draft.password,
      options: {
        emailRedirectTo: authDeepLinkBaseUrl,
        data: {
          full_name: fullName,
          first_name: draft.firstName.trim(),
          last_name: draft.lastName.trim(),
          birth_date: draft.birthDate,
          nickname: draft.nickname.trim(),
          phone: draft.contact.trim(),
          province: draft.province.trim(),
          community_name: draft.community.trim(),
          perseverance_start_year: draft.perseveranceStartYear,
          gender_preference: draft.genderPreference
        }
      }
    });
    setLoading(false);
    if (error || !data.user) {
      onMessage(safeAuthError(error?.message));
      return;
    }
    if (data.session) {
      await onRegistered(draft.email.trim());
      return;
    }
    onPendingRegistration({
      ...draft,
      userId: data.user.id,
      fullName
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.authWizardScrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} overScrollMode="always">
    <View style={styles.authWizardShell}>
      <View style={styles.authWizardTop}>
        <TouchableOpacity style={styles.authBackButton} onPress={step === 0 ? onBackToLogin : () => setStep((current) => Math.max(0, current - 1))}>
          <Ionicons name="arrow-back-outline" size={20} color={palette.white} />
          <Text style={styles.authBackText}>{step === 0 ? 'Iniciar sesión' : 'Atrás'}</Text>
        </TouchableOpacity>
        <Text style={styles.authProgressText}>Página {step + 1} de 4</Text>
      </View>
      <Animated.View style={[styles.authWizardCard, { opacity: fade }]}>
        {step === 0 ? <RegisterStepName draft={draft} onChange={patchDraft} /> : null}
        {step === 1 ? <RegisterStepAbout draft={draft} onChange={patchDraft} /> : null}
        {step === 2 ? <RegisterStepCommunity draft={draft} onChange={patchDraft} provinces={registrationCommunities} selectedProvince={selectedProvince} /> : null}
        {step === 3 ? <RegisterStepNarrative draft={draft} onChange={patchDraft} /> : null}
      </Animated.View>
      {message ? <Text style={styles.authMessage}>{message}</Text> : null}
      <TouchableOpacity style={styles.authPrimaryButton} onPress={nextStep} disabled={loading} activeOpacity={0.86}>
        <Text style={styles.authPrimaryText}>{step === 3 ? (loading ? 'Registrando...' : 'Crear cuenta') : 'Continuar'}</Text>
      </TouchableOpacity>
      <View style={styles.authStepDots}>
        {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.authStepDot, item === step && styles.authStepDotActive]} />)}
      </View>
    </View>
    </ScrollView>
  );
}

function RegisterStepName({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>¿Cómo te llamás?</Text>
      <Text style={styles.authHeroText}>Antes de comenzar esta aventura, nos gustaría saber quién sos y conocer un poco más de vos.</Text>
      <AuthTextInput label="Nombre" value={draft.firstName} onChangeText={(value) => onChange({ firstName: value })} />
      <AuthTextInput label="Apellido" value={draft.lastName} onChangeText={(value) => onChange({ lastName: value })} />
    </View>
  );
}

function RegisterStepAbout({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>Acerca de ti</Text>
      <Text style={styles.authHeroText}>Esto nos permitirá conocerte un poco mejor y preparar esta aventura para ti.</Text>
      <BirthDatePicker value={draft.birthDate} onChange={(birthDate) => onChange({ birthDate })} />
      <AuthTextInput label="Apodo" value={draft.nickname} onChangeText={(value) => onChange({ nickname: value })} />
      <AuthTextInput label="Contacto" value={draft.contact} onChangeText={(value) => onChange({ contact: value })} keyboardType="phone-pad" />
    </View>
  );
}

function RegisterStepCommunity({ draft, onChange, provinces, selectedProvince }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void; provinces: AppCommunity[]; selectedProvince?: AppCommunity }) {
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [perseveranceYearOpen, setPerseveranceYearOpen] = useState(false);
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>Comunidad y acceso</Text>
      <Text style={styles.authHeroText}>Elegí la provincia donde perseverás o participás actualmente en Palestra y prepará tus datos de ingreso.</Text>
      <AuthSelect label="Provincia" value={draft.province || 'Seleccioná tu provincia'} open={provinceOpen} onToggle={() => setProvinceOpen(!provinceOpen)}>
        {provinces.map((item) => (
          <TouchableOpacity key={item.province} style={styles.authSelectItem} onPress={() => { onChange({ province: item.province, community: '' }); setProvinceOpen(false); setCommunityOpen(false); }}>
            <Text style={styles.authSelectItemText}>{provinceDisplayNames[item.province] ?? item.province}</Text>
          </TouchableOpacity>
        ))}
      </AuthSelect>
      {selectedProvince ? (
        <AuthSelect label="Comunidad" value={draft.community || 'Seleccioná tu comunidad'} open={communityOpen} onToggle={() => setCommunityOpen(!communityOpen)}>
          {selectedProvince.locations.map((item) => (
            <TouchableOpacity key={item.name} style={styles.authSelectItem} onPress={() => { onChange({ community: item.name }); setCommunityOpen(false); }}>
              <Text style={styles.authSelectItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </AuthSelect>
      ) : null}
      <AuthSelect label="Año de inicio en el Movimiento" value={draft.perseveranceStartYear || 'Seleccionar año'} open={perseveranceYearOpen} onToggle={() => setPerseveranceYearOpen(!perseveranceYearOpen)}>
        {perseveranceStartYears.map((year) => (
          <TouchableOpacity key={year} style={styles.authSelectItem} onPress={() => { onChange({ perseveranceStartYear: year }); setPerseveranceYearOpen(false); }}>
            <Text style={styles.authSelectItemText}>{year}</Text>
          </TouchableOpacity>
        ))}
      </AuthSelect>
      <AuthTextInput label="Mail" value={draft.email} onChangeText={(value) => onChange({ email: value })} keyboardType="email-address" autoCapitalize="none" />
      <AuthTextInput label="Contraseña" value={draft.password} onChangeText={(value) => onChange({ password: value })} secureTextEntry autoCapitalize="none" />
    </View>
  );
}

function RegisterStepNarrative({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>Narrativa</Text>
      <Text style={styles.authHeroText}>Esto nos ayuda a hablarte con una cercanía más personal dentro de la app.</Text>
      {(['male', 'female'] as const).map((value) => {
        const narrative = genderNarratives[value];
        const selected = draft.genderPreference === value;
        return (
          <TouchableOpacity key={value} style={[styles.authNarrativeCard, selected && styles.authNarrativeCardActive]} onPress={() => onChange({ genderPreference: value })} activeOpacity={0.86}>
            <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? palette.white : 'rgba(230,243,245,0.72)'} />
            <View style={styles.authNarrativeTextBlock}>
              <Text style={[styles.authNarrativeTitle, selected && styles.authNarrativeTitleActive]}>{narrative.title}</Text>
              <Text style={[styles.authNarrativeText, selected && styles.authNarrativeTextActive]}>{narrative.text}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
