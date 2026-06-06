import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrayerIntentionRecord, PrayerRemovalNoticeRecord } from '../../lib/profiles';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

type ProfileIntentionsPanelProps = {
  isAdmin: boolean;
  isDark: boolean;
  intentions: PrayerIntentionRecord[];
  message: string;
  notices: PrayerRemovalNoticeRecord[];
  noticeVisible: boolean;
  onCloseNotice: () => void;
  onDeleteIntention: (item: PrayerIntentionRecord) => void;
  onRefresh: () => void;
};

export function ProfileIntentionsPanel({
  isAdmin,
  isDark,
  intentions,
  message,
  notices,
  noticeVisible,
  onCloseNotice,
  onDeleteIntention,
  onRefresh
}: ProfileIntentionsPanelProps) {
  return (
    <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
      <Modal visible={noticeVisible} transparent animationType="fade" onRequestClose={onCloseNotice} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Intencion removida</Text>
            {notices.map((notice) => (
              <Text key={notice.id} style={[styles.cardText, isDark && styles.textDarkBody]}>{notice.message}</Text>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={onCloseNotice}>
              <Text style={styles.primaryButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.settingRow}>
        <View style={styles.settingRowText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{isAdmin ? 'Todas las intenciones' : 'Mis intenciones'}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{isAdmin ? 'Auditoria completa, incluyendo autores de intenciones anonimas.' : 'Revisa cuantas personas rezaron por cada intencion publicada.'}</Text>
        </View>
        <TouchableOpacity style={styles.actionPill} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={16} color={palette.red} />
          <Text style={styles.actionPillText}>Actualizar</Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{message}</Text> : null}
      {intentions.map((item) => (
        <View key={item.id} style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('es-AR') : 'Intencion'}
            {item.is_anonymous ? ' - marcada como anonima' : ''}
          </Text>
          {isAdmin ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Autor real: {item.author_name || 'Palestrista'}</Text> : null}
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.body}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.prayer_count} personas rezaron por esta intencion</Text>
          {isAdmin ? (
            <TouchableOpacity style={styles.actionPill} onPress={() => onDeleteIntention(item)}>
              <Ionicons name="trash-outline" size={16} color={palette.red} />
              <Text style={styles.actionPillText}>Eliminar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}
