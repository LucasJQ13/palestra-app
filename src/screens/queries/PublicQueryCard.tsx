import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PublicQueryRecord } from '../../lib/queries/types';
import { palette } from '../../theme/palette';
import { queryStyles } from './queryStyles';

const statusLabels = {
  nueva: 'Nueva',
  leida: 'Leida',
  respondida: 'Respondida',
  archivada: 'Archivada'
} as const;

export function PublicQueryCard({ query, isDark, onOpen }: { query: PublicQueryRecord; isDark: boolean; onOpen: () => void }) {
  return (
    <TouchableOpacity style={[queryStyles.card, isDark && queryStyles.cardDark]} onPress={onOpen} activeOpacity={0.84}>
      <View style={queryStyles.cardHeader}>
        <View style={queryStyles.cardTitleBlock}>
          <Text numberOfLines={1} style={[queryStyles.sender, isDark && queryStyles.textStrongDark]}>{query.sender_name}</Text>
          <Text numberOfLines={1} style={[queryStyles.destination, isDark && queryStyles.textMutedDark]}>{query.destination_name}</Text>
        </View>
        <View style={[queryStyles.status, query.status === 'nueva' && queryStyles.statusNew]}>
          <Text style={[queryStyles.statusText, query.status === 'nueva' && queryStyles.statusTextNew]}>{statusLabels[query.status]}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={[queryStyles.preview, isDark && queryStyles.textBodyDark]}>{query.message}</Text>
      <View style={queryStyles.metaRow}>
        <Ionicons name="time-outline" size={14} color={palette.inkMuted} />
        <Text style={[queryStyles.meta, isDark && queryStyles.textMutedDark]}>
          {new Date(query.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
