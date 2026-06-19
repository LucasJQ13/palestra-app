import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity } from '../../lib/remoteData';
import { APP_MESSAGES } from '../../lib/appMessages';
import { inputPlaceholderColor, perseveranceStartYears } from '../../lib/constants';
import { ActionButton } from '../../components/ActionButton';
import { PasswordInput } from '../../components/auth';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

type AuthMode = 'login' | 'register';

export function GuestProfileAuthCard({
  authMode,
  setAuthMode,
  authFocusedField,
  setAuthFocusedField,
  authErrors,
  setAuthErrors,
  authMessage,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authPasswordConfirm,
  setAuthPasswordConfirm,
  registerFullName,
  setRegisterFullName,
  registerContact,
  setRegisterContact,
  registerProvince,
  setRegisterProvince,
  registerCommunity,
  setRegisterCommunity,
  registerPerseveranceStartYear,
  setRegisterPerseveranceStartYear,
  registrationCommunities,
  selectedRegistrationProvince,
  provinceDropdownOpen,
  setProvinceDropdownOpen,
  communityDropdownOpen,
  setCommunityDropdownOpen,
  registerPerseveranceYearDropdownOpen,
  setRegisterPerseveranceYearDropdownOpen,
  onRegister,
  onSignIn
}: {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authFocusedField: string;
  setAuthFocusedField: (field: string) => void;
  authErrors: Record<string, string>;
  setAuthErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  authMessage: string;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authPasswordConfirm: string;
  setAuthPasswordConfirm: (value: string) => void;
  registerFullName: string;
  setRegisterFullName: (value: string) => void;
  registerContact: string;
  setRegisterContact: (value: string) => void;
  registerProvince: string;
  setRegisterProvince: (value: string) => void;
  registerCommunity: string;
  setRegisterCommunity: (value: string) => void;
  registerPerseveranceStartYear: string;
  setRegisterPerseveranceStartYear: (value: string) => void;
  registrationCommunities: AppCommunity[];
  selectedRegistrationProvince?: AppCommunity;
  provinceDropdownOpen: boolean;
  setProvinceDropdownOpen: (value: boolean) => void;
  communityDropdownOpen: boolean;
  setCommunityDropdownOpen: (value: boolean) => void;
  registerPerseveranceYearDropdownOpen: boolean;
  setRegisterPerseveranceYearDropdownOpen: (value: boolean) => void;
  onRegister: () => void;
  onSignIn: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{APP_MESSAGES.auth.guestTitle}</Text>
      <Text style={styles.cardText}>{APP_MESSAGES.auth.guestHelp}</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, authMode === 'login' && styles.filterChipActive]} onPress={() => setAuthMode('login')}>
          <Text style={[styles.filterChipText, authMode === 'login' && styles.filterChipTextActive]}>{APP_MESSAGES.auth.guestLoginTab}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, authMode === 'register' && styles.filterChipActive]} onPress={() => setAuthMode('register')}>
          <Text style={[styles.filterChipText, authMode === 'register' && styles.filterChipTextActive]}>{APP_MESSAGES.auth.guestRegisterTab}</Text>
        </TouchableOpacity>
      </View>
      {authMode === 'register' ? (
        <>
          <Text style={styles.cardTitle}>{APP_MESSAGES.auth.guestRegisterTitle}</Text>
          <Text style={styles.cardText}>{APP_MESSAGES.auth.guestRegisterHelp}</Text>
          <Text style={styles.inputLabel}>{APP_MESSAGES.auth.fullNameLabel}</Text>
          <TextInput style={[styles.input, authFocusedField === 'fullName' && styles.inputFocused, authErrors.fullName && styles.inputError]} placeholder="" value={registerFullName} onChangeText={(value) => { setRegisterFullName(value); setAuthErrors((current) => ({ ...current, fullName: '' })); }} onFocus={() => setAuthFocusedField('fullName')} onBlur={() => setAuthFocusedField('')} placeholderTextColor={inputPlaceholderColor} />
          {authErrors.fullName ? <Text style={styles.formErrorText}>{authErrors.fullName}</Text> : null}
          <Text style={styles.inputLabel}>{APP_MESSAGES.auth.contactLabel}</Text>
          <TextInput style={[styles.input, authFocusedField === 'contact' && styles.inputFocused]} placeholder="" value={registerContact} onChangeText={setRegisterContact} onFocus={() => setAuthFocusedField('contact')} onBlur={() => setAuthFocusedField('')} placeholderTextColor={inputPlaceholderColor} />
          <Text style={styles.inputLabel}>{APP_MESSAGES.auth.provinceLabel}</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setProvinceDropdownOpen(!provinceDropdownOpen)}>
            <Text style={styles.dropdownButtonText}>{registerProvince || APP_MESSAGES.auth.selectProvince}</Text>
            <Ionicons name={provinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
          </TouchableOpacity>
          {authErrors.province ? <Text style={styles.formErrorText}>{authErrors.province}</Text> : null}
          {provinceDropdownOpen ? (
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {registrationCommunities.map((item) => (
                <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setRegisterProvince(item.province); setRegisterCommunity(''); setAuthErrors((current) => ({ ...current, province: '', community: '' })); setProvinceDropdownOpen(false); }}>
                  <Text style={styles.dropdownItemText}>{item.province}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          {selectedRegistrationProvince ? (
            <>
              <Text style={styles.inputLabel}>{APP_MESSAGES.auth.communityLabel}</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setCommunityDropdownOpen(!communityDropdownOpen)}>
                <Text style={styles.dropdownButtonText}>{registerCommunity || APP_MESSAGES.auth.selectCommunity}</Text>
                <Ionicons name={communityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {authErrors.community ? <Text style={styles.formErrorText}>{authErrors.community}</Text> : null}
              {communityDropdownOpen ? (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {selectedRegistrationProvince.locations.map((item) => (
                    <TouchableOpacity key={item.name} style={styles.dropdownItem} onPress={() => { setRegisterCommunity(item.name); setAuthErrors((current) => ({ ...current, community: '' })); setCommunityDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : null}
          <Text style={styles.inputLabel}>{APP_MESSAGES.auth.startYearLabel}</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setRegisterPerseveranceYearDropdownOpen(!registerPerseveranceYearDropdownOpen)}>
            <Text style={styles.dropdownButtonText}>{registerPerseveranceStartYear || APP_MESSAGES.auth.selectStartYear}</Text>
            <Ionicons name={registerPerseveranceYearDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
          </TouchableOpacity>
          {authErrors.perseverance ? <Text style={styles.formErrorText}>{authErrors.perseverance}</Text> : null}
          {registerPerseveranceYearDropdownOpen ? (
            <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {perseveranceStartYears.map((year) => (
                <TouchableOpacity key={year} style={styles.dropdownItem} onPress={() => { setRegisterPerseveranceStartYear(year); setAuthErrors((current) => ({ ...current, perseverance: '' })); setRegisterPerseveranceYearDropdownOpen(false); }}>
                  <Text style={styles.dropdownItemText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </>
      ) : null}
      <Text style={styles.inputLabel}>{APP_MESSAGES.auth.emailLabel}</Text>
      <TextInput style={[styles.input, authFocusedField === 'email' && styles.inputFocused, authErrors.email && styles.inputError]} placeholder={authMode === 'register' ? '' : APP_MESSAGES.auth.signInEmailPlaceholder} value={authEmail} onChangeText={(value) => { setAuthEmail(value); setAuthErrors((current) => ({ ...current, email: '' })); }} autoCapitalize="none" keyboardType="email-address" onFocus={() => setAuthFocusedField('email')} onBlur={() => setAuthFocusedField('')} placeholderTextColor={inputPlaceholderColor} />
      {authErrors.email ? <Text style={styles.formErrorText}>{authErrors.email}</Text> : null}
      <PasswordInput
        label={APP_MESSAGES.auth.passwordLabel}
        style={[authFocusedField === 'password' && styles.inputFocused, authErrors.password && styles.inputError]}
        placeholder={authMode === 'register' ? APP_MESSAGES.auth.passwordMinimumPlaceholder : APP_MESSAGES.auth.passwordPlaceholder}
        value={authPassword}
        onChangeText={(value) => { setAuthPassword(value); setAuthErrors((current) => ({ ...current, password: '', confirm: '' })); }}
        onFocus={() => setAuthFocusedField('password')}
        onBlur={() => setAuthFocusedField('')}
        returnKeyType="done"
        textContentType={authMode === 'register' ? 'newPassword' : 'password'}
      />
      {authErrors.password ? <Text style={styles.formErrorText}>{authErrors.password}</Text> : null}
      {authMode === 'register' ? (
        <>
          <PasswordInput
            label={APP_MESSAGES.auth.passwordConfirmLabel}
            style={[authFocusedField === 'confirm' && styles.inputFocused, authErrors.confirm && styles.inputError]}
            placeholder={APP_MESSAGES.auth.passwordConfirmPlaceholder}
            value={authPasswordConfirm}
            onChangeText={(value) => { setAuthPasswordConfirm(value); setAuthErrors((current) => ({ ...current, confirm: '' })); }}
            onFocus={() => setAuthFocusedField('confirm')}
            onBlur={() => setAuthFocusedField('')}
            textContentType="newPassword"
          />
          {authErrors.confirm ? <Text style={styles.formErrorText}>{authErrors.confirm}</Text> : null}
        </>
      ) : null}
      {authMode === 'register' ? <ActionButton label={APP_MESSAGES.auth.guestRegisterSubmit} onPress={onRegister} /> : <ActionButton label={APP_MESSAGES.auth.guestLoginTab} onPress={onSignIn} />}
      {authMessage ? <Text style={styles.cardText}>{authMessage}</Text> : null}
    </View>
  );
}
