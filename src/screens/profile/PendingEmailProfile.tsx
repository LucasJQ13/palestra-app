import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '../../types/auth';
import { SectionTitle } from '../../components/SectionTitle';
import { APP_MESSAGES, pendingProfileMessage } from '../../lib/appMessages';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

export function PendingEmailProfile({
  session,
  isDark,
  authMessage,
  onRequestHelp,
  onSignOut
}: {
  session: Session;
  isDark: boolean;
  authMessage: string;
  onRequestHelp: () => void;
  onSignOut: () => void;
}) {
  const items = [
    { label: APP_MESSAGES.auth.firstNameLabel, value: session.fullName.split(' ')[0] || session.fullName, icon: 'person-outline' },
    { label: APP_MESSAGES.auth.lastNameLabel, value: session.fullName.split(' ').slice(1).join(' ') || APP_MESSAGES.auth.lastNamePending, icon: 'person-add-outline' },
    { label: APP_MESSAGES.auth.provinceLabel, value: session.province, icon: 'map-outline' },
    { label: APP_MESSAGES.auth.contactLabel, value: session.contact, icon: 'chatbubble-ellipses-outline' },
    { label: APP_MESSAGES.auth.communityLabel, value: session.communityOfOrigin, icon: 'people-outline' }
  ];

  return (
    <View style={styles.stack}>
      <SectionTitle title={APP_MESSAGES.auth.pendingProfileTitle} />
      <View style={[styles.profileShell, isDark && styles.surfacePanelDark]}>
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.auth.pendingEmailEyebrow}</Text>
        <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{session.fullName}</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{pendingProfileMessage(session.genderPreference, 'pastoral')}</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.auth.pendingEmailHelp}</Text>
        {authMessage ? <Text style={styles.authMessage}>{authMessage}</Text> : null}
        <View style={styles.profileMetaGrid}>
          {items.map((item) => (
            <View key={item.label} style={[styles.profileMetaItem, isDark && styles.surfaceCardDark]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={17} color={palette.red} />
              <View style={styles.profileMetaText}>
                <Text style={[styles.profileMetaLabel, isDark && styles.textDarkMuted]}>{item.label}</Text>
                <Text style={[styles.profileMetaValue, isDark && styles.textDarkStrong]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={onRequestHelp}>
          <Text style={styles.primaryButtonText}>{APP_MESSAGES.auth.requestLeaderHelp}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSignOut}>
          <Text style={styles.secondaryButtonText}>{APP_MESSAGES.auth.signOut}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
