import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchModerationQueue, MessageModerationRecord, restrictUserMessaging, restoreUserMessaging, reviewMessageReport } from '../../lib/profiles';
import { inputPlaceholderColor } from '../../lib/constants';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { AppButton, ButtonGroup } from '../../components/ui';

export function MessageModerationAdminPanel({ isDark, onMessage }: { isDark: boolean; onMessage: (message: string) => void }) {
  const [items, setItems] = useState<MessageModerationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [restrictionDays, setRestrictionDays] = useState<Record<string, string>>({});

  async function loadQueue() {
    setLoading(true);
    const queue = await fetchModerationQueue();
    setItems(queue);
    setLoading(false);
  }

  async function review(item: MessageModerationRecord, status: 'resuelto' | 'descartado' | 'en_revision') {
    if (item.item_type !== 'report') {
      onMessage('Los eventos automaticos quedan como auditoria. Revisa el usuario si corresponde.');
      return;
    }
    const { error } = await reviewMessageReport({
      reportId: item.id,
      status,
      actionTaken: actionNotes[item.id] ?? null
    });
    if (error) {
      onMessage(error.message);
      return;
    }
    onMessage('Reporte actualizado.');
    await loadQueue();
  }

  async function restrict(item: MessageModerationRecord) {
    if (!item.reported_user_id) {
      onMessage('No hay usuario reportado para restringir.');
      return;
    }
    const days = Number.parseInt(restrictionDays[item.id] || '7', 10);
    const { error } = await restrictUserMessaging({
      userId: item.reported_user_id,
      reason: actionNotes[item.id] || item.reason || 'Revision de moderacion',
      days: Number.isFinite(days) ? days : 7
    });
    if (error) {
      onMessage(error.message);
      return;
    }
    onMessage('Mensajeria restringida temporalmente.');
    await loadQueue();
  }

  async function restore(item: MessageModerationRecord) {
    if (!item.reported_user_id) {
      onMessage('No hay usuario para restaurar.');
      return;
    }
    const { error } = await restoreUserMessaging(item.reported_user_id);
    if (error) {
      onMessage(error.message);
      return;
    }
    onMessage('Mensajeria restaurada.');
    await loadQueue();
  }

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <View style={styles.settingRow}>
        <View style={styles.adminUserHeaderText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Moderacion de mensajes</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Reportes, eventos del filtro preventivo y acciones de mensajeria.</Text>
        </View>
        <AppButton label="Actualizar" icon="refresh-outline" variant="ghost" size="compact" loading={loading} onPress={loadQueue} />
      </View>
      <View style={styles.mailboxRulesNotice}>
        <Ionicons name="shield-checkmark-outline" size={18} color={palette.red} />
        <Text style={[styles.noticeText, isDark && styles.textDarkBody]}>
          Solo se revisan mensajes reportados o marcados por filtro. No se habilita lectura general de conversaciones privadas.
        </Text>
      </View>
      <ScrollView style={styles.leadershipUsersList} nestedScrollEnabled showsVerticalScrollIndicator>
        {items.length === 0 ? (
          <View style={[styles.card, isDark && styles.surfaceRowDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Sin casos pendientes</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay reportes ni eventos de moderacion visibles para tu rango.</Text>
          </View>
        ) : null}
        {items.map((item) => (
          <View key={`${item.item_type}-${item.id}`} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
            <View style={styles.adminUserHeaderText}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{item.item_type === 'report' ? 'Reporte de usuario' : 'Evento automatico'} - {item.status}</Text>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.reported_user_name || 'Usuario reportado'}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Reporta: {item.reporter_name || 'Sistema'} - Motivo: {item.reason || 'Sin motivo'}</Text>
              {item.comment ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Comentario: {item.comment}</Text> : null}
              {item.message_preview ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Mensaje: {item.message_preview}</Text> : null}
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{new Date(item.created_at).toLocaleString('es-AR')}</Text>
              {item.reviewed_by_name ? <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Revisado por {item.reviewed_by_name}</Text> : null}
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Accion tomada / motivo interno"
                value={actionNotes[item.id] ?? ''}
                onChangeText={(value) => setActionNotes((current) => ({ ...current, [item.id]: value.slice(0, 300) }))}
                placeholderTextColor={inputPlaceholderColor}
              />
              <ButtonGroup>
                <AppButton label="En revision" variant="secondary" size="compact" onPress={() => review(item, 'en_revision')} />
                <AppButton label="Resuelto" variant="ghost" size="compact" onPress={() => review(item, 'resuelto')} />
                <AppButton label="Descartar" variant="dangerGhost" size="compact" onPress={() => review(item, 'descartado')} />
              </ButtonGroup>
              <View style={styles.inlineActions}>
                <TextInput
                  style={[styles.input, styles.compactNumberInput, isDark && styles.inputDark]}
                  placeholder="Dias"
                  value={restrictionDays[item.id] ?? '7'}
                  onChangeText={(value) => setRestrictionDays((current) => ({ ...current, [item.id]: value.replace(/[^0-9]/g, '').slice(0, 3) }))}
                  keyboardType="number-pad"
                  placeholderTextColor={inputPlaceholderColor}
                />
                <AppButton label="Restringir" icon="ban-outline" variant="danger" size="compact" onPress={() => restrict(item)} />
                <AppButton label="Restaurar" icon="refresh-outline" variant="ghost" size="compact" onPress={() => restore(item)} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
