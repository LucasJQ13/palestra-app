import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changeDone } from '../../lib/appMessages';
import { inputPlaceholderColor } from '../../lib/constants';
import { fetchPublicQueries, markPublicQueryRead, respondPublicQuery, setPublicQueryStatus } from '../../lib/queries/publicQueries';
import { PublicQueryRecord, PublicQueryStatus } from '../../lib/queries/types';
import { palette } from '../../theme/palette';
import { PublicQueryCard } from './PublicQueryCard';
import { queryStyles } from './queryStyles';

const filters: Array<{ key: 'todas' | PublicQueryStatus; label: string }> = [
  { key: 'todas', label: 'Todas' },
  { key: 'nueva', label: 'Nuevas' },
  { key: 'leida', label: 'Leidas' },
  { key: 'respondida', label: 'Respondidas' },
  { key: 'archivada', label: 'Archivadas' }
];

export function PublicQueriesInboxScreen({ isDark, onFeedback }: { isDark: boolean; onFeedback: (message: string) => void }) {
  const [queries, setQueries] = useState<PublicQueryRecord[]>([]);
  const [filter, setFilter] = useState<'todas' | PublicQueryStatus>('todas');
  const [selected, setSelected] = useState<PublicQueryRecord | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const visibleQueries = useMemo(
    () => queries.filter((query) => filter === 'todas' || query.status === filter),
    [filter, queries]
  );

  async function refresh() {
    setLoading(true);
    setQueries(await fetchPublicQueries());
    setLoading(false);
  }

  async function openQuery(query: PublicQueryRecord) {
    setSelected(query);
    setResponse(query.response ?? '');
    if (query.status !== 'nueva') {
      return;
    }
    const { error } = await markPublicQueryRead(query.id);
    if (!error) {
      setQueries((current) => current.map((item) => item.id === query.id ? { ...item, status: 'leida' } : item));
      setSelected({ ...query, status: 'leida' });
    }
  }

  async function updateStatus(status: PublicQueryStatus) {
    if (!selected) {
      return;
    }
    const { error } = await setPublicQueryStatus(selected.id, status);
    if (error) {
      onFeedback(error.message);
      return;
    }
    onFeedback(changeDone(`Consulta marcada como ${status}.`));
    setSelected(null);
    await refresh();
  }

  async function submitResponse() {
    if (!selected || !response.trim()) {
      onFeedback('Escribe una respuesta antes de guardar.');
      return;
    }
    const { error } = await respondPublicQuery(selected.id, response.trim());
    if (error) {
      onFeedback(error.message);
      return;
    }
    onFeedback(changeDone('Respuesta registrada en la consulta.'));
    setSelected(null);
    setResponse('');
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <View style={queryStyles.shell}>
      <View style={queryStyles.header}>
        <View style={queryStyles.titleBlock}>
          <Text style={[queryStyles.title, isDark && queryStyles.textStrongDark]}>Bandeja de consultas</Text>
          <Text style={[queryStyles.subtitle, isDark && queryStyles.textBodyDark]}>Consultas publicas e institucionales, separadas de tus chats privados.</Text>
        </View>
        <TouchableOpacity style={queryStyles.closeButton} onPress={refresh} accessibilityLabel="Actualizar consultas">
          <Ionicons name="refresh-outline" size={19} color={palette.red} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={queryStyles.toolbar}>
        {filters.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[queryStyles.filterButton, filter === item.key && queryStyles.filterButtonActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[queryStyles.filterText, filter === item.key && queryStyles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <Text style={[queryStyles.subtitle, isDark && queryStyles.textBodyDark]}>Actualizando consultas...</Text> : null}
      {!loading && visibleQueries.length === 0 ? (
        <View style={queryStyles.empty}>
          <Ionicons name="file-tray-outline" size={28} color={palette.red} />
          <Text style={[queryStyles.sender, isDark && queryStyles.textStrongDark]}>No hay consultas en esta bandeja</Text>
        </View>
      ) : null}
      {visibleQueries.map((query) => (
        <PublicQueryCard key={query.id} query={query} isDark={isDark} onOpen={() => openQuery(query)} />
      ))}

      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={queryStyles.modalOverlay}>
          <View style={[queryStyles.modalCard, isDark && queryStyles.modalCardDark]}>
            <View style={queryStyles.modalHeader}>
              <View style={queryStyles.titleBlock}>
                <Text style={[queryStyles.title, isDark && queryStyles.textStrongDark]}>{selected?.sender_name}</Text>
                <Text style={[queryStyles.subtitle, isDark && queryStyles.textMutedDark]}>{selected?.destination_name}</Text>
              </View>
              <TouchableOpacity style={queryStyles.closeButton} onPress={() => setSelected(null)}>
                <Ionicons name="close" size={21} color={palette.red} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ gap: 12 }}>
              <View>
                <Text style={queryStyles.detailLabel}>Origen</Text>
                <Text style={[queryStyles.detailText, isDark && queryStyles.textBodyDark]}>{selected?.origin.replace(/_/g, ' ')}</Text>
              </View>
              {selected?.sender_contact ? (
                <View>
                  <Text style={queryStyles.detailLabel}>Contacto</Text>
                  <Text selectable style={[queryStyles.detailText, isDark && queryStyles.textBodyDark]}>{selected.sender_contact}</Text>
                </View>
              ) : null}
              <View>
                <Text style={queryStyles.detailLabel}>Consulta</Text>
                <Text selectable style={[queryStyles.detailText, isDark && queryStyles.textBodyDark]}>{selected?.message}</Text>
              </View>
              <Text style={queryStyles.detailLabel}>Respuesta / seguimiento</Text>
              <TextInput
                style={[queryStyles.responseInput, isDark && queryStyles.responseInputDark]}
                value={response}
                onChangeText={(value) => setResponse(value.slice(0, 1000))}
                placeholder="Registra aqui la respuesta o seguimiento realizado"
                placeholderTextColor={inputPlaceholderColor}
                multiline
              />
              <View style={queryStyles.actionRow}>
                <TouchableOpacity style={queryStyles.actionButton} onPress={submitResponse}>
                  <Ionicons name="checkmark-outline" size={17} color={palette.white} />
                  <Text style={queryStyles.actionText}>Guardar respuesta</Text>
                </TouchableOpacity>
                {selected?.status !== 'archivada' ? (
                  <TouchableOpacity style={[queryStyles.actionButton, queryStyles.secondaryButton]} onPress={() => updateStatus('archivada')}>
                    <Ionicons name="archive-outline" size={17} color={palette.red} />
                    <Text style={[queryStyles.actionText, queryStyles.secondaryText]}>Archivar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[queryStyles.actionButton, queryStyles.secondaryButton]} onPress={() => updateStatus('leida')}>
                    <Ionicons name="arrow-undo-outline" size={17} color={palette.red} />
                    <Text style={[queryStyles.actionText, queryStyles.secondaryText]}>Restaurar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
