import React from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock } from '../lib/profiles';
import { AppTabDisplay, PageEditorProps, defaultTabByKey } from '../lib/navigationConstants';
import { splitConfigValue, tabLabelFromKey } from '../lib/contentBlocks';
import { normalizeExternalUrl } from '../lib/urls';
import { Session } from '../types/auth';
import { TabKey } from '../types/appUi';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { MaterialsScreen } from './MaterialsScreen';
import { DynamicContactForm, GenericPageScreen } from './StaticScreens';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

export function DynamicNavigationSectionScreen({ session, tab, title, content, editor, refreshKey, onNavigate }: { session: Session | null; tab?: AppTabDisplay; title: string; content?: AppContentBlock; editor?: PageEditorProps; refreshKey: number; onNavigate: (tab: TabKey) => void }) {
  const type = tab?.sectionType ?? 'simple';
  const blocks = content?.blocks ?? [];

  if (type === 'library') {
    return <MaterialsScreen session={session} title={title} content={content} refreshKey={refreshKey} editor={editor} />;
  }

  if (type === 'internal') {
    const target = blocks.find((block) => block.type === 'modulo')?.value?.trim();
    const targetTab = target && defaultTabByKey.has(target) ? target : 'inicio';
    return (
      <View style={styles.stack}>
        <SectionTitle title={title} />
        <EditableIntro content={content} editor={editor} />
        <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate(targetTab)}>
          <Ionicons name="open-outline" size={18} color={palette.white} />
          <Text style={styles.primaryButtonText}>Abrir {tabLabelFromKey(targetTab)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (type === 'links') {
    const links = blocks.filter((block) => block.type === 'enlace');
    return (
      <View style={styles.stack}>
        <SectionTitle title={title} />
        <EditableIntro content={content} editor={editor} />
        {links.map((link) => {
          const [label, url] = splitConfigValue(link.value);
          const target = normalizeExternalUrl(url || label);
          return (
            <TouchableOpacity key={link.id} style={styles.secondaryButton} onPress={() => Linking.openURL(target)}>
              <Ionicons name="link-outline" size={18} color={palette.red} />
              <Text style={styles.secondaryButtonText}>{label || target}</Text>
            </TouchableOpacity>
          );
        })}
        {links.length === 0 ? <Text style={styles.cardText}>No hay enlaces cargados.</Text> : null}
      </View>
    );
  }

  if (type === 'form') {
    return <DynamicContactForm title={title} content={content} editor={editor} />;
  }

  if (type === 'image_text') {
    const image = blocks.find((block) => block.type === 'imagen')?.value;
    const textBlocks = blocks.filter((block) => block.type !== 'imagen');
    return (
      <View style={styles.stack}>
        <SectionTitle title={title} />
        <EditableIntro content={content} editor={editor} />
        <View style={styles.card}>
          {image ? <Image source={{ uri: image }} style={styles.cardImage} /> : null}
          {textBlocks.map((block) => <Text key={block.id} style={block.type === 'titulo' ? styles.cardTitle : styles.cardText}>{block.value}</Text>)}
        </View>
      </View>
    );
  }

  return <GenericPageScreen title={title} content={content} editor={editor} />;
}
