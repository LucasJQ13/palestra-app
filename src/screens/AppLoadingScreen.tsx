import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { palestraLogo } from '../lib/constants';
import { styles } from '../theme/appStyles';

export function AppLoadingScreen() {
  const flash = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const barTravel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(flash, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(flash, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true
        })
      ])
    ]).start();

    const loop = Animated.loop(
      Animated.timing(barTravel, {
        toValue: 1,
        duration: 980,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      })
    );
    loop.start();

    return () => loop.stop();
  }, [barTravel, flash, logoScale]);

  const translateX = barTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [-92, 230]
  });

  return (
    <View style={styles.loadingOverlay} pointerEvents="auto">
      <Animated.View style={[styles.loadingFlash, { opacity: flash }]} />
      <Animated.View style={[styles.loadingLogoFrame, { transform: [{ scale: logoScale }] }]}>
        <Image source={palestraLogo} style={styles.loadingLogo} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Palestra</Text>
      <Text style={styles.loadingSubtitle}>Movimiento Catolico</Text>
      <View style={styles.loadingBarTrack}>
        <Animated.View style={[styles.loadingBarPulse, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}
