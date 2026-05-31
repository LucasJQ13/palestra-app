import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock, PrayerIntentionRecord, createPrayerIntention, deliverNotificationIntent, fetchRandomPrayerIntention, recordPrayerForIntention } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { inputPlaceholderColor } from '../lib/constants';
import { changeDone } from '../lib/appMessages';
import { Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

const PRAYER_SECONDS = 60;

export function IntentionsScreen({ session, title, content, editor }: { session: Session | null; title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  const isDark = useIsDarkTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [intentionText, setIntentionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [currentIntention, setCurrentIntention] = useState<PrayerIntentionRecord | null>(null);
  const [prayedIds, setPrayedIds] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(PRAYER_SECONDS);
  const [isPraying, setIsPraying] = useState(false);
  const [completedPrayer, setCompletedPrayer] = useState(false);
  const flamePulse = useRef(new Animated.Value(0)).current;

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

  const waxProgress = Math.max(0.18, remainingSeconds / PRAYER_SECONDS);
  const flameScale = flamePulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  const flameOpacity = flamePulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });

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

  async function startPrayer(resetSeen = false) {
    if (!session?.id || session.status !== 'aprobado') {
      setMessage('Necesitas iniciar sesion con un usuario aprobado para rezar por intenciones.');
      return;
    }
    const excludeIds = resetSeen ? [] : prayedIds;
    setMessage('Buscando una intencion para rezar...');
    setCompletedPrayer(false);
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
    setRemainingSeconds(PRAYER_SECONDS);
    setIsPraying(true);
    setMessage('Tienes 1 minuto para rezar por esta intencion.');
  }

  async function finishPrayer(intentionId: string) {
    setIsPraying(false);
    const { data, error } = await recordPrayerForIntention(intentionId);
    if (error) {
      setMessage(error.message);
      setCompletedPrayer(true);
      return;
    }
    if (data?.notification_intent_id) {
      await deliverNotificationIntent(data.notification_intent_id).catch(() => undefined);
    }
    setCompletedPrayer(true);
    setMessage(changeDone('Gracias. Ya avisamos al autor que rezaron por su intencion.'));
  }

  return (
    <ScrollView style={isDark ? styles.contentDark : undefined} contentContainerStyle={styles.content}>
      <SectionTitle title={title} />
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Un espacio simple para pedir oracion y acompanar intenciones de otros palestristas.</Text>
      <EditableIntro content={content} editor={editor} />

      {!session?.id ? (
        <View style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Inicia sesion</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Necesitas estar registrado para crear o rezar por una intencion.</Text>
        </View>
      ) : null}

      <View style={styles.compactToolRow}>
        <TouchableOpacity style={[styles.compactSquareButton, showCreate && styles.compactSquareButtonActive]} onPress={() => setShowCreate((current) => !current)}>
          <Ionicons name={showCreate ? 'chevron-up-outline' : 'add-circle-outline'} size={17} color={showCreate ? palette.white : palette.red} />
          <Text style={[styles.compactSquareButtonText, showCreate && styles.compactSquareButtonTextActive]}>Crear Intencion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.compactSquareButton} onPress={() => startPrayer()} disabled={isPraying}>
          <Ionicons name="flame-outline" size={17} color={palette.red} />
          <Text style={styles.compactSquareButtonText}>Rezar por una Intencion</Text>
        </TouchableOpacity>
      </View>

      {showCreate ? (
        <View style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Nueva intencion</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
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
            <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={saveIntention}>
            <Text style={styles.primaryButtonText}>Guardar intencion</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {currentIntention ? (
        <View style={[styles.intentionPrayerCard, isDark && styles.surfaceCardDark]}>
          <View style={styles.candleStage}>
            <Animated.View style={[styles.candleFlame, { opacity: flameOpacity, transform: [{ rotate: '45deg' }, { scale: flameScale }] }]} />
            <View style={styles.candleGlow} />
            <View style={styles.candleBody}>
              <View style={[styles.candleWax, { height: `${Math.round(waxProgress * 100)}%` }]} />
            </View>
            <View style={styles.candleBase} />
          </View>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{isPraying ? `Quedan ${remainingSeconds}s` : 'Oracion finalizada'}</Text>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Tienes 1 minuto para rezar por esta intencion</Text>
          <Text style={[styles.intentionText, isDark && styles.textDarkBody]}>{currentIntention.body}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>
            {currentIntention.is_anonymous ? 'Autor: Anonimo' : `Autor: ${currentIntention.author_name || 'Palestrista'}`}
          </Text>
        </View>
      ) : null}

      {message ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{message}</Text> : null}

      {completedPrayer ? (
        <View style={styles.compactToolRow}>
          <TouchableOpacity style={styles.compactSquareButton} onPress={() => setShowCreate(true)}>
            <Ionicons name="add-circle-outline" size={17} color={palette.red} />
            <Text style={styles.compactSquareButtonText}>Crear Intencion</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.compactSquareButton} onPress={() => startPrayer()}>
            <Ionicons name="flame-outline" size={17} color={palette.red} />
            <Text style={styles.compactSquareButtonText}>Rezar por otra intencion</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
