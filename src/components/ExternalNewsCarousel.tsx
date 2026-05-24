import React, { useRef, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const slideWidth = 294;

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
    <View style={[styles.card, dark && styles.cardDark]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, dark && styles.accentDark]}>Noticias de la Iglesia</Text>
          <Text style={[styles.meta, dark && styles.bodyDark]}>Fuentes externas verificadas</Text>
        </View>
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
          <View key={item.id} style={styles.slide}>
            <Text style={[styles.meta, dark && styles.bodyDark]}>{item.source}</Text>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : null}
            <Text style={[styles.title, dark && styles.textDark]} numberOfLines={3}>{item.title}</Text>
            {item.publishedAt ? <Text style={[styles.meta, dark && styles.bodyDark]}>{item.publishedAt}</Text> : null}
            <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(item.link)} activeOpacity={0.85}>
              <Ionicons name="open-outline" size={17} color={palette.red} />
              <Text style={styles.linkText}>Leer en la fuente</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.navButton} onPress={() => goTo(index === 0 ? items.length - 1 : index - 1)}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
        </TouchableOpacity>
        <Text style={[styles.meta, dark && styles.bodyDark]}>{activeItem.source}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => goTo(index === items.length - 1 ? 0 : index + 1)}>
          <Ionicons name="chevron-forward" size={18} color={palette.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  image: {
    width: '100%',
    height: 132,
    borderRadius: 16,
    backgroundColor: palette.whiteSoft
  },
  slide: {
    width: 294,
    gap: 10,
    paddingRight: 12
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
