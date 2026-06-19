import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { communities } from '../../data/content';
import { checkRegistrationEmailAvailable, createEmailConfirmationRequest } from '../../lib/profiles';
import { AppCommunity, fetchCommunities } from '../../lib/remoteData';
import { getMyProfileSession } from '../../lib/authProfile';
import { supabase } from '../../lib/supabase';
import { APP_MESSAGES, accountStatusMessage, authStepProgressLabel, blockedProfileMessage, hasPlausibleEmailDomain, isValidEmail, pendingProfileMessage, safeAuthError, verifyEmailDomainExists } from '../../lib/appMessages';
import { genderNarratives } from '../../lib/profileDisplay';
import { authDeepLinkBaseUrl, authPasswordResetUrl, palestraLogo, perseveranceStartYears, provinceDisplayNames } from '../../lib/constants';
import { Session } from '../../types/auth';
import { AuthSelect, AuthTextInput, BirthDatePicker } from '../../components/AuthInputs';
import { PasswordInput } from '../../components/auth';
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
      setAuthMessage(result.error ?? APP_MESSAGES.profileReadFailed);
      return;
    }
    if (result.session.status === 'bloqueado') {
      await supabase.auth.signOut();
      setAuthMessage(blockedProfileMessage(result.session.genderPreference, 'pastoral'));
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
            setAuthMessage(`${accountStatusMessage('pendiente', profile.genderPreference, 'pastoral')} ${APP_MESSAGES.auth.emailConfirmationSent}`);
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
  const [loading, setLoading] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  async function submitLogin() {
    if (!isValidEmail(email)) {
      onMessage(APP_MESSAGES.auth.invalidEmail);
      return;
    }
    if (!password) {
      onMessage(APP_MESSAGES.auth.passwordRequired);
      return;
    }
    setLoading(true);
    onMessage(APP_MESSAGES.auth.loginLoading);
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
      onMessage(APP_MESSAGES.auth.recoveryInvalidEmail);
      return;
    }
    setRecoveryLoading(true);
    onMessage(APP_MESSAGES.auth.recoverySending);
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: authPasswordResetUrl
    });
    setRecoveryLoading(false);
    if (error) {
      onMessage(APP_MESSAGES.auth.recoveryFailed);
      return;
    }
    onMessage(APP_MESSAGES.auth.recoverySent);
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
        <Text style={styles.authBrandSubtitle}>{APP_MESSAGES.auth.brandSubtitle}</Text>
      </View>
      <Text style={styles.authHeroTitle}>{APP_MESSAGES.auth.loginTitle}</Text>
      <Text style={styles.authHeroText}>{APP_MESSAGES.auth.loginHelp}</Text>

      <View style={styles.authFormPanel}>
        {showRecoveryForm ? (
          <>
            <Text style={styles.authInputLabel}>{APP_MESSAGES.auth.recoveryTitle}</Text>
            <Text style={styles.authHeroText}>{APP_MESSAGES.auth.recoveryHelp}</Text>
            <AuthTextInput label={APP_MESSAGES.auth.emailLabel} placeholder={APP_MESSAGES.auth.emailPlaceholder} value={recoveryEmail} onChangeText={setRecoveryEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.authPrimaryButton} onPress={recoverPassword} disabled={recoveryLoading} activeOpacity={0.86}>
              <Text style={styles.authPrimaryText}>{recoveryLoading ? APP_MESSAGES.auth.recoverySendingShort : APP_MESSAGES.auth.recoverySubmit}</Text>
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
              <Text style={styles.authGhostText}>{APP_MESSAGES.auth.recoveryBack}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
        <AuthTextInput label={APP_MESSAGES.auth.emailLabel} placeholder={APP_MESSAGES.auth.emailPlaceholder} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <PasswordInput
          variant="auth"
          label={APP_MESSAGES.auth.passwordLabel}
          placeholder={APP_MESSAGES.auth.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
          textContentType="password"
        />
        <TouchableOpacity style={styles.authPrimaryButton} onPress={submitLogin} disabled={loading} activeOpacity={0.86}>
          <Text style={styles.authPrimaryText}>{loading ? APP_MESSAGES.auth.loginLoadingShort : APP_MESSAGES.auth.loginSubmit}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authGhostButton} onPress={onRegister} activeOpacity={0.86}>
          <Text style={styles.authGhostText}>{APP_MESSAGES.auth.registerLink}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openRecoveryForm} activeOpacity={0.75}>
          <Text style={styles.authLinkText}>{APP_MESSAGES.auth.forgotPassword}</Text>
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
        <Text style={styles.authConfirmTitle}>{isError ? APP_MESSAGES.auth.emailConfirmationErrorTitle : APP_MESSAGES.auth.emailConfirmationSuccessTitle}</Text>
        <Text style={styles.authConfirmText}>{message ?? APP_MESSAGES.auth.emailConfirmationSuccessText}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onEnter} activeOpacity={0.86}>
          <Text style={styles.primaryButtonText}>{APP_MESSAGES.auth.enterButton}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const AuthConfirmationScreen = MailConfirmedScreen;

