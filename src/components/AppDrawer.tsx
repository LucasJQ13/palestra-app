import React from 'react';
import { Image, ImageSourcePropType, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';
import { themePresets } from '../theme/themes';
import { styles } from '../theme/appStyles';

export type AppDrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  meta?: string;
  action: () => void;
};

type AppDrawerProps = {
  drawerWidth: number;
  identityPrimaryColor: string;
  isDarkTheme: boolean;
  items: AppDrawerItem[];
  logo: ImageSourcePropType;
  onClose: () => void;
  roleLabel: string;
  visible: boolean;
};

export function AppDrawer({
  drawerWidth,
  identityPrimaryColor,
  isDarkTheme,
  items,
  logo,
  onClose,
  roleLabel,
  visible
}: AppDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} />
        <SafeAreaView edges={['top', 'bottom']} style={[styles.drawerPanel, isDarkTheme && styles.drawerPanelDark, { width: drawerWidth }]}>
          <View style={styles.drawerHeader}>
            <View style={[styles.drawerLogo, { backgroundColor: identityPrimaryColor }]}>
              <Image source={logo} style={styles.brandLogoImage} />
            </View>
            <View style={styles.drawerHeaderText}>
              <Text numberOfLines={1} style={[styles.drawerTitle, isDarkTheme && styles.drawerTitleDark]}>Palestra</Text>
              <Text numberOfLines={1} style={[styles.drawerSubtitle, isDarkTheme && styles.drawerSubtitleDark]}>{roleLabel}</Text>
            </View>
            <TouchableOpacity style={[styles.drawerCloseButton, isDarkTheme && styles.drawerCloseButtonDark]} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={22} color={isDarkTheme ? themePresets.dark.colors.text : palette.ink} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.drawerSectionLabel, isDarkTheme && styles.drawerItemMetaDark]}>Navegacion</Text>
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerScrollContent} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity key={item.key} style={[styles.drawerItem, isDarkTheme && styles.drawerItemDark, item.active && styles.drawerItemActive, item.active && isDarkTheme && styles.drawerItemActiveDark]} onPress={item.action} activeOpacity={0.84}>
                <View style={[styles.drawerIconFrame, isDarkTheme && styles.drawerIconFrameDark, item.active && styles.drawerIconFrameActive, item.active && { backgroundColor: identityPrimaryColor, borderColor: identityPrimaryColor }]}>
                  <Ionicons name={item.icon} size={20} color={item.active ? palette.white : identityPrimaryColor} />
                </View>
                <View style={styles.drawerItemTextBlock}>
                  <Text numberOfLines={1} style={[styles.drawerItemText, isDarkTheme && styles.drawerItemTextDark, item.active && styles.drawerItemTextActive]}>{item.label}</Text>
                  {item.meta ? <Text numberOfLines={1} style={[styles.drawerItemMeta, isDarkTheme && styles.drawerItemMetaDark]}>{item.meta}</Text> : null}
                </View>
                {item.active ? <View style={[styles.drawerActiveMark, { backgroundColor: identityPrimaryColor }]} /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
