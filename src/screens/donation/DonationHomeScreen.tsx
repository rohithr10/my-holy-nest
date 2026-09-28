import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { Config } from '../../constants/config';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { useGivingForYear, OFFERING_LABEL, inr, donationDate } from '../../hooks/useDonations';

/**
 * `route: 'subscription'` opens the recurring-giving setup; everything else
 * goes to the one-off offering screen. `Donation` additionally asks for a
 * cause there, so the giver can name what the money is for.
 */
const OFFERING_TYPES = [
  {
    icon: 'calendar-sync-outline',
    name: 'Monthly Subscription',
    nameTA: 'மாத சந்தா',
    desc: 'Give automatically every month',
    route: 'subscription' as const,
  },
  {
    icon: 'church',
    name: 'Mass Offering',
    nameTA: 'திருப்பலி காணிக்கை',
    desc: 'Offer a Mass for your intentions',
    route: 'offering' as const,
  },
  {
    icon: 'hand-heart-outline',
    name: 'Donation',
    nameTA: 'நன்கொடை',
    desc: 'Give towards a cause of your choice',
    route: 'offering' as const,
  },
];

export default function DonationHomeScreen() {
  const navigation = useNavigation<any>();
  const church = useAppSelector(selectChurch);
  const year = new Date().getFullYear();
  const giving = useGivingForYear(year);
  const recent = (giving.data ?? []).filter(d => d.status === 'completed').slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Give</Text>
        <Text style={styles.headerSub}>{church?.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Your Giving — {year}</Text>
          <Text style={styles.summaryAmount}>
            {giving.isLoading ? '…' : giving.isError ? '—' : inr(giving.total)}
          </Text>
          {giving.isError && (
            <Text style={styles.progressLabel}>Couldn't load your giving. Pull down on History to retry.</Text>
          )}
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{giving.count}</Text>
              <Text style={styles.statLabel}>Donations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{inr(giving.average)}</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{inr(giving.highest)}</Text>
              <Text style={styles.statLabel}>Highest</Text>
            </View>
          </View>
        </View>

        {!Config.ONLINE_GIVING_ENABLED && (
          <View style={styles.noticeCard}>
            <MaterialCommunityIcons name="information-outline" style={styles.noticeIcon} />
            <Text style={styles.noticeText}>
              Online giving is being set up. Until then, please give at the parish office — offerings
              recorded there appear in your giving history here.
            </Text>
          </View>
        )}

        {/* Offering Types */}
        <Text style={styles.sectionTitle}>Make an Offering</Text>
        <View style={styles.offeringGrid}>
          {OFFERING_TYPES.map((ot, i) => (
            <TouchableOpacity
              key={i}
              style={styles.offeringCard}
              onPress={() =>
                ot.route === 'subscription'
                  ? navigation.navigate(Routes.Subscription)
                  : navigation.navigate(Routes.MakeOffering, { offeringType: ot.name })
              }>
              <MaterialCommunityIcons name={ot.icon} style={styles.offeringIcon} />
              <Text style={styles.offeringName}>{ot.name}</Text>
              <Text style={styles.offeringNameTA}>{ot.nameTA}</Text>
              <Text style={styles.offeringDesc} numberOfLines={1}>{ot.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscription CTA */}
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => navigation.navigate(Routes.Subscription)}>
          <View>
            <Text style={styles.subscriptionTitle}>Monthly Subscription</Text>
            <Text style={styles.subscriptionDesc}>Set up a recurring monthly offering automatically</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" style={styles.subscriptionArrow} />
        </TouchableOpacity>

        {/* Recent Donations */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Donations</Text>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.DonationHistory)}>
              <Text style={styles.seeAll}>See All <MaterialCommunityIcons name="chevron-right" size={13} /></Text>
            </TouchableOpacity>
          </View>
          {!giving.isLoading && !recent.length && (
            <Text style={styles.donationDate}>No offerings recorded yet.</Text>
          )}
          {recent.map(d => (
            <TouchableOpacity
              key={d._id}
              style={styles.donationRow}
              onPress={() => navigation.navigate(Routes.DonationReceipt, { donationId: d._id })}>
              <View style={styles.donationIcon}>
                <Text style={styles.donationIconText}>₹</Text>
              </View>
              <View style={styles.donationInfo}>
                <Text style={styles.donationType}>{OFFERING_LABEL[d.type] ?? d.type}</Text>
                <Text style={styles.donationDate}>{donationDate(d)}</Text>
              </View>
              <Text style={styles.donationAmount}>{inr(d.amount)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: {
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: Colors.neutral.white },
  headerSub: { fontSize: 13, color: Colors.sky.blueLight, marginTop: 2 },

  summaryCard: {
    backgroundColor: Colors.primary.navyLight,
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  summaryLabel: { color: Colors.sky.blueLight, fontSize: 13, marginBottom: 4 },
  summaryAmount: { color: Colors.neutral.white, fontSize: 36, fontWeight: '700', marginBottom: Spacing.md },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: Colors.accent.gold, borderRadius: 3 },
  progressLabel: { color: Colors.sky.blueLight, fontSize: 12, marginBottom: Spacing.md },
  summaryStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: Spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  statLabel: { color: Colors.sky.blueLight, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary.navy, paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  seeAll: { color: Colors.sky.blue, fontSize: 13 },

  offeringGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.screen, gap: Spacing.sm, marginBottom: Spacing.lg },
  offeringCard: {
    width: '47%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  offeringIcon: { fontSize: 28, marginBottom: 6 , color: Colors.primary.navy},
  offeringName: { fontSize: 13, fontWeight: '700', color: Colors.primary.navy, marginBottom: 2 },
  offeringNameTA: { fontSize: 11, color: Colors.neutral.gray400, marginBottom: 4 },
  offeringDesc: { fontSize: 11, color: Colors.neutral.gray500 },

  subscriptionBanner: {
    backgroundColor: Colors.accent.goldPale,
    marginHorizontal: Spacing.screen,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.accent.gold + '50',
    marginBottom: Spacing.lg,
  },
  subscriptionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy, marginBottom: 4 },
  subscriptionDesc: { fontSize: 13, color: Colors.neutral.gray500 },
  subscriptionArrow: { fontSize: 28, color: Colors.accent.gold, fontWeight: '300' },

  recentSection: { marginBottom: Spacing.md },
  donationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.xs,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  donationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  donationIconText: { fontSize: 18, color: Colors.accent.goldDark, fontWeight: '700' },
  donationInfo: { flex: 1 },
  donationType: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray800 },
  donationDate: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  donationAmount: { fontSize: 16, fontWeight: '700', color: Colors.primary.navy },
  noticeCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  noticeIcon: { fontSize: 18, color: Colors.primary.navy, marginTop: 1 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.primary.navy },
});
