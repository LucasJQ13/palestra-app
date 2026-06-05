import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { touchPointerPreferenceKey } from '../lib/constants';

type TouchPointerPosition = {
  x: number;
  y: number;
};

type UseTouchPointerOptions = {
  onError?: (message: string) => void;
};

export function useTouchPointer(options: UseTouchPointerOptions = {}) {
  const { onError } = options;
  const [touchPointer, setTouchPointer] = useState<TouchPointerPosition | null>(null);
  const [touchPointerEnabled, setTouchPointerEnabled] = useState(false);
  const touchPointerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(touchPointerPreferenceKey)
      .then((value) => setTouchPointerEnabled(value === 'true'))
      .catch((error) => console.error('touch pointer preference', error));
  }, []);

  async function updateTouchPointerPreference(value: boolean) {
    setTouchPointerEnabled(value);
    try {
      await AsyncStorage.setItem(touchPointerPreferenceKey, value ? 'true' : 'false');
    } catch (error) {
      console.error('save touch pointer preference', error);
      onError?.('No pude guardar la preferencia del puntero.');
    }
  }

  function showTouchPointer(x: number, y: number) {
    if (!touchPointerEnabled) {
      return;
    }

    setTouchPointer({ x, y });
    Animated.timing(touchPointerOpacity, {
      toValue: 1,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }

  function moveTouchPointer(x: number, y: number) {
    if (!touchPointerEnabled) {
      return;
    }

    setTouchPointer({ x, y });
  }

  function hideTouchPointer() {
    if (!touchPointerEnabled) {
      return;
    }

    Animated.timing(touchPointerOpacity, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setTouchPointer(null);
      }
    });
  }

  return {
    hideTouchPointer,
    moveTouchPointer,
    showTouchPointer,
    touchPointer,
    touchPointerEnabled,
    touchPointerOpacity,
    updateTouchPointerPreference
  };
}
