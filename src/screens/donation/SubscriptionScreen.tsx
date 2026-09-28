import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import Button from '../../components/common/Button/Button';
import LanguageToggle from '../../components/common/LanguageToggle/LanguageToggle';
import { Config } from '../../constants/config';
import type { AppLanguage } from '../../i18n';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

const MIN_AMOUNT = 10;

/** First day of next month — when the first debit lands. */
function firstDebitDate(from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}

function formatDate(date: Date, lang: AppLanguage): string {
  return date.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as AppLanguage) ?? 'en';

  const [amount, setAmount] = useState('');

  const parsedAmount = parseInt(amount || '0', 10);
  const isValid = parsedAmount >= MIN_AMOUNT;
  const nextDebit = useMemo(() => firstDebitDate(), []);

  // Recurring giving needs Razorpay subscriptions (and a backend to track
  // them), neither of which exists yet — so nothing is set up or charged here.
  const handleSubscribe = () => {
    if (!isValid) {
      Alert.alert(t('donation.invalid_amount_title'), t('donation.invalid_amount'));
      return;
    }
    Alert.alert(
      'Monthly giving is not available yet',
      'Please arrange a monthly offering with the parish office for now. Offerings recorded there appear in your giving history.',
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('donation.subscription_title')}</Text>
        <LanguageToggle />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.heroBanner}>
            <MaterialCommunityIcons name="calendar-sync-outline" style={styles.heroIcon} />
            <Text style={styles.heroTitle}>{t('donation.subscription_heading')}</Text>
            <Text style={styles.heroSubtitle}>
              {t('donation.subscription_subtitle')}
            </Text>
          </View>

          {/* Manual amount entry — no fixed plans */}
          <Text style={styles.label}>{t('donation.monthly_amount')}</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors.neutral.gray300}
              maxLength={7}
            />
            <Text style={styles.perMonth}>/ month</Text>
          </View>
          <Text style={styles.hint}>{t('donation.amount_hint')}</Text>

          <View style={styles.debitCard}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color={Colors.accent.goldDark}
            />
            <Text style={styles.debitText}>
              First debit on {formatDate(nextDebit, lang)}, then the 1st of every month.
            </Text>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>{t('donation.benefits_title')}</Text>
            {[
              t('donation.benefit_never_miss'),
              t('donation.benefit_tax'),
              t('donation.benefit_cancel'),
              t('donation.benefit_secure'),
            ].map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.semantic.success} />
                <Text style={styles.benefitItem}>{b}</Text>
              </View>
            ))}
          </View>

          <Button
            title={
              !Config.ONLINE_GIVING_ENABLED
                ? 'Monthly giving coming soon'
                : isValid
                  ? `${t('donation.start_subscription')} — ₹${parsedAmount.toLocaleString('en-IN')}`
                  : t('donation.start_subscription')
            }
            onPress={handleSubscribe}
            disabled={!Config.ONLINE_GIVING_ENABLED || !isValid}
            fullWidth
            size="lg"
            style={styles.cta}
          />
          <Text style={styles.note}>{t('donation.cancel_note')}</Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    gap: Spacing.sm,
  },
  backIcon: { color: Colors.primary.navy, fontSize: 22 },
  headerTitle: { flex: 1, color: Colors.primary.navy, fontSize: 18, fontWeight: '700' },
  scroll: { padding: Spacing.screen },
  heroBanner: { alignItems: 'center', marginBottom: Spacing.xl },
  heroIcon: { fontSize: 64, marginBottom: Spacing.md, color: Colors.accent.gold },
  heroTitle: { fontSize: 22, fontWeight: '700', color: Colors.primary.navy, textAlign: 'center', marginBottom: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: Colors.neutral.gray500, textAlign: 'center', lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.sm },

  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.accent.gold,
    paddingHorizontal: Spacing.md,
    ...Shadow.gold,
  },
  rupee: { fontSize: 28, color: Colors.neutral.gray400, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary.navy,
    paddingVertical: 10,
  },
  perMonth: { fontSize: 14, color: Colors.neutral.gray400, fontWeight: '600' },
  hint: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 6, marginBottom: Spacing.md },

  debitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.gold,
  },
  debitText: { flex: 1, fontSize: 13, color: Colors.neutral.gray600, lineHeight: 19 },

  benefitsCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  benefitsTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  benefitItem: { fontSize: 14, color: Colors.neutral.gray600, lineHeight: 22, flex: 1 },
  cta: { marginBottom: Spacing.sm },
  note: { textAlign: 'center', fontSize: 12, color: Colors.neutral.gray400 },
});
