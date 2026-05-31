import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '../../types/auth';
import { SectionTitle } from '../../components/SectionTitle';
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
    { label: 'Nombre', value: session.fullName.split(' ')[0] || session.fullName, icon: 'person-outline' },
    { label: 'Apellido', value: session.fullName.split(' ').slice(1).join(' ') || 'Pendiente', icon: 'person-add-outline' },
    { label: 'Provincia', value: session.province, icon: 'map-outline' },
    { label: 'Contacto', value: session.contact, icon: 'chatbubble-ellipses-outline' },
    { label: 'Comunidad', value: session.communityOfOrigin, icon: 'people-outline' }
  ];

  return (
    <View style={styles.stack}>
      <SectionTitle title="Perfil pendiente" />
      <View style={[styles.profileShell, isDark && styles.surfacePanelDark]}>
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Mail pendiente de confirmacion</Text>
        <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{session.fullName}</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Revisa tu correo para confirmar tu cuenta. Mientras tanto solo esta disponible esta vista limitada.</Text>
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
          <Text style={styles.primaryButtonText}>En caso de no poder confirmar el mail, contactar con un dirigente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSignOut}>
          <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
