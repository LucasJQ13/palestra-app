import React, { useState } from 'react';
import { Image, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { movementHistory } from '../data/content';
import { AppContentBlock } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { AppAdminConfig } from '../lib/appConfig';
import { inputPlaceholderColor, palestraLogo, provinceDisplayNames, provinceLogos } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { APP_MESSAGES } from '../lib/appMessages';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

type TabKey = string;

export function HistoryScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  const isDark = useIsDarkTheme();
  const shouldShowFallback = !content && !editor?.contentLoaded;
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {shouldShowFallback ? (
        <View style={[styles.contentIntro, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Nuestra Historia</Text>
          {movementHistory.map((paragraph, index) => <Text key={`${paragraph.slice(0, 12)}-${index}`} style={[styles.cardText, isDark && styles.textDarkBody]}>{paragraph}</Text>)}
        </View>
      ) : null}
      {!content && editor?.contentLoaded ? <EmptyRemoteContent title="Historia pendiente" /> : null}
    </View>
  );
}

export function ContactScreen({ title, content, editor, adminConfig }: { title: string; content?: AppContentBlock; editor?: PageEditorProps; adminConfig: AppAdminConfig }) {
  const isDark = useIsDarkTheme();
  const shouldShowFallback = !content && !editor?.contentLoaded;
  const contactBlocks = adminConfig.contact.blocks ?? [];
  const provinceInstagram = adminConfig.contact.provinceInstagram ?? {};
  const hasProvinceInstagram = Object.entries(provinceInstagram).some(([, value]) => value.trim());
  const hasContactPanel = shouldShowFallback || contactBlocks.length > 0 || hasProvinceInstagram || Boolean(adminConfig.contact.email || adminConfig.contact.phone || adminConfig.contact.instagram || adminConfig.contact.helpText || adminConfig.contact.donationText);
  const openContactValue = (value: string) => {
    if (!value.trim()) {
      return;
    }
    const url = value.startsWith('http') ? value : `https://www.instagram.com/${value.replace('@', '')}`;
    Linking.openURL(url);
  };
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {hasContactPanel ? (
        <View style={[styles.contentIntro, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Encontrar una comunidad</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{adminConfig.contact.helpText}</Text>
          {adminConfig.contact.email ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Mail: {adminConfig.contact.email}</Text> : null}
          {adminConfig.contact.phone ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Celular: {adminConfig.contact.phone}</Text> : null}
          {adminConfig.contact.instagram ? (
            <TouchableOpacity style={styles.instagramButton} onPress={() => openContactValue(adminConfig.contact.instagram)}>
              <Ionicons name="logo-instagram" size={20} color={palette.white} />
              <Text style={styles.instagramButtonTitle}>Instagram nacional</Text>
            </TouchableOpacity>
          ) : null}
          {hasProvinceInstagram ? (
            <View style={[styles.provinceInstagramPanel, isDark && styles.surfacePanelDark]}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Instagram por provincia</Text>
              {Object.entries(provinceInstagram).filter(([, value]) => value.trim()).map(([province, value]) => (
                <TouchableOpacity key={province} style={[styles.provinceInstagramButton, isDark && styles.surfaceRowDark]} onPress={() => openContactValue(value)} activeOpacity={0.86}>
                  <View style={styles.provinceInstagramLogo}>
                    {provinceLogos[province] ? <Image source={provinceLogos[province]} style={styles.provinceInstagramLogoImage} /> : <Text style={styles.provinceLogoMiniText}>{provinceDisplayNames[province]?.slice(0, 2).toUpperCase() ?? province.slice(0, 2).toUpperCase()}</Text>}
                  </View>
                  <View style={styles.adminUserHeaderText}>
                    <Text style={[styles.provinceInstagramName, isDark && styles.textDarkStrong]}>{provinceDisplayNames[province] ?? province}</Text>
                    <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Instagram oficial</Text>
                  </View>
                  <Ionicons name="logo-instagram" size={20} color={palette.red} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {contactBlocks.map((block) => (
            <View key={block.id} style={[styles.innerNewsCard, isDark && styles.surfaceRowDark]}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{block.type}</Text>
              {block.label ? <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{block.label}</Text> : null}
              {block.type === 'imagen' && block.value ? <Image source={{ uri: block.value }} style={styles.cardImage} /> : <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{block.value}</Text>}
              {['enlace', 'boton', 'red_social'].includes(block.type) && block.value ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(block.value.startsWith('http') ? block.value : `https://${block.value}`)}>
                  <Text style={styles.secondaryButtonText}>Abrir enlace</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{adminConfig.contact.donationText}</Text>
        </View>
      ) : null}
      {!content && editor?.contentLoaded ? <EmptyRemoteContent title="Contacto pendiente" /> : null}
    </View>
  );
}

export function MaintenanceScreen({ adminConfig, onNavigate }: { adminConfig: AppAdminConfig; onNavigate: (tab: TabKey) => void }) {
  const message = adminConfig.settings.globalMessage.trim() || 'Estamos realizando tareas de mantenimiento. La aplicación volverá a estar disponible próximamente.';
  return (
    <View style={styles.stack}>
      <View style={styles.maintenancePanel}>
        <View style={styles.brandLogo}>
          <Image source={palestraLogo} style={styles.brandLogoImage} />
        </View>
        <Text style={styles.maintenanceTitle}>{adminConfig.identity.appName || 'Palestra'}</Text>
        <Text style={styles.maintenanceText}>{message}</Text>
        <Text style={styles.cardText}>Estamos ajustando herramientas internas para que la experiencia sea mas estable.</Text>
        <View style={styles.inlineActions}>
          {adminConfig.settings.futureForumEnabled ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate('foro')}>
              <Ionicons name="chatbubbles-outline" size={17} color={palette.white} />
              <Text style={styles.primaryButtonText}>Ir al Foro</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate('perfil')}>
            <Text style={styles.secondaryButtonText}>Mi Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function EmptyRemoteContent({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>No hay contenido publicado en Supabase para esta sección todavía.</Text>
    </View>
  );
}

export function GenericPageScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {!content ? (
        <View style={styles.card}>
          <Text style={styles.cardText}>Esta página todavía no tiene contenido cargado.</Text>
        </View>
      ) : null}
    </View>
  );
}

export function DynamicContactForm({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const destination = content?.blocks?.find((block) => block.type === 'campo' && block.value.startsWith('destino='))?.value.replace('destino=', '').trim() ?? '';

  async function submit() {
    if (!name.trim() || !contact.trim() || !message.trim()) {
      setStatus('Completa nombre, contacto y mensaje.');
      return;
    }
    setStatus('Enviando...');
    const { error } = await supabase.from('community_contact_messages').insert({
      sender_name: name.trim(),
      sender_contact: contact.trim(),
      message: `${destination ? `[${destination}] ` : ''}${message.trim()}`,
      status: 'nuevo'
    });
    setStatus(error ? error.message : APP_MESSAGES.messageSent);
    if (!error) {
      setName('');
      setContact('');
      setMessage('');
    }
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={styles.input} placeholder="Contacto" value={contact} onChangeText={setContact} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje" value={message} onChangeText={setMessage} multiline placeholderTextColor={inputPlaceholderColor} />
        <TouchableOpacity style={styles.primaryButton} onPress={submit}>
          <Text style={styles.primaryButtonText}>Enviar</Text>
        </TouchableOpacity>
        {status ? <Text style={styles.cardText}>{status}</Text> : null}
      </View>
    </View>
  );
}
