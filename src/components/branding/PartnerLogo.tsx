import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { normalizeOptionalExternalUrl } from '../../lib/urls';

type PartnerLogoVariant = 'loading' | 'footer' | 'preview';

export function PartnerLogo({
  logoUrl,
  linkUrl,
  visible = false,
  accessibilityLabel,
  variant = 'footer',
  isDark = false
}: {
  logoUrl?: string | null;
  linkUrl?: string | null;
  visible?: boolean;
  accessibilityLabel?: string | null;
  variant?: PartnerLogoVariant;
  isDark?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeLogoUrl = useMemo(() => normalizeOptionalExternalUrl(logoUrl), [logoUrl]);
  const safeLinkUrl = useMemo(() => normalizeOptionalExternalUrl(linkUrl), [linkUrl]);
  const label = accessibilityLabel?.trim() || 'Logo del partner de la aplicación';

  useEffect(() => {
    setImageFailed(false);
  }, [safeLogoUrl]);

  if (!visible || !safeLogoUrl || imageFailed) {
    return null;
  }

  async function openPartnerLink() {
    if (!safeLinkUrl) {
      return;
    }
    const supported = await Linking.canOpenURL(safeLinkUrl).catch(() => false);
    if (supported) {
      await Linking.openURL(safeLinkUrl).catch(() => undefined);
    }
  }

  const containerStyle = [
    styles.container,
    styles[variant],
    isDark && styles.containerDark
  ];
  const image = (
    <Image
      source={{ uri: safeLogoUrl }}
      style={[styles.image, variant === 'preview' && styles.imagePreview]}
      resizeMode="contain"
      accessible={false}
      onError={() => setImageFailed(true)}
    />
  );

  if (safeLinkUrl) {
    return (
      <TouchableOpacity
        style={containerStyle}
        accessibilityRole="link"
        accessibilityLabel={label}
        activeOpacity={0.7}
        onPress={openPartnerLink}
      >
        {image}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} accessible accessibilityRole="image" accessibilityLabel={label}>
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    opacity: 0.8,
    paddingHorizontal: 5,
    paddingVertical: 3
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    opacity: 0.92
  },
  loading: {
    position: 'absolute',
    bottom: 22
  },
  footer: {
    marginTop: 10,
    marginBottom: 4
  },
  preview: {
    marginVertical: 4
  },
  image: {
    width: 112,
    height: 22
  },
  imagePreview: {
    width: 132,
    height: 28
  }
});
