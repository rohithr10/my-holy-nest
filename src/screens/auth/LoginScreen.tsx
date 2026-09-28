import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setCredentials } from '../../store/slices/auth.slice';
import type { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import { getApiErrorMessage } from '../../api/client';
import type { AuthStackParamList } from '../../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { setAppLanguage, type AppLanguage } from '../../i18n';

type Props = NativeStackScreenProps<AuthStackParamList, typeof Routes.Login>;

export default function LoginScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const church = route.params?.church;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const lang = (i18n.language as AppLanguage) ?? 'en';

  const validate = () => {
    const e: typeof errors = {};
    if (!phone || phone.length < 10) e.phone = 'Enter a valid 10-digit mobile number';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await authApi.login({ phone, password });
      const { user, token, refreshToken } = res.data.data;
      dispatch(setCredentials({ user, token, refreshToken }));
      // RootNavigator switches stacks automatically once authenticated.
    } catch (err) {
      // Registered but never confirmed the number: the API has just sent a
      // fresh code, so finish verification (which also signs the user in).
      if ((err as AxiosError<{ code?: string }>)?.response?.data?.code === 'ACCOUNT_UNVERIFIED') {
        navigation.navigate(Routes.OTPVerification, { phone, purpose: 'register' });
        return;
      }
      setErrors({ password: getApiErrorMessage(err, 'Invalid phone number or password') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navyDark} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Navy gradient hero. The gradient is an absolute-fill background:
              padding on LinearGradient itself renders incorrectly on iOS (Fabric). */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[Colors.primary.navyDark, Colors.primary.navy, Colors.primary.navyLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Decorative circles for depth */}
            <View style={[styles.heroCircle, styles.heroCircleLg]} />
            <View style={[styles.heroCircle, styles.heroCircleSm]} />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.neutral.white} />
            </TouchableOpacity>

            <View style={styles.heroIconRing}>
              <MaterialCommunityIcons name="church" size={34} color={Colors.accent.goldLight} />
            </View>
            <Text style={styles.greeting}>{t('auth.login_title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>

            {church && (
              <View style={styles.churchBadge}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.accent.goldLight} />
                <Text style={styles.churchBadgeText} numberOfLines={1} ellipsizeMode="tail">
                  {church.name}
                </Text>
              </View>
            )}
          </View>

          {/* Floating form card */}
          <View style={styles.card}>
            <Input
              label={t('auth.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('auth.phone_placeholder')}
              keyboardType="phone-pad"
              autoCapitalize="none"
              maxLength={10}
              error={errors.phone}
              leftIcon={
                <View style={styles.prefixRow}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.neutral.gray400} />
                  <Text style={styles.inputPrefix}>+91</Text>
                </View>
              }
            />

            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
              leftIcon={
                <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.neutral.gray400} />
              }
            />

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate(Routes.ForgotPassword)}
              hitSlop={8}>
              <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
            </TouchableOpacity>

            <Button
              title={t('auth.login')}
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />

          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.new_user')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(Routes.Register, { church })}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color={Colors.accent.goldDark} />
            <Text style={styles.registerLink}>{t('auth.create_account')}</Text>
          </TouchableOpacity>

          {/* Language Toggle */}
          <View style={styles.langRow}>
            {([
              { key: 'en', label: 'English' },
              { key: 'ta', label: 'தமிழ்' },
            ] as const).map(l => (
              <TouchableOpacity
                key={l.key}
                style={[styles.langPill, lang === l.key && styles.langPillActive]}
                onPress={() => setAppLanguage(l.key)}>
                <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  scroll: { paddingBottom: Spacing.xl },

  hero: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroCircleLg: { width: 220, height: 220, top: -80, right: -70 },
  heroCircleSm: { width: 140, height: 140, bottom: -50, left: -40 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  heroIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.neutral.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: Colors.sky.blueLight, textAlign: 'center' },
  churchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '88%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginTop: Spacing.md,
  },
  churchBadgeText: {
    flexShrink: 1,
    color: Colors.neutral.white,
    fontSize: 13,
    fontWeight: '600',
  },

  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.screen,
    marginTop: -28,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  prefixRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.gray600,
  },
  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.xs },
  forgotText: { color: Colors.sky.blue, fontSize: 13, fontWeight: '500' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.screen,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.neutral.gray200 },
  dividerText: { color: Colors.neutral.gray400, fontSize: 13 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.screen,
    height: 56,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent.gold,
    backgroundColor: Colors.accent.goldPale,
  },
  registerLink: { color: Colors.accent.goldDark, fontWeight: '700', fontSize: 17 },

  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  langPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    backgroundColor: Colors.neutral.white,
  },
  langPillActive: {
    backgroundColor: Colors.accent.goldPale,
    borderColor: Colors.accent.gold,
  },
  langText: { fontSize: 13, color: Colors.neutral.gray500, fontWeight: '500' },
  langTextActive: { color: Colors.accent.goldDark, fontWeight: '700' },
});
