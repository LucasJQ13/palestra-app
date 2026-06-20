import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';
import { IconButton } from '../ui';

export type FullScreenEditorProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerAction?: ReactNode;
  onClose: () => void;
  onShow?: () => void;
  closeAccessibilityLabel?: string;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function FullScreenEditor({
  visible,
  title,
  subtitle,
  children,
  footer,
  headerAction,
  onClose,
  onShow,
  closeAccessibilityLabel = 'Volver',
  keyboardVerticalOffset = 0,
  contentContainerStyle,
  footerStyle,
  testID
}: FullScreenEditorProps) {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      navigationBarTranslucent={false}
      onRequestClose={onClose}
      onShow={onShow}
      testID={testID}
    >
      <SafeAreaView edges={['top', 'bottom']} style={[layoutStyles.screen, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={layoutStyles.keyboardAvoider}
        >
          <View style={[layoutStyles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <IconButton
              icon="arrow-back-outline"
              accessibilityLabel={closeAccessibilityLabel}
              variant="ghost"
              onPress={onClose}
            />
            <View style={layoutStyles.headerText}>
              <Text numberOfLines={1} style={[layoutStyles.title, { color: theme.colors.text }]}>{title}</Text>
              {subtitle ? <Text numberOfLines={1} style={[layoutStyles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text> : null}
            </View>
            {headerAction}
          </View>

          <ScrollView
            style={layoutStyles.scroll}
            contentContainerStyle={[layoutStyles.content, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator
          >
            {children}
          </ScrollView>

          {footer ? (
            <View style={[layoutStyles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }, footerStyle]}>
              {footer}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1
  },
  keyboardAvoider: {
    flex: 1
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  headerText: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: 20,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700'
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1
  }
});
