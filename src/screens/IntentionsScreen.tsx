import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock, ContentEditorBlock, PrayerIntentionRecord, createPrayerIntention, deliverNotificationIntent, fetchRandomPrayerIntention, recordPrayerForIntention, updateAppContent, updateAppTab } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { inputPlaceholderColor } from '../lib/constants';
import { APP_MESSAGES, changeDone } from '../lib/appMessages';
import { normalizeContentCards, prepareContentCardsForSave } from '../lib/contentBlocks';
import { supabase } from '../lib/supabase';
import { Session } from '../types/auth';
import { AppButton, ButtonGroup, IconButton } from '../components/ui';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { styles } from '../theme/appStyles';

const defaultSpiritImage = require('../../assets/espiritu-santo.png');
const defaultFireImage = require('../../assets/fuego-intenciones.png');

export function IntentionsScreen({ session, title, content, editor, prayerSeconds = 60 }: { session: Session | null; title: string; content?: AppContentBlock; editor?: PageEditorProps; prayerSeconds?: number }) {
  const isDark = useIsDarkTheme();
  const effectivePrayerSeconds = Math.max(10, Math.min(600, Number(prayerSeconds) || 60));
  const [showCreate, setShowCreate] = useState(false);
  const [heroEditing, setHeroEditing] = useState(false);
  const [heroTitleDraft, setHeroTitleDraft] = useState(content?.title || 'Deja tus intenciones\ny ora por otras personas');
  const [heroImageDraft, setHeroImageDraft] = useState('');
  const [heroEditMessage, setHeroEditMessage] = useState('');
  const [intentionText, setIntentionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [currentIntention, setCurrentIntention] = useState<PrayerIntentionRecord | null>(null);
  const [prayedIds, setPrayedIds] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(effectivePrayerSeconds);
  const [isPraying, setIsPraying] = useState(false);
  const [completedPrayer, setCompletedPrayer] = useState(false);
  const [prayerAcknowledged, setPrayerAcknowledged] = useState(false);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);
  const [prayerCount, setPrayerCount] = useState(0);
  const flamePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cards = normalizeContentCards(content?.blocks, content?.title ?? '', content?.body ?? '');
    setHeroTitleDraft(content?.title || 'Deja tus intenciones\ny ora por otras personas');
    setHeroImageDraft(cards.find((block) => block.isVisible !== false && block.imageUrl?.trim())?.imageUrl?.trim() || '');
  }, [content?.title, content?.blocks]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flamePulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flamePulse]);

  useEffect(() => {
    if (!isPraying || !currentIntention) {
      return undefined;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          finishPrayer(currentIntention.id);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPraying, currentIntention?.id]);

  const waxProgress = Math.max(0.18, remainingSeconds / effectivePrayerSeconds);
  const flameScale = flamePulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  const flameOpacity = flamePulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
  const heroTitle = content?.title || 'Deja tus intenciones\ny ora por otras personas';
  const heroCards = normalizeContentCards(content?.blocks, content?.title ?? '', content?.body ?? '');
  const heroImageUrl = heroCards.find((block) => block.isVisible !== false && block.imageUrl?.trim())?.imageUrl?.trim() || '';

  async function saveIntention() {
    if (!session?.id || session.status !== 'aprobado') {
      setMessage('Necesitas iniciar sesion con un usuario aprobado para crear intenciones.');
      return;
    }
    if (!intentionText.trim()) {
      setMessage('Escribi una intencion antes de guardarla.');
      return;
    }
    const { error } = await createPrayerIntention(intentionText.trim(), isAnonymous);
    if (error) {
      setMessage(error.message);
      return;
    }
    setIntentionText('');
    setIsAnonymous(false);
    setShowCreate(false);
    setMessage(changeDone('Intencion creada. Otros usuarios ya pueden rezar por ella.'));
  }

  async function uploadHeroImage() {
    if (!editor?.isAdmin) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setHeroEditMessage(APP_MESSAGES.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setHeroEditMessage('Subiendo imagen...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `intenciones/hero-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });
      if (uploadError) {
        setHeroEditMessage(`No pude subir a Supabase: ${uploadError.message}. No se guardara una URL local.`);
        return;
      }
      const { data: publicUrl } = supabase.storage.from('content-images').getPublicUrl(path);
      setHeroImageDraft(publicUrl.publicUrl);
      setHeroEditMessage('Imagen cargada.');
    } catch (error) {
      setHeroEditMessage(error instanceof Error ? error.message : 'No pude subir la imagen.');
    }
  }

  async function saveHeroContent() {
    if (!editor?.isAdmin) {
      return;
    }
    const title = heroTitleDraft.trim() || 'Deja tus intenciones\ny ora por otras personas';
    const blocks: ContentEditorBlock[] = prepareContentCardsForSave([{
      id: 'intenciones-hero',
      type: 'card',
      title,
      text: '',
      imageUrl: heroImageDraft.trim(),
      linkLabel: '',
      linkUrl: '',
      isVisible: true,
      sortOrder: 1,
      value: title
    }]);
    setHeroEditMessage('Guardando portada...');
    const { error: tabError } = await updateAppTab(
      editor.tabKey,
      editor.title,
      editor.tab?.visible ?? true,
      editor.tab?.visibleRoles ?? null,
      editor.tab?.icon,
      editor.tab?.sectionType
    );
    if (tabError) {
      setHeroEditMessage(tabError.message);
      return;
    }
    const { error } = await updateAppContent(editor.tabKey, title, '', blocks);
    if (error) {
      setHeroEditMessage(error.message);
      return;
    }
    await editor.onTabsChanged();
    await editor.onContentChanged();
    setHeroEditMessage(changeDone('Portada actualizada.'));
    setHeroEditing(false);
  }

  async function startPrayer(resetSeen = false) {
    if (!session?.id || session.status !== 'aprobado') {
      setMessage('Necesitas iniciar sesion con un usuario aprobado para rezar por intenciones.');
      return;
    }
    const excludeIds = resetSeen ? [] : prayedIds;
    setMessage('Buscando una intencion para rezar...');
    setCompletedPrayer(false);
    setPrayerAcknowledged(false);
    setPrayerCount(0);
    const { data, error } = await fetchRandomPrayerIntention(excludeIds);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (!data && excludeIds.length > 0) {
      await startPrayer(true);
      return;
    }
    if (!data) {
      setMessage('No hay intenciones disponibles de otros usuarios por ahora.');
      return;
    }
    setCurrentIntention(data);
    setPrayedIds((current) => Array.from(new Set([...current, data.id])));
    setRemainingSeconds(effectivePrayerSeconds);
    setIsPraying(true);
    setPrayerModalVisible(true);
    setMessage('');
  }

  async function finishPrayer(intentionId: string) {
    setIsPraying(false);
    const { data, error } = await recordPrayerForIntention(intentionId);
    if (error) {
      setMessage(error.message);
      setCompletedPrayer(true);
      return;
    }
    setPrayerCount(data?.prayer_count ?? 0);
    if (data?.notification_intent_id) {
      await deliverNotificationIntent(data.notification_intent_id).catch(() => undefined);
    }
    setCompletedPrayer(true);
  }

  function closePrayerModal() {
    setPrayerModalVisible(false);
    setIsPraying(false);
  }

  const authorLabel = currentIntention?.is_anonymous ? 'Anonimo' : currentIntention?.author_name || 'Palestrista';

  return (
    <ScrollView style={isDark ? styles.contentDark : undefined} contentContainerStyle={[styles.content, styles.intentionsContent, isDark && styles.intentionsContentDark]}>
      <View style={[styles.intentionsHero, isDark && styles.intentionsHeroDark]}>
        <View style={[styles.intentionsSpiritImage, isDark && styles.intentionsSpiritImageDark]}>
          <Image source={heroImageUrl ? { uri: heroImageUrl } : defaultSpiritImage} style={styles.intentionsSpiritPhoto} />
        </View>
        <Text style={styles.intentionsHeroTitle}>{heroTitle}</Text>
        <View style={[styles.intentionsFlameCorner, isDark && styles.intentionsFlameCornerDark]}>
          <Image source={defaultFireImage} style={styles.intentionsFlameImage} />
        </View>
      </View>
      {editor?.isAdmin ? (
        <View style={styles.stackTight}>
          <AppButton
            label={heroEditing ? 'Cerrar editor' : 'Editar pagina'}
            icon={heroEditing ? 'close-outline' : 'create-outline'}
            variant="secondary"
            size="compact"
            onPress={() => setHeroEditing((current) => !current)}
          />
          {heroEditing ? (
            <View style={[styles.inlineEditorPanel, styles.intentionsPanel, isDark && styles.intentionsPanelDark]}>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Texto principal</Text>
              <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} value={heroTitleDraft} onChangeText={setHeroTitleDraft} multiline placeholder="Deja tus intenciones..." placeholderTextColor={inputPlaceholderColor} />
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Imagen del Espiritu Santo</Text>
              <View style={styles.inlineActions}>
                <AppButton label="Subir" icon="image-outline" variant="secondary" size="compact" onPress={uploadHeroImage} />
              </View>
              <TextInput style={[styles.input, isDark && styles.inputDark]} value={heroImageDraft} onChangeText={setHeroImageDraft} placeholder="URL de imagen" placeholderTextColor={inputPlaceholderColor} />
              <AppButton label="Guardar portada" icon="save-outline" onPress={saveHeroContent} />
              {heroEditMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{heroEditMessage}</Text> : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {!session?.id ? (
        <View style={[styles.card, styles.intentionsPanel, isDark && styles.intentionsPanelDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Inicia sesion</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Necesitas estar registrado para crear o rezar por una intencion.</Text>
        </View>
      ) : null}

      <View style={styles.intentionsMainActions}>
        <AppButton label="Crear Intencion" icon="create-outline" variant={showCreate ? 'primary' : 'secondary'} size="prominent" onPress={() => setShowCreate((current) => !current)} />
        <AppButton label="Rezar por una Intencion" icon="flame-outline" size="prominent" onPress={() => startPrayer()} disabled={isPraying} />
      </View>

      {showCreate ? (
        <View style={[styles.intentionInputCard, isDark && styles.intentionInputCardDark]}>
          <View style={styles.intentionsInputHeader}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Dejo mi intencion aqui</Text>
            <Ionicons name="pencil-outline" size={20} color="#f28a00" />
          </View>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholder="Escribi tu intencion"
            value={intentionText}
            onChangeText={setIntentionText}
            multiline
            placeholderTextColor={inputPlaceholderColor}
          />
          <View style={styles.settingRow}>
            <View style={styles.settingRowText}>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Publicar como anonima</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Si esta activo, otros usuarios no veran tu nombre.</Text>
            </View>
            <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ false: isDark ? '#55514a' : '#efdcc1', true: '#f28a00' }} thumbColor={isAnonymous ? '#fff4df' : '#ffffff'} />
          </View>
          <AppButton label="Guardar intencion" icon="save-outline" onPress={saveIntention} />
        </View>
      ) : null}

      {message ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{message}</Text> : null}

      <Modal visible={prayerModalVisible} transparent animationType="fade" onRequestClose={closePrayerModal} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, styles.intentionPrayerModal, isDark && styles.intentionPrayerModalDark]}>
            <IconButton icon="close-outline" accessibilityLabel="Cerrar oracion" variant="ghost" onPress={closePrayerModal} />
            <View style={styles.candleStage}>
              <Animated.View style={[styles.candleFlame, { opacity: flameOpacity, transform: [{ rotate: '45deg' }, { scale: flameScale }] }]} />
              <View style={styles.candleGlow} />
              <View style={styles.candleBody}>
                <View style={[styles.candleWax, { height: `${Math.round(waxProgress * 100)}%` }]} />
              </View>
              <View style={styles.candleBase} />
            </View>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{isPraying ? `Quedan ${remainingSeconds}s` : 'Oración finalizada'}</Text>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{isPraying ? 'Junto a vos rezamos todos' : 'Gracias por rezar'}</Text>
            {currentIntention ? (
              <>
                <Text style={[styles.intentionText, isDark && styles.textDarkBody]}>{currentIntention.body}</Text>
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Autor: {authorLabel}</Text>
              </>
            ) : null}
            {completedPrayer && !prayerAcknowledged ? (
              <AppButton label="Amen" icon="flame-outline" onPress={() => setPrayerAcknowledged(true)} />
            ) : null}
            {prayerAcknowledged ? (
              <>
                <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{prayerCount} personas oraron contigo</Text>
                <ButtonGroup>
                  <AppButton label="Crear Intencion" icon="create-outline" variant="secondary" onPress={() => { setPrayerModalVisible(false); setShowCreate(true); }} />
                  <AppButton label="Rezar otra" icon="flame-outline" onPress={() => startPrayer()} />
                </ButtonGroup>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
