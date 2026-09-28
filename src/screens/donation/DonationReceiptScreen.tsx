import React from 'react';
import {
  View, Text, StyleSheet, StatusBar,
  TouchableOpacity, Share, ScrollView,
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
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { useDonationHistory, OFFERING_LABEL, METHOD_LABEL, inr } from '../../hooks/useDonations';

type Props = NativeStackScreenProps<DonationStackParamList, typeof Routes.DonationReceipt>;

export default function DonationReceiptScreen({ navigation, route }: Props) {
  const { donationId } = route.params;
  const church = useAppSelector(selectChurch);
  const { data, isLoading, isError, refetch } = useDonationHistory();
  const donation = data?.find(d => d._id === donationId);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!donation || donation.status !== 'completed') {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <TopSafeArea color={Colors.neutral.warmWhite} />
        <EmptyState
          icon="receipt"
          title={isError ? "Couldn't load this receipt" : 'No receipt for this offering'}
          subtitle={isError ? 'Check your connection and try again.' : 'Receipts are issued once an offering is received.'}
          actionLabel={isError ? 'Try again' : 'Back'}
          onAction={isError ? () => refetch() : () => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const date = new Date(donation.processedAt ?? donation.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const type = OFFERING_LABEL[donation.type] ?? donation.type;
  const receiptNo = donation.receiptNumber ?? '—';

  const shareReceipt = async () => {
    await Share.share({
      message: `My Holy Nest Donation Receipt\n\nReceipt #: ${receiptNo}\nDate: ${date}\nType: ${type}\nAmount: ${inr(donation.amount)}\n\nThank you for your offering to ${church?.name ?? 'the parish'}.`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.warmWhite} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.warmWhite} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success */}
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="check" style={styles.checkIcon} />
        </View>
        <Text style={styles.successTitle}>Offering Received!</Text>
        <Text style={styles.successMsg}>
          Thank you for your generous offering. God bless your family abundantly.
        </Text>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptChurch}><MaterialCommunityIcons name="church" size={13} /> {church?.name}</Text>
            <Text style={styles.receiptDate}>{date}</Text>
          </View>

          <View style={styles.divider} />

          {[
            { label: 'Receipt No.', value: receiptNo },
            { label: 'Offering Type', value: type },
            ...(donation.intention ? [{ label: 'Intention', value: donation.intention }] : []),
            { label: 'Amount', value: inr(donation.amount) },
            { label: 'Payment Method', value: METHOD_LABEL[donation.method ?? 'online'] },
            { label: 'Status', value: 'Received' },
          ].map((row, i) => (
            <View key={i} style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{row.label}</Text>
              <Text style={[styles.receiptValue, row.label === 'Amount' && styles.receiptValueBold]}>
                {row.value}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />
          <Text style={styles.taxNote}>
            For a tax-deduction receipt, please ask the parish office.
          </Text>
        </View>

        {/* Scripture */}
        <View style={styles.scriptureCard}>
          <Text style={styles.scriptureText}>
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          </Text>
          <Text style={styles.scriptureRef}>2 Corinthians 9:7</Text>
        </View>

        <Button title="Share Receipt" onPress={shareReceipt} variant="secondary" fullWidth style={styles.btn} />
        <Button
          title="Make Another Offering"
          onPress={() => navigation.navigate(Routes.MakeOffering, {})}
          fullWidth
          style={styles.btn}
        />
        <TouchableOpacity onPress={() => navigation.navigate(Routes.DonationHistory)} style={styles.historyLink}>
          <Text style={styles.historyLinkText}>View All Donations <MaterialCommunityIcons name="arrow-right" size={13} /></Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  scroll: { padding: Spacing.screen, alignItems: 'center' },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  checkIcon: { color: Colors.neutral.white, fontSize: 40, fontWeight: '700' },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.sm, textAlign: 'center' },
  successMsg: { fontSize: 14, color: Colors.neutral.gray500, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  receiptCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  receiptChurch: { fontSize: 14, fontWeight: '700', color: Colors.primary.navy },
  receiptDate: { fontSize: 13, color: Colors.neutral.gray400 },
  divider: { height: 1, backgroundColor: Colors.neutral.gray200, marginVertical: Spacing.md },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  receiptLabel: { fontSize: 13, color: Colors.neutral.gray400 },
  receiptValue: { fontSize: 14, color: Colors.neutral.gray800, fontWeight: '500' },
  receiptValueBold: { fontSize: 18, fontWeight: '700', color: Colors.primary.navy },
  taxNote: { fontSize: 11, color: Colors.neutral.gray400, textAlign: 'center', lineHeight: 18 },
  scriptureCard: {
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.gold,
  },
  scriptureText: { fontSize: 13, fontStyle: 'italic', color: Colors.neutral.gray700, lineHeight: 22, marginBottom: Spacing.sm },
  scriptureRef: { fontSize: 12, fontWeight: '700', color: Colors.accent.goldDark },
  btn: { marginBottom: Spacing.sm, width: '100%' },
  historyLink: { marginTop: Spacing.sm },
  historyLinkText: { color: Colors.sky.blue, fontSize: 14, fontWeight: '500' },
});
