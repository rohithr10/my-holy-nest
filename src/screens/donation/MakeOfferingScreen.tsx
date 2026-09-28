import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import Button from '../../components/common/Button/Button';
import type { DonationStackParamList } from '../../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { Config } from '../../constants/config';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';

type Props = NativeStackScreenProps<DonationStackParamList, typeof Routes.MakeOffering>;

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / GPay / PhonePe', icon: 'cellphone' },
  { id: 'card', label: 'Credit / Debit Card', icon: 'credit-card-outline' },
  { id: 'netbanking', label: 'Net Banking', icon: 'bank-outline' },
];

export default function MakeOfferingScreen({ navigation, route }: Props) {
  const offeringType = route.params?.offeringType ?? 'Mass Offering';
  // A general donation is given towards a cause the giver names themselves.
  const isDonation = offeringType === 'Donation';

  const [amount, setAmount] = useState('');
  const [cause, setCause] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [intention, setIntention] = useState('');
  const church = useAppSelector(selectChurch);

  const amountValid = !!amount && parseInt(amount, 10) >= 10;
  const canPay = Config.ONLINE_GIVING_ENABLED && amountValid && (!isDonation || !!cause.trim());

  // Payment runs through Razorpay checkout once it is set up (see
  // Config.ONLINE_GIVING_ENABLED). Until then nothing is charged and no
  // receipt is shown — only the parish office can record an offering.
  const handlePay = () => {
    Alert.alert(
      'Online giving is not available yet',
      `Please give at the ${church?.name ?? 'parish'} office. Your offering will appear in your giving history once it is recorded.`,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isDonation ? 'Donation' : 'Make Offering'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Offering Type */}
          <View style={styles.offeringBadge}>
            <MaterialCommunityIcons name="hand-heart-outline" style={styles.offeringIcon} />
            <Text style={styles.offeringType}>{offeringType}</Text>
          </View>

          {/* Cause — donations only */}
          {isDonation && (
            <>
              <Text style={styles.label}>Cause</Text>
              <TextInput
                style={styles.causeInput}
                value={cause}
                onChangeText={setCause}
                placeholder="e.g. Flood relief, Poor fund, Church roof repair"
                placeholderTextColor={Colors.neutral.gray400}
                maxLength={80}
              />
            </>
          )}

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={t => setAmount(t.replace(/[^0-9]/g, ''))}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors.neutral.gray300}
            />
          </View>
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map(qa => (
              <TouchableOpacity
                key={qa}
                style={[styles.quickBtn, amount === String(qa) && styles.quickBtnActive]}
                onPress={() => setAmount(String(qa))}>
                <Text style={[styles.quickText, amount === String(qa) && styles.quickTextActive]}>
                  ₹{qa}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Intention */}
          <Text style={styles.label}>Intention (Optional)</Text>
          <TextInput
            style={styles.intentionInput}
            value={intention}
            onChangeText={setIntention}
            placeholder="e.g. For the healing of my mother..."
            placeholderTextColor={Colors.neutral.gray400}
            multiline
            numberOfLines={3}
          />

          {/* Payment Method */}
          <Text style={styles.label}>Payment Method</Text>
          {PAYMENT_METHODS.map(pm => (
            <TouchableOpacity
              key={pm.id}
              style={[styles.paymentRow, paymentMethod === pm.id && styles.paymentRowActive]}
              onPress={() => setPaymentMethod(pm.id)}>
              <MaterialCommunityIcons name={pm.icon} style={styles.paymentIcon} />
              <Text style={[styles.paymentLabel, paymentMethod === pm.id && styles.paymentLabelActive]}>
                {pm.label}
              </Text>
              <View style={[styles.radio, paymentMethod === pm.id && styles.radioActive]}>
                {paymentMethod === pm.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* CTA */}
          <Button
            title={
              !Config.ONLINE_GIVING_ENABLED
                ? 'Online giving coming soon'
                : amount
                  ? `Pay ₹${parseInt(amount || '0', 10).toLocaleString('en-IN')}`
                  : 'Enter Amount'
            }
            onPress={handlePay}
            fullWidth
            size="lg"
            style={styles.payBtn}
            disabled={!canPay}
          />

          {Config.ONLINE_GIVING_ENABLED ? (
            <Text style={styles.secure}><MaterialCommunityIcons name="lock-outline" size={13} /> Secure payment · Powered by Razorpay</Text>
          ) : (
            <TouchableOpacity onPress={handlePay}>
              <Text style={styles.secure}>
                <MaterialCommunityIcons name="information-outline" size={13} /> How do I give at the parish office?
              </Text>
            </TouchableOpacity>
          )}
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
    ...Shadow.sm,
  },
  backIcon: { color: Colors.primary.navy, fontSize: 22 },
  headerTitle: { color: Colors.primary.navy, fontSize: 18, fontWeight: '700' },
  scroll: { padding: Spacing.screen },

  offeringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent.gold + '40',
  },
  offeringIcon: { fontSize: 24 , color: Colors.primary.navy},
  offeringType: { fontSize: 16, fontWeight: '700', color: Colors.primary.navy },

  label: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy, marginBottom: Spacing.sm, marginTop: Spacing.md },

  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.accent.gold,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.gold,
  },
  rupee: { fontSize: 28, color: Colors.neutral.gray400, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '700', color: Colors.primary.navy, paddingVertical: 12 },

  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  quickBtnActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  quickText: { fontSize: 14, color: Colors.neutral.gray600, fontWeight: '500' },
  quickTextActive: { color: Colors.neutral.white, fontWeight: '700' },

  causeInput: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.neutral.gray800,
    marginBottom: Spacing.xs,
  },
  intentionInput: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.neutral.gray800,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray200,
    ...Shadow.sm,
  },
  paymentRowActive: { borderColor: Colors.accent.gold, backgroundColor: Colors.accent.goldPale },
  paymentIcon: { fontSize: 22, marginRight: Spacing.md , color: Colors.primary.navy},
  paymentLabel: { flex: 1, fontSize: 14, color: Colors.neutral.gray700, fontWeight: '500' },
  paymentLabelActive: { color: Colors.primary.navy, fontWeight: '700' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.neutral.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.accent.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent.gold },

  payBtn: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  secure: { textAlign: 'center', fontSize: 12, color: Colors.neutral.gray400 },
});