function LimitedPendingProfile({ profile, message, onMessage, onBackToLogin }: { profile: PendingRegistrationProfile; message: string; onMessage: (message: string) => void; onBackToLogin: () => void }) {
  async function requestAdminHelp() {
    onMessage(APP_MESSAGES.auth.sendingHelpRequest);
    const { error } = await createEmailConfirmationRequest({
      userId: profile.userId,
      email: profile.email,
      fullName: profile.fullName,
      province: profile.province,
      communityName: profile.community,
      contact: profile.contact
    });
    onMessage(error ? APP_MESSAGES.auth.requestLeaderHelpFailed : APP_MESSAGES.auth.requestLeaderHelpDone);
  }

  return (
    <ScrollView contentContainerStyle={styles.authScrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} overScrollMode="always">
      <View style={styles.authBrandHeader}>
        <Image source={palestraLogo} style={styles.authLogo} />
        <Text style={styles.authBrandTitle}>{APP_MESSAGES.auth.pendingProfileTitle}</Text>
        <Text style={styles.authBrandSubtitle}>{APP_MESSAGES.auth.pendingProfileSubtitle}</Text>
      </View>
      <View style={styles.authFormPanel}>
        <Text style={styles.authHeroText}>{pendingProfileMessage(profile.genderPreference, 'pastoral')}</Text>
        <Text style={styles.authInputLabel}>{APP_MESSAGES.auth.firstNameLabel}</Text>
        <Text style={styles.authHeroText}>{profile.firstName}</Text>
        <Text style={styles.authInputLabel}>{APP_MESSAGES.auth.lastNameLabel}</Text>
        <Text style={styles.authHeroText}>{profile.lastName}</Text>
        <Text style={styles.authInputLabel}>{APP_MESSAGES.auth.provinceLabel}</Text>
        <Text style={styles.authHeroText}>{profile.province}</Text>
        <Text style={styles.authInputLabel}>{APP_MESSAGES.auth.contactLabel}</Text>
        <Text style={styles.authHeroText}>{profile.contact}</Text>
        <Text style={styles.authInputLabel}>{APP_MESSAGES.auth.communityLabel}</Text>
        <Text style={styles.authHeroText}>{profile.community}</Text>
        <TouchableOpacity style={styles.authPrimaryButton} onPress={requestAdminHelp} activeOpacity={0.86}>
          <Text style={styles.authPrimaryText}>{APP_MESSAGES.auth.requestLeaderHelp}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authGhostButton} onPress={onBackToLogin} activeOpacity={0.86}>
          <Text style={styles.authGhostText}>{APP_MESSAGES.auth.backToLogin}</Text>
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
      onMessage(APP_MESSAGES.auth.nameRequired);
      return false;
    }
    if (step === 1 && (!draft.birthDate || !draft.contact.trim())) {
      onMessage(APP_MESSAGES.auth.aboutRequired);
      return false;
    }
    if (step === 2) {
      if (!draft.province || !draft.community || !draft.perseveranceStartYear) {
        onMessage(APP_MESSAGES.auth.communityRequired);
        return false;
      }
      if (!isValidEmail(draft.email)) {
        onMessage(APP_MESSAGES.auth.invalidEmail);
        return false;
      }
      if (!hasPlausibleEmailDomain(draft.email)) {
        onMessage(APP_MESSAGES.auth.invalidEmailDomain);
        return false;
      }
      if (draft.password.length < 6) {
        onMessage(APP_MESSAGES.auth.shortPassword);
        return false;
      }
    }
    if (step === 3 && !draft.genderPreference) {
      onMessage(APP_MESSAGES.auth.narrativeRequired);
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
      onMessage(APP_MESSAGES.auth.validatingEmail);
      const [domainExists, availability] = await Promise.all([
        verifyEmailDomainExists(draft.email),
        checkRegistrationEmailAvailable(draft.email.trim())
      ]);
      setLoading(false);
      if (domainExists === false) {
        onMessage(APP_MESSAGES.auth.unavailableEmailDomain);
        return;
      }
      if (domainExists === null) {
        onMessage(APP_MESSAGES.auth.domainValidationFailed);
        return;
      }
      if (!availability.available) {
        onMessage(availability.reason || APP_MESSAGES.auth.emailAlreadyRegistered);
        return;
      }
    }
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    setLoading(true);
    onMessage(APP_MESSAGES.auth.registerLoading);
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
          <Text style={styles.authBackText}>{step === 0 ? APP_MESSAGES.auth.loginSubmit : APP_MESSAGES.auth.back}</Text>
        </TouchableOpacity>
        <Text style={styles.authProgressText}>{authStepProgressLabel(step + 1, 4)}</Text>
      </View>
      <Animated.View style={[styles.authWizardCard, { opacity: fade }]}>
        {step === 0 ? <RegisterStepName draft={draft} onChange={patchDraft} /> : null}
        {step === 1 ? <RegisterStepAbout draft={draft} onChange={patchDraft} /> : null}
        {step === 2 ? <RegisterStepCommunity draft={draft} onChange={patchDraft} provinces={registrationCommunities} selectedProvince={selectedProvince} /> : null}
        {step === 3 ? <RegisterStepNarrative draft={draft} onChange={patchDraft} /> : null}
      </Animated.View>
      {message ? <Text style={styles.authMessage}>{message}</Text> : null}
      <TouchableOpacity style={styles.authPrimaryButton} onPress={nextStep} disabled={loading} activeOpacity={0.86}>
        <Text style={styles.authPrimaryText}>{step === 3 ? (loading ? APP_MESSAGES.auth.registerLoadingShort : APP_MESSAGES.auth.registerSubmit) : APP_MESSAGES.auth.continueButton}</Text>
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
      <Text style={styles.authHeroTitle}>{APP_MESSAGES.auth.wizardNameTitle}</Text>
      <Text style={styles.authHeroText}>{APP_MESSAGES.auth.wizardNameHelp}</Text>
      <AuthTextInput label={APP_MESSAGES.auth.firstNameLabel} value={draft.firstName} onChangeText={(value) => onChange({ firstName: value })} />
      <AuthTextInput label={APP_MESSAGES.auth.lastNameLabel} value={draft.lastName} onChangeText={(value) => onChange({ lastName: value })} />
    </View>
  );
}

