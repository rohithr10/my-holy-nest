import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Routes } from '../../constants/routes';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectIsAuthenticated } from '../../store/slices/auth.slice';

type Props = NativeStackScreenProps<AuthStackParamList, typeof Routes.Splash>;

export default function SplashScreen({ navigation }: Props) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  // Kept in refs so a re-render doesn't restart the animation from scratch.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace(isAuthenticated ? (Routes.Onboarding as any) : Routes.Onboarding);
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation, isAuthenticated]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Cross / Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>
        <Text style={styles.appName}>My Holy Nest</Text>
        <Text style={styles.tagline}>Your Parish. Your Family. Your Faith.</Text>
        <Text style={styles.taglineTA}>உங்கள் பங்கு. உங்கள் குடும்பம். உங்கள் நம்பிக்கை.</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.navyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  logoContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  crossVertical: {
    position: 'absolute',
    width: 12,
    height: 80,
    backgroundColor: Colors.accent.gold,
    borderRadius: 6,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 60,
    height: 12,
    backgroundColor: Colors.accent.gold,
    borderRadius: 6,
    top: 18,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.neutral.white,
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.sky.blueLight,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  taglineTA: {
    fontSize: 13,
    color: Colors.neutral.white,
    opacity: 0.55,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  loadingDots: { flexDirection: 'row', marginBottom: 12 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.white,
    opacity: 0.3,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: Colors.accent.gold,
    opacity: 1,
    width: 18,
    borderRadius: 3,
  },
  version: { color: Colors.neutral.white, opacity: 0.3, fontSize: 11 },
});
