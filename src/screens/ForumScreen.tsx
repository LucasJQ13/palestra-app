import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ForumCategory, ForumComment, ForumTopic, archiveForumComment, archiveForumTopic, canUseForumCategory, createForumComment, createForumTopic, fetchForumCategories, fetchForumComments, fetchForumTopics, setForumTopicStatus, updateForumTopic, visibleForumRolesFor } from '../lib/forum';
import { changeDone } from '../lib/appMessages';
import { fraternalMessages } from '../lib/fraternalMessages';
import { roleRank } from '../lib/roles';
import { roleLabel } from '../lib/profileDisplay';
import { Role, Session } from '../types/auth';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

export function ForumScreen({ session, title }: { session: Session | null; title: string }) {
  const isDark = useIsDarkTheme();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicBody, setTopicBody] = useState('');
  const [topicMinRole, setTopicMinRole] = useState<Role>('invitado');
  const [commentDraft, setCommentDraft] = useState('');
  const [forumMessage, setForumMessage] = useState('');
  const canCreate = Boolean(session && session.status === 'aprobado' && session.role !== 'invitado');
  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);
  const allowedRoles = visibleForumRolesFor(session, selectedCategory);

  async function loadCategories() {
    const items = (await fetchForumCategories()).filter((category) => canUseForumCategory(session, category));
    setCategories(items);
    if ((!selectedCategoryId || !items.some((item) => item.id === selectedCategoryId)) && items.length > 0) {
      const national = items.find((item) => item.scope === 'nacional');
      setSelectedCategoryId((national ?? items[0]).id);
    }
  }

  async function loadTopics(categoryId = selectedCategoryId) {
    if (!categoryId) {
      setTopics([]);
      return;
    }
    setTopics(await fetchForumTopics(categoryId));
  }

  async function openTopic(topic: ForumTopic) {
    setSelectedTopic(topic);
    setComments(await fetchForumComments(topic.id));
  }

  useEffect(() => {
    loadCategories();
  }, [session?.role, session?.province, session?.status]);

  useEffect(() => {
    loadTopics(selectedCategoryId);
    setSelectedTopic(null);
  }, [selectedCategoryId]);

  useEffect(() => {
    const fallbackRole = allowedRoles.includes(topicMinRole) ? topicMinRole : allowedRoles[allowedRoles.length - 1] ?? 'invitado';
    setTopicMinRole(fallbackRole);
  }, [session?.role, selectedCategoryId]);

  async function submitTopic() {
    if (!canCreate) {
      setForumMessage(fraternalMessages.privateAccessRequired('crear temas'));
      return;
    }
    if (!selectedCategoryId || !topicTitle.trim() || !topicBody.trim()) {
      setForumMessage('Completa categoria, titulo y contenido.');
      return;
    }
    const { error } = selectedTopic && selectedTopic.authorId === session?.id
      ? await updateForumTopic({ topicId: selectedTopic.id, title: topicTitle.trim(), body: topicBody.trim(), minRole: topicMinRole })
      : await createForumTopic({ categoryId: selectedCategoryId, title: topicTitle.trim(), body: topicBody.trim(), minRole: topicMinRole });
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setTopicTitle('');
    setTopicBody('');
    setTopicMinRole('invitado');
    setShowComposer(false);
    setForumMessage(changeDone('Tema guardado en el foro.'));
    await loadTopics(selectedCategoryId);
  }

  function startEditTopic(topic: ForumTopic) {
    setSelectedTopic(topic);
    setTopicTitle(topic.title);
    setTopicBody(topic.body);
    setTopicMinRole(topic.minRole);
    setShowComposer(true);
  }

  async function closeTopic(topic: ForumTopic) {
    const nextStatus = topic.status === 'cerrado' ? 'abierto' : 'cerrado';
    const { error } = await setForumTopicStatus(topic.id, nextStatus);
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setForumMessage(changeDone(nextStatus === 'cerrado' ? 'Tema cerrado.' : 'Tema reabierto.'));
    await loadTopics();
    if (selectedTopic?.id === topic.id) {
      setSelectedTopic({ ...topic, status: nextStatus });
    }
  }

  async function deleteTopic(topic: ForumTopic) {
    const confirmed = Platform.OS === 'web' ? (typeof window === 'undefined' ? true : window.confirm('Eliminar este tema del foro?')) : await new Promise<boolean>((resolve) => {
      Alert.alert('Eliminar tema', 'Eliminar este tema del foro?', [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveForumTopic(topic.id);
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setSelectedTopic(null);
    setForumMessage(changeDone('Tema eliminado.'));
    await loadTopics();
  }

  async function submitComment() {
    if (!canCreate) {
      setForumMessage(fraternalMessages.privateAccessRequired('comentar'));
      return;
    }
    if (!selectedTopic || !commentDraft.trim()) {
      setForumMessage('Escribe un comentario antes de publicar.');
      return;
    }
    const { error } = await createForumComment(selectedTopic.id, commentDraft.trim());
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setCommentDraft('');
    setComments(await fetchForumComments(selectedTopic.id));
    setForumMessage(changeDone('Comentario publicado.'));
    await loadTopics(selectedTopic.categoryId);
  }

  async function deleteComment(comment: ForumComment) {
    const { error } = await archiveForumComment(comment.id);
    if (error) {
      setForumMessage(error.message);
      return;
    }
    if (selectedTopic) {
      setComments(await fetchForumComments(selectedTopic.id));
    }
  }

  function canModerateTopic(topic: ForumTopic) {
    return Boolean(session && (topic.authorId === session.id || roleRank(session.role) > roleRank(topic.authorRole)));
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <View style={[styles.contentIntro, isDark && styles.surfacePanelDark]}>
        <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Foro Palestrista</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Temas nacionales y provinciales, ordenados por rango y alcance. Por ahora solo texto.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={[styles.filterChip, isDark && styles.surfaceRowDark, selectedCategoryId === category.id && styles.filterChipActive]} onPress={() => setSelectedCategoryId(category.id)}>
            <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, selectedCategoryId === category.id && styles.filterChipTextActive]}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {selectedCategory ? (
        <View style={styles.featurePanel}>
          <Text style={styles.cardEyebrow}>{selectedCategory.scope}</Text>
          <Text style={styles.cardTitle}>{selectedCategory.name}</Text>
          <Text style={styles.cardText}>{selectedCategory.description ?? 'Categoria del foro.'}</Text>
          {canCreate ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setShowComposer(!showComposer); setSelectedTopic(null); }}>
              <Ionicons name="add-circle-outline" size={17} color={palette.white} />
              <Text style={styles.primaryButtonText}>Crear tema</Text>
            </TouchableOpacity>
          ) : <Text style={styles.cardText}>{fraternalMessages.privateAccessRequired('crear temas o comentar')}</Text>}
        </View>
      ) : null}
      {showComposer ? (
        <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
          <Text style={styles.cardEyebrow}>{selectedTopic ? 'Editar tema' : 'Nuevo tema'}</Text>
          <Text style={styles.inputLabel}>Titulo</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Escribe un titulo claro" placeholderTextColor="#7FA4B5" value={topicTitle} onChangeText={setTopicTitle} />
          <Text style={styles.inputLabel}>Contenido</Text>
          <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="Comparte el tema para conversar en comunidad" placeholderTextColor="#7FA4B5" value={topicBody} onChangeText={setTopicBody} multiline />
          <Text style={styles.cardEyebrow}>Visible para</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {allowedRoles.map((role) => (
              <TouchableOpacity key={role} style={[styles.filterChip, isDark && styles.surfaceRowDark, topicMinRole === role && styles.filterChipActive]} onPress={() => setTopicMinRole(role)}>
                <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, topicMinRole === role && styles.filterChipTextActive]}>{roleLabel(role)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.primaryButton} onPress={submitTopic}>
            <Text style={styles.primaryButtonText}>Guardar tema</Text>
          </TouchableOpacity>
        </View>
      ) : null}
        {forumMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{forumMessage}</Text> : null}
      {selectedTopic ? (
        <View style={styles.profileCommunityPanel}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedTopic(null)}>
            <Ionicons name="chevron-back" size={16} color={palette.red} />
            <Text style={styles.backButtonText}>Volver a temas</Text>
          </TouchableOpacity>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{selectedTopic.status} - {roleLabel(selectedTopic.minRole)} en adelante</Text>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{selectedTopic.title}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{selectedTopic.body}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Por {selectedTopic.authorName} - {roleLabel(selectedTopic.authorRole)}</Text>
          {canModerateTopic(selectedTopic) ? (
            <View style={styles.inlineActions}>
              <TouchableOpacity style={[styles.secondaryButton, isDark && styles.darkSoftButton]} onPress={() => startEditTopic(selectedTopic)}>
                <Text style={[styles.secondaryButtonText, isDark && styles.textDarkAccent]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, isDark && styles.darkSoftButton]} onPress={() => closeTopic(selectedTopic)}>
                <Text style={[styles.secondaryButtonText, isDark && styles.textDarkAccent]}>{selectedTopic.status === 'cerrado' ? 'Reabrir' : 'Cerrar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, isDark && styles.darkSoftButton]} onPress={() => deleteTopic(selectedTopic)}>
                <Text style={[styles.secondaryButtonText, isDark && styles.textDarkAccent]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <SectionTitle title="Respuestas" />
          {comments.length === 0 ? <Text style={styles.cardText}>Todavia no hay respuestas.</Text> : null}
          {comments.map((comment) => (
            <View key={comment.id} style={[styles.innerNewsCard, isDark && styles.surfaceRowDark]}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{comment.authorName} - {roleLabel(comment.authorRole)}</Text>
              <Text style={styles.feedMeta}>{new Date(comment.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{comment.body}</Text>
              {(comment.authorId === session?.id || canModerateTopic(selectedTopic)) ? (
                <TouchableOpacity style={styles.actionPill} onPress={() => deleteComment(comment)}>
                  <Ionicons name="trash-outline" size={16} color={palette.red} />
                  <Text style={styles.actionPillText}>Eliminar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          {canCreate && selectedTopic.status === 'abierto' ? (
            <View style={styles.inlineEditorPanel}>
              <Text style={styles.inputLabel}>Comentario</Text>
              <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="Escribe una respuesta respetuosa" placeholderTextColor="#7FA4B5" value={commentDraft} onChangeText={setCommentDraft} multiline />
              <TouchableOpacity style={styles.primaryButton} onPress={submitComment}>
                <Text style={styles.primaryButtonText}>Publicar respuesta</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.stack}>
          {topics.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Todavia no hay temas publicados en esta categoria.</Text> : null}
          {topics.map((topic) => (
            <TouchableOpacity key={topic.id} style={[styles.innerNewsCard, isDark && styles.surfaceRowDark]} activeOpacity={0.86} onPress={() => openTopic(topic)}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{topic.status} - {roleLabel(topic.minRole)} en adelante</Text>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{topic.title}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{topic.body}</Text>
              <Text style={styles.expandHint}>{topic.replyCount} respuesta/s - abrir tema</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