function RegisterStepAbout({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>{APP_MESSAGES.auth.wizardAboutTitle}</Text>
      <Text style={styles.authHeroText}>{APP_MESSAGES.auth.wizardAboutHelp}</Text>
      <BirthDatePicker value={draft.birthDate} onChange={(birthDate) => onChange({ birthDate })} />
      <AuthTextInput label={APP_MESSAGES.auth.nicknameLabel} value={draft.nickname} onChangeText={(value) => onChange({ nickname: value })} />
      <AuthTextInput label={APP_MESSAGES.auth.contactLabel} value={draft.contact} onChangeText={(value) => onChange({ contact: value })} keyboardType="phone-pad" />
    </View>
  );
}

function RegisterStepCommunity({ draft, onChange, provinces, selectedProvince }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void; provinces: AppCommunity[]; selectedProvince?: AppCommunity }) {
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [perseveranceYearOpen, setPerseveranceYearOpen] = useState(false);
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>{APP_MESSAGES.auth.wizardCommunityTitle}</Text>
      <Text style={styles.authHeroText}>{APP_MESSAGES.auth.wizardCommunityHelp}</Text>
      <AuthSelect label={APP_MESSAGES.auth.provinceLabel} value={draft.province || APP_MESSAGES.auth.selectProvince} open={provinceOpen} onToggle={() => setProvinceOpen(!provinceOpen)}>
        {provinces.map((item) => (
          <TouchableOpacity key={item.province} style={styles.authSelectItem} onPress={() => { onChange({ province: item.province, community: '' }); setProvinceOpen(false); setCommunityOpen(false); }}>
            <Text style={styles.authSelectItemText}>{provinceDisplayNames[item.province] ?? item.province}</Text>
          </TouchableOpacity>
        ))}
      </AuthSelect>
      {selectedProvince ? (
        <AuthSelect label={APP_MESSAGES.auth.communityLabel} value={draft.community || APP_MESSAGES.auth.selectCommunity} open={communityOpen} onToggle={() => setCommunityOpen(!communityOpen)}>
          {selectedProvince.locations.map((item) => (
            <TouchableOpacity key={item.name} style={styles.authSelectItem} onPress={() => { onChange({ community: item.name }); setCommunityOpen(false); }}>
              <Text style={styles.authSelectItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </AuthSelect>
      ) : null}
      <AuthSelect label={APP_MESSAGES.auth.startYearLabel} value={draft.perseveranceStartYear || APP_MESSAGES.auth.selectStartYear} open={perseveranceYearOpen} onToggle={() => setPerseveranceYearOpen(!perseveranceYearOpen)}>
        {perseveranceStartYears.map((year) => (
          <TouchableOpacity key={year} style={styles.authSelectItem} onPress={() => { onChange({ perseveranceStartYear: year }); setPerseveranceYearOpen(false); }}>
            <Text style={styles.authSelectItemText}>{year}</Text>
          </TouchableOpacity>
        ))}
      </AuthSelect>
      <AuthTextInput label={APP_MESSAGES.auth.emailLabel} value={draft.email} onChangeText={(value) => onChange({ email: value })} keyboardType="email-address" autoCapitalize="none" />
      <PasswordInput
        variant="auth"
        label={APP_MESSAGES.auth.passwordLabel}
        value={draft.password}
        onChangeText={(value) => onChange({ password: value })}
        textContentType="newPassword"
      />
    </View>
  );
}

function RegisterStepNarrative({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>{APP_MESSAGES.auth.wizardNarrativeTitle}</Text>
      <Text style={styles.authHeroText}>{APP_MESSAGES.auth.wizardNarrativeHelp}</Text>
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
