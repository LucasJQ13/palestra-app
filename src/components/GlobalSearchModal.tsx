import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalSearchResult } from '../types/appUi';
import { inputPlaceholderColor } from '../lib/constants';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

type GlobalSearchModalProps = {
  identityPrimaryColor: string;
  isDarkTheme: boolean;
  loading: boolean;
  message: string;
  onClose: () => void;
  onOpenResult: (result: GlobalSearchResult) => void;
  onQueryChange: (value: string) => void;
  onRunSearch: () => void;
  query: string;
  results: GlobalSearchResult[];
  visible: boolean;
};

export function GlobalSearchModal({
  identityPrimaryColor,
  isDarkTheme,
  loading,
  message,
  onClose,
  onOpenResult,
  onQueryChange,
  onRunSearch,
  query,
  results,
  visible
}: GlobalSearchModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboardAvoider}>
          <View style={[styles.modalPanel, styles.globalSearchPanel, isDarkTheme && styles.surfacePanelDark]}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color={palette.red} />
            </TouchableOpacity>
            <Text style={[styles.cardEyebrow, isDarkTheme && styles.textDarkAccent]}>Búsqueda global</Text>
            <View style={styles.globalSearchRow}>
              <TextInput
                style={[styles.input, styles.globalSearchInput, isDarkTheme && styles.inputDark]}
                placeholder="Usuarios, comunidades, PMs, noticias..."
                value={query}
                onChangeText={onQueryChange}
                onSubmitEditing={onRunSearch}
                returnKeyType="search"
                autoCapitalize="none"
                placeholderTextColor={inputPlaceholderColor}
              />
              <TouchableOpacity style={[styles.globalSearchButton, { backgroundColor: identityPrimaryColor }]} onPress={onRunSearch} disabled={loading} activeOpacity={0.84}>
                <Ionicons name={loading ? 'hourglass-outline' : 'search-outline'} size={20} color={palette.white} />
              </TouchableOpacity>
            </View>
            {message ? <Text style={[styles.cardText, isDarkTheme && styles.textDarkBody]}>{message}</Text> : null}
            <ScrollView
              style={styles.globalSearchResultsScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={styles.globalSearchResults}
            >
              {results.map((result) => (
                <TouchableOpacity key={result.id} style={[styles.innerNewsCard, isDarkTheme && styles.surfaceRowDark]} onPress={() => onOpenResult(result)} activeOpacity={0.86}>
                  <Text style={[styles.cardEyebrow, isDarkTheme && styles.textDarkAccent]}>{result.type}</Text>
                  <Text style={[styles.cardTitle, isDarkTheme && styles.textDarkStrong]}>{result.title}</Text>
                  <Text style={[styles.cardText, isDarkTheme && styles.textDarkBody]}>{result.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
