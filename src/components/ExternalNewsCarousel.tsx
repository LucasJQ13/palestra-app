import React, { useRef, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';
import { ExternalCatholicNewsItem } from '../lib/externalNews';

type Props = {
  items: ExternalCatholicNewsItem[];
  loading: boolean;
  error: string | null;
  dark?: boolean;
};

export function ExternalNewsCarousel({ items, loading, error, dark = false }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const activeItem = items[index] ?? null;
  const { width } = useWindowDimensions();
  const slideWidth = Math.min(Math.max(width - 48, 280), 620);

  function goTo(nextIndex: number) {
    setIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * slideWidth, animated: true });
  }

  if (loading) {
    return (
      <View style={[styles.card, dark && styles.cardDark]}>
        <Text style={[styles.eyebrow, dark && styles.accentDark]}>Noticias de la Iglesia</Text>
        <Text style={[styles.title, dark && styles.textDark]}>Cargando noticias externas...</Text>
      </View>
    );
  }

  if (!activeItem) {
    return (
      <View style={[styles.card, dark && styles.cardDark]}>
        <Text style={[styles.eyebrow, dark && styles.accentDark]}>Noticias de la Iglesia</Text>
        <Text style={[styles.body, dark && styles.bodyDark]}>{error || 'No pudimos cargar noticias externas en este momento.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.shell, dark && styles.shellDark]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, dark && styles.accentDark]}>Noticias de la Iglesia</Text>
          <Text style={[styles.meta, dark && styles.bodyDark]}>Vatican News · Episcopado · ACI Prensa</Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={slideWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const width = event.nativeEvent.layoutMeasurement.width || 1;
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
      >
        {items.map((item) => (
          <View key={item.id} style={[styles.slide, { width: slideWidth }]}>
            <TouchableOpacity style={styles.heroCard} onPress={() => Linking.openURL(item.link)} activeOpacity={0.9}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.heroImage} /> : <View style={styles.heroImageFallback} />}
              <View style={styles.heroShade} />
              <View style={styles.heroContent}>
                <View style={styles.sourcePill}>
                  <Text style={styles.sourcePillText}>{item.source}</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={3}>{item.title}</Text>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMeta}>{formatExternalDate(item.publishedAt)}</Text>
                  <Ionicons name="open-outline" size={16} color={palette.white} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footerControls}>
        <View style={styles.dots}>
          {items.map((item, itemIndex) => (
            <TouchableOpacity
              key={item.id}
              accessibilityLabel={`Ver noticia externa ${itemIndex + 1}`}
              style={[styles.dot, itemIndex === index && styles.dotActive]}
              onPress={() => goTo(itemIndex)}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.navButton} onPress={() => goTo(index === 0 ? items.length - 1 : index - 1)}>
            <Ionicons name="chevron-back" size={18} color={palette.red} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => goTo(index === items.length - 1 ? 0 : index + 1)}>
            <Ionicons name="chevron-forward" size={18} color={palette.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function formatExternalDate(value?: string) {
  if (!value) {
    return 'Noticia reciente';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace(/\s+\d{2}:\d{2}:\d{2}.*$/, '').trim();
  }
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

const styles = StyleSheet.create({
  shell: {
    gap: 12
  },
  shellDark: {},
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    backgroundColor: palette.white,
    padding: 16,
    gap: 11,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3
  },
  cardDark: {
    backgroundColor: '#273136',
    borderColor: 'rgba(125, 185, 226, 0.18)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  eyebrow: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  accentDark: {
    color: '#86D3F5'
  },
  title: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23
  },
  textDark: {
    color: '#F4FBFD'
  },
  body: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700'
  },
  bodyDark: {
    color: '#D9E8EE'
  },
  meta: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800'
  },
  dots: {
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(45, 141, 200, 0.24)'
  },
  dotActive: {
    width: 20,
    backgroundColor: palette.red
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.whiteSoft
  },
  heroImageFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.blueDeep
  },
  heroCard: {
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: palette.blueDeep,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 22, 34, 0.45)'
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 18,
    gap: 10
  },
  heroTitle: {
    color: palette.white,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900'
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '800'
  },
  sourcePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  sourcePillText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '900'
  },
  slide: {
    paddingRight: 0
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteSoft
  },
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  linkButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: palette.white
  },
  linkText: {
    color: palette.red,
    fontWeight: '900'
  }
});
