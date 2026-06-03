import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themePreferenceKey } from '../lib/constants';
import { ThemeName, themePresets } from '../theme/themes';

type UseAppThemePreferenceOptions = {
  onError?: (message: string) => void;
};

export function useAppThemePreference(options: UseAppThemePreferenceOptions = {}) {
  const { onError } = options;
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [themeTransitionVisible, setThemeTransitionVisible] = useState(false);
  const [themeTransitionColor, setThemeTransitionColor] = useState('#2B2B2B');
  const themeTransitionProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(themePreferenceKey)
      .then((value) => {
        if (value && value in themePresets) {
          setThemeName(value as ThemeName);
        }
      })
      .catch((error) => console.error('theme preference', error));
  }, []);

  async function updateThemePreference(nextTheme: ThemeName) {
    setThemeTransitionColor(nextTheme === 'dark' ? themePresets.dark.colors.background : '#E6F3F5');
    setThemeTransitionVisible(true);
    themeTransitionProgress.setValue(0);
    Animated.timing(themeTransitionProgress, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setThemeName(nextTheme);
      Animated.timing(themeTransitionProgress, {
        toValue: 0,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(() => setThemeTransitionVisible(false));
    });

    try {
      await AsyncStorage.setItem(themePreferenceKey, nextTheme);
    } catch (error) {
      console.error('save theme preference', error);
      onError?.('No pude guardar el tema visual.');
    }
  }

  return {
    themeName,
    themeTransitionColor,
    themeTransitionProgress,
    themeTransitionVisible,
    updateThemePreference
  };
}
