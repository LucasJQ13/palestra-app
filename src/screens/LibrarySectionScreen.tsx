import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { AppLibraryItem, LibrarySection, archiveLibraryItem, debugLibraryPermission, fetchLibraryItems, saveLibraryItem } from '../lib/library';
import { canManagePublishedContent } from '../lib/sessionAccess';
import { roleRank } from '../lib/roles';
import { changeDone } from '../lib/appMessages';
import { inputPlaceholderColor } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';
import { useIsDarkTheme } from '../theme/ThemeContext';

export function LibrarySectionScreen({
  session,
  title,
  section,
  variant,
  content,
  editor
}: {
  session: Session | null;
  title: string;
  section: LibrarySection;
  variant: 'prayer' | 'song';
  content?: AppContentBlock;
  editor?: PageEditorProps;
}) {
  const isDark = useIsDarkTheme();
  const [items, setItems] = useState<AppLibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AppLibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<AppLibraryItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const canCreateItems = section === 'himno'
    ? session?.role === 'administrador'
    : Boolean(session && roleRank(session.role) >= roleRank('sedimentador'));
  const emptyTitle = section === 'oraciones' ? 'No hay oraciones publicadas' : section === 'himno' ? 'Himno no publicado' : 'No hay canciones publicadas';
  const libraryTitle = section === 'oraciones' ? 'Oraciones Recomendadas' : section === 'himno' ? 'Himno de Palestra' : 'Cancionero palestrista';
  const librarySubtitle = section === 'cancionero' ? 'Letras ordenadas para encuentros, retiros y comunidades.' : '';

  async function loadItems() {
    setItems(await fetchLibraryItems(section));
  }

  useEffect(() => {
    loadItems();
    setSelectedItem(null);
    setShowEditor(false);
  }, [section]);

  function resetDraft(item?: AppLibraryItem | null) {
    setEditingItem(item ?? null);
    setDraftTitle(item?.title ?? '');
    setDraftSubtitle(item?.subtitle ?? '');
    setDraftBody(item?.body ?? '');
    setDraftImageUrl(item?.image_url ?? '');
    setShowEditor(true);
    setMessage('');
  }

  function canManageLibraryItem(item: AppLibraryItem) {
    return Boolean(session && (item.created_by === session.id || canManagePublishedContent(session)));
  }

  async function chooseLibraryImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setMessage('Subiendo imagen...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${section}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('library-images')
        .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }
      const { data: publicUrl } = supabase.storage.from('library-images').getPublicUrl(path);
      setDraftImageUrl(publicUrl.publicUrl);
      setMessage(changeDone('Imagen cargada.'));
    } catch {
      setMessage('No pude subir la imagen.');
    }
  }

  async function submitItem() {
    if (!draftTitle.trim() || !draftBody.trim()) {
      setMessage('Completa titulo y contenido antes de guardar.');
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage('Para publicar contenido tenés que iniciar sesión con una cuenta real de Supabase. El acceso de prueba interno no puede guardar publicaciones.');
      return;
    }
    const { error } = await saveLibraryItem({
      id: editingItem?.id,
      section,
      title: draftTitle.trim(),
      subtitle: draftSubtitle.trim(),
      body: draftBody.trim(),
      imageUrl: draftImageUrl.trim() || null,
      category: null,
      source: null,
      itemDate: null,
      status: 'publicado',
      sortOrder: editingItem?.sort_order ?? 100
    });
    if (error) {
      const debug = await debugLibraryPermission();
      if (debug) {
        setMessage(`${error.message} Supabase ve: ${debug.email ?? 'sin mail'} / ${debug.role ?? 'sin rol'} / ${debug.status ?? 'sin estado'}.`);
      } else {
        setMessage(error.message);
      }
      return;
    }
    setMessage(changeDone('Contenido guardado.'));
    setShowEditor(false);
    await loadItems();
  }

  async function deleteItem(item: AppLibraryItem) {
    Alert.alert('Eliminar contenido', 'Este elemento dejara de mostrarse en la app. ¿Deseas continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await archiveLibraryItem(item.id);
          if (error) {
            setMessage(error.message);
            return;
          }
          setSelectedItem(null);
          setMessage(changeDone('Contenido eliminado.'));
          await loadItems();
        }
      }
    ]);
  }

  if (selectedItem) {
    const stanzas = selectedItem.body.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
    return (
      <View style={styles.stack}>
        <TouchableOpacity style={[styles.backButton, isDark && styles.darkSoftButton]} onPress={() => setSelectedItem(null)} activeOpacity={0.82}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
          <Text style={[styles.backButtonText, isDark && styles.textDarkAccent]}>Volver</Text>
        </TouchableOpacity>
        <View style={[variant === 'prayer' ? styles.prayerReader : styles.songReader, isDark && styles.libraryReaderDark]}>
          {variant === 'song' && selectedItem.image_url ? <Image source={{ uri: selectedItem.image_url }} style={styles.songHeroImage} resizeMode="cover" /> : null}
          <Text style={[variant === 'prayer' ? styles.prayerReaderTitle : styles.songReaderTitle, isDark && styles.textDarkStrong]}>{selectedItem.title}</Text>
          {selectedItem.subtitle ? <Text style={[variant === 'prayer' ? styles.prayerReaderSubtitle : styles.songReaderSubtitle, isDark && styles.textDarkMuted]}>{selectedItem.subtitle}</Text> : null}
          <View style={[variant === 'prayer' ? styles.prayerDivider : styles.songDivider, isDark && styles.libraryDividerDark]} />
          {stanzas.map((stanza, index) => (
            <Text key={`${selectedItem.id}-${index}`} style={[variant === 'prayer' ? styles.prayerParagraph : styles.songStanza, isDark && styles.textDarkBody]}>
              {stanza}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  if (section === 'himno' && items.length === 0 && !canCreateItems) {
    return null;
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      {section !== 'himno' ? <EditableIntro content={content} editor={editor} /> : null}
      <View style={[variant === 'prayer' ? styles.libraryPlainPanel : styles.libraryVisualPanel, isDark && styles.libraryPanelDark]}>
        <View style={styles.libraryHeaderRow}>
          <View style={styles.flexOne}>
            <Text style={[variant === 'prayer' ? styles.libraryPlainTitle : styles.libraryVisualTitle, isDark && styles.textDarkStrong]}>{libraryTitle}</Text>
            {librarySubtitle ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{librarySubtitle}</Text> : null}
          </View>
          {canCreateItems ? (
            <TouchableOpacity style={styles.iconActionButton} onPress={() => resetDraft(null)} activeOpacity={0.82}>
              <Ionicons name="add" size={22} color={palette.white} />
            </TouchableOpacity>
          ) : null}
        </View>
        {message ? <Text style={styles.formErrorText}>{message}</Text> : null}
        {showEditor && canCreateItems ? (
          <View style={[styles.libraryEditor, isDark && styles.libraryEditorDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{editingItem ? 'Editar contenido' : 'Nuevo contenido'}</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Titulo" value={draftTitle} onChangeText={setDraftTitle} placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Subtitulo opcional" value={draftSubtitle} onChangeText={setDraftSubtitle} placeholderTextColor={inputPlaceholderColor} />
            {variant === 'song' ? (
              <>
                <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="URL de portada o imagen" value={draftImageUrl} onChangeText={setDraftImageUrl} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
                <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={chooseLibraryImage}>
                  <Text style={styles.secondaryButtonText}>Subir imagen</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <TextInput style={[styles.input, styles.textArea, styles.libraryBodyInput, isDark && styles.inputDark]} placeholder={variant === 'prayer' ? 'Texto de la oracion' : 'Letra separada por estrofas'} value={draftBody} onChangeText={setDraftBody} multiline placeholderTextColor={inputPlaceholderColor} />
            <TouchableOpacity style={styles.primaryButton} onPress={submitItem}>
              <Text style={styles.primaryButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={() => setShowEditor(false)}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {items.length === 0 && (section !== 'himno' || session?.role === 'administrador') ? (
          <View style={styles.emptyLibraryState}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{emptyTitle}</Text>
            {section !== 'himno' ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cuando se cargue contenido en Supabase, aparecera aca sin actualizar la APK.</Text> : null}
          </View>
        ) : null}
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={[variant === 'prayer' ? styles.prayerListRow : styles.songListRow, isDark && styles.libraryListRowDark]} activeOpacity={0.84} onPress={() => setSelectedItem(item)}>
            {variant === 'song' ? (
              <View style={styles.songThumb}>
                {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.songThumbImage} resizeMode="cover" /> : <Ionicons name="musical-notes-outline" size={22} color={palette.red} />}
              </View>
            ) : null}
            <View style={styles.flexOne}>
              <Text style={[variant === 'prayer' ? styles.prayerListTitle : styles.songListTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
              {item.subtitle ? <Text style={[styles.libraryMeta, isDark && styles.textDarkMuted]}>{item.subtitle}</Text> : null}
            </View>
            {canManageLibraryItem(item) ? (
              <View style={styles.libraryActions}>
                <TouchableOpacity style={[styles.tinyIconButton, isDark && styles.tinyIconButtonDark]} onPress={() => resetDraft(item)}>
                  <Ionicons name="create-outline" size={17} color={palette.red} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tinyIconButton, isDark && styles.tinyIconButtonDark]} onPress={() => deleteItem(item)}>
                  <Ionicons name="trash-outline" size={17} color="#B93232" />
                </TouchableOpacity>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={palette.inkMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
