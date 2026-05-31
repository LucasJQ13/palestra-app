import React, { useEffect, useState } from 'react';
import { Image, Linking, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock, ContentEditorBlock, updateAppContent, updateAppTab } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { changeDone } from '../lib/appMessages';
import { normalizeContentCards, prepareContentCardsForSave } from '../lib/contentBlocks';
import { normalizeExternalUrl } from '../lib/urls';
import { supabase } from '../lib/supabase';
import { inputPlaceholderColor } from '../lib/constants';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

function newContentCard(index: number): ContentEditorBlock {
  return {
    id: `card-${Date.now()}-${index}`,
    type: 'card',
    value: '',
    title: '',
    text: '',
    imageUrl: '',
    linkLabel: '',
    linkUrl: '',
    isVisible: true,
    sortOrder: index + 1
  };
}

function cardHasVisibleContent(block: ContentEditorBlock) {
  return Boolean(
    block.title?.trim()
    || block.text?.trim()
    || block.imageUrl?.trim()
    || block.linkLabel?.trim()
    || block.linkUrl?.trim()
  );
}

export function EditableIntro({ content, editor }: { content?: AppContentBlock; editor?: PageEditorProps }) {
  const isDark = useIsDarkTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(editor?.title ?? '');
  const [draftBlocks, setDraftBlocks] = useState<ContentEditorBlock[]>([]);
  const [editorMessage, setEditorMessage] = useState('');

  useEffect(() => {
    setDraftLabel(editor?.title ?? '');
    setDraftBlocks(normalizeContentCards(content?.blocks, content?.title ?? editor?.title ?? '', content?.body ?? ''));
  }, [content, editor?.title, editor?.tabKey]);

  async function uploadInlineImage(targetId?: string) {
    if (!editor) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setEditorMessage('Necesito permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const applyImage = (uri: string) => {
      setDraftBlocks((current) => {
        const next = current.length ? current : [newContentCard(0)];
        const target = targetId ?? next[next.length - 1]?.id;
        return next.map((block) => block.id === target ? { ...block, imageUrl: uri } : block);
      });
    };

    try {
      setEditorMessage('Subiendo imagen...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${editor.tabKey}/content-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        applyImage(asset.uri);
        setEditorMessage(`No pude subir a Supabase (${uploadError.message}). La imagen quedo cargada localmente para esta edicion.`);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('content-images').getPublicUrl(path);
      applyImage(publicUrl.publicUrl);
      setEditorMessage('Imagen cargada al editor.');
    } catch (error) {
      setEditorMessage(error instanceof Error ? error.message : 'No pude subir la imagen.');
    }
  }

  async function saveInlinePage() {
    if (!editor) {
      return;
    }

    setEditorMessage('Guardando pagina...');
    if (draftLabel.trim() && draftLabel.trim() !== editor.title) {
      const { error: tabError } = await updateAppTab(
        editor.tabKey,
        draftLabel.trim(),
        editor.tab?.visible ?? true,
        editor.tab?.visibleRoles ?? null,
        editor.tab?.icon,
        editor.tab?.sectionType
      );
      if (tabError) {
        setEditorMessage(tabError.message);
        return;
      }
      await editor.onTabsChanged();
    }

    const normalizedBlocks = prepareContentCardsForSave(draftBlocks);
    const firstVisible = normalizedBlocks.find((block) => block.isVisible !== false && cardHasVisibleContent(block));
    const firstText = normalizedBlocks.find((block) => block.isVisible !== false && block.text?.trim());
    const titleFromBlocks = firstVisible?.title?.trim() || draftLabel.trim() || editor.title;
    const bodyFromBlocks = firstText?.text?.trim() || '';
    const { error } = await updateAppContent(editor.tabKey, titleFromBlocks, bodyFromBlocks, normalizedBlocks);
    if (error) {
      setEditorMessage(error.message);
      return;
    }
    await editor.onContentChanged();
    setEditorMessage(changeDone('Pagina actualizada.'));
    setIsEditing(false);
  }

  function addInlineCard() {
    setDraftBlocks((current) => [...current, newContentCard(current.length)]);
  }

  function duplicateInlineCard(block: ContentEditorBlock) {
    setDraftBlocks((current) => [
      ...current,
      {
        ...block,
        id: `card-${Date.now()}-${current.length}`,
        sortOrder: current.length + 1
      }
    ]);
  }

  function moveInlineBlock(index: number, direction: -1 | 1) {
    setDraftBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next.map((block, blockIndex) => ({ ...block, sortOrder: blockIndex + 1 }));
    });
  }

  function updateInlineBlock(id: string, values: Partial<ContentEditorBlock>) {
    setDraftBlocks((current) => current.map((block) => block.id === id ? { ...block, ...values } : block));
  }

  function renderCard(block: ContentEditorBlock, index: number) {
    if (block.isVisible === false || !cardHasVisibleContent(block)) {
      return null;
    }
    const linkTarget = block.linkUrl?.trim() || block.linkLabel?.trim() || '';
    return (
      <View key={`${block.id}-${index}`} style={[styles.contentIntro, styles.contentBlockCard, isDark && styles.surfacePanelDark]}>
        {block.imageUrl?.trim() ? <Image source={{ uri: block.imageUrl.trim() }} style={styles.cardImage} /> : null}
        {block.title?.trim() ? <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{block.title.trim()}</Text> : null}
        {block.text?.trim() ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{block.text.trim()}</Text> : null}
        {linkTarget ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(normalizeExternalUrl(linkTarget))}>
            <Ionicons name="link-outline" size={18} color={palette.red} />
            <Text style={styles.secondaryButtonText}>{block.linkLabel?.trim() || block.linkUrl?.trim()}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const contentCards = normalizeContentCards(content?.blocks, content?.title ?? '', content?.body ?? '');
  const renderedContent = content ? (
    <View style={styles.contentBlockStack}>
      {contentCards.some((block) => block.isVisible !== false && cardHasVisibleContent(block))
        ? contentCards.map(renderCard)
        : (
            <View style={[styles.contentIntro, isDark && styles.surfacePanelDark]}>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{content.title}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{content.body}</Text>
            </View>
          )}
    </View>
  ) : null;

  if (editor?.isAdmin) {
    return (
      <View style={styles.stackTight}>
        <TouchableOpacity style={styles.inlineEditButton} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? 'close-outline' : 'create-outline'} size={18} color={palette.red} />
          <Text style={styles.inlineEditButtonText}>{isEditing ? 'Cerrar editor' : 'Editar pagina'}</Text>
        </TouchableOpacity>
        {isEditing ? (
          <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cada card puede tener titulo, texto, imagen opcional, boton/link, visibilidad y orden. Ningun campo es obligatorio.</Text>
            <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Nombre de la pagina</Text>
            <TextInput style={styles.input} value={draftLabel} onChangeText={setDraftLabel} placeholder="Nombre visible en navegacion" placeholderTextColor={inputPlaceholderColor} />
            <View style={styles.inlineEditorToolbar}>
              <TouchableOpacity style={styles.smallActionButton} onPress={addInlineCard}>
                <Ionicons name="add-circle-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Agregar card</Text>
              </TouchableOpacity>
            </View>
            {draftBlocks.map((block, index) => (
              <View key={`${block.id}-${index}`} style={[styles.inlineBlockEditor, isDark && styles.surfaceRowDark]}>
                <View style={styles.inlineBlockHeader}>
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Card {index + 1}</Text>
                  <View style={styles.inlineIconActions}>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => moveInlineBlock(index, -1)}>
                      <Ionicons name="arrow-up-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => moveInlineBlock(index, 1)}>
                      <Ionicons name="arrow-down-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => duplicateInlineCard(block)}>
                      <Ionicons name="copy-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => setDraftBlocks((current) => current.filter((item) => item.id !== block.id))}>
                      <Ionicons name="trash-outline" size={16} color={palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inlineBlockHeader}>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Visible</Text>
                  <Switch value={block.isVisible !== false} onValueChange={(value) => updateInlineBlock(block.id, { isVisible: value })} />
                </View>
                <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Titulo</Text>
                <TextInput style={styles.input} placeholder="Titulo de la card" value={block.title ?? ''} onChangeText={(value) => updateInlineBlock(block.id, { title: value })} placeholderTextColor={inputPlaceholderColor} />
                <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Texto</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de la card" value={block.text ?? ''} onChangeText={(value) => updateInlineBlock(block.id, { text: value })} multiline placeholderTextColor={inputPlaceholderColor} />
                <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Imagen opcional</Text>
                <View style={styles.inlineActions}>
                  <TouchableOpacity style={styles.smallActionButton} onPress={() => uploadInlineImage(block.id)}>
                    <Ionicons name="image-outline" size={16} color={palette.red} />
                    <Text style={styles.smallActionText}>Subir</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} placeholder="URL de imagen" value={block.imageUrl ?? ''} onChangeText={(value) => updateInlineBlock(block.id, { imageUrl: value })} placeholderTextColor={inputPlaceholderColor} />
                {block.imageUrl?.trim() ? <Image source={{ uri: block.imageUrl.trim() }} style={styles.cardImage} /> : null}
                <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Boton/link opcional</Text>
                <TextInput style={styles.input} placeholder="Texto del boton" value={block.linkLabel ?? ''} onChangeText={(value) => updateInlineBlock(block.id, { linkLabel: value })} placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={styles.input} placeholder="https://... o destino interno" value={block.linkUrl ?? ''} onChangeText={(value) => updateInlineBlock(block.id, { linkUrl: value })} placeholderTextColor={inputPlaceholderColor} />
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={saveInlinePage}>
              <Text style={styles.primaryButtonText}>Guardar pagina</Text>
            </TouchableOpacity>
            {editorMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{editorMessage}</Text> : null}
          </View>
        ) : null}
        {renderedContent}
      </View>
    );
  }

  if (!content) {
    return null;
  }

  return renderedContent;
}
