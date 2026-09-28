import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAdminDonations, useAdminStats, inrShort } from '../../hooks/useAdmin';
import { OFFERING_LABEL, METHOD_LABEL } from '../../hooks/useDonations';

type Period = 'today' | 'week' | 'month' | 'year';

function periodStart(p: Period): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === 'week') d.setDate(d.getDate() - 6);
  if (p === 'month') d.setDate(1);
  if (p === 'year') d.setMonth(0, 1);
  return d;
}

type Row = NonNullable<ReturnType<typeof useAdminDonations>['data']>['donations'][number];

function donor(d: Row): string {
  if (d.isAnonymous) return 'Anonymous';
  if (d.userId && typeof d.userId !== 'string') {
    const n = [d.userId.profile?.firstName, d.userId.profile?.lastName].filter(Boolean).join(' ');
    if (n) return n;
  }
  return d.donorName || 'Parishioner';
}

export default function AdminDonationsScreen() {
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading, isError, refetch, isRefetching } = useAdminDonations('completed');
  const stats = useAdminStats();

  const from = periodStart(period).getTime();
  const rows = (data?.donations ?? []).filter(
    d => new Date(d.processedAt ?? d.createdAt).getTime() >= from,
  );
  const total =
    period === 'month' && stats.data
      ? stats.data.stats.donationsThisMonth
      : period === 'year' && stats.data
        ? stats.data.stats.donationsYearToDate
        : rows.reduce((sum, d) => sum + d.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donations</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          Total Received ({period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : period === 'month' ? 'This Month' : 'This Year'})
        </Text>
        <Text style={styles.summaryAmount}>₹{total.toLocaleString('en-IN')}</Text>
        <Text style={styles.summaryCount}>
          {rows.length} {rows.length === 1 ? 'offering' : 'offerings'}{rows.length >= 100 ? '+' : ''}
        </Text>
      </View>

      <View style={styles.periodRow}>
        {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodPill, period === p && styles.periodPillActive]}
            onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
      <FlatList
        data={rows}
        keyExtractor={d => d._id}
        contentContainerStyle={styles.list}
        onRefresh={() => {
          refetch();
          stats.refetch();
        }}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="cash-multiple"
            title={isError ? "Couldn't load donations" : 'No offerings in this period'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.amountCircle}>
              <Text style={styles.amountText}>{inrShort(item.amount)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.family}>{donor(item)}</Text>
              <Text style={styles.type}>
                {OFFERING_LABEL[item.type] ?? item.type}
                {item.method && item.method !== 'online' ? ` · ${METHOD_LABEL[item.method]}` : ''}
              </Text>
              <Text style={styles.date}>
                {new Date(item.processedAt ?? item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {item.receiptNumber ? ` · ${item.receiptNumber}` : ''}
              </Text>
            </View>
          </View>
        )}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
  },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  exportBtn: { borderWidth: 1, borderColor: Colors.neutral.white, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  exportText: { color: Colors.neutral.white, fontSize: 12 },
  summaryCard: {
    backgroundColor: Colors.primary.navyLight,
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: { color: Colors.sky.blueLight, fontSize: 13, marginBottom: 6 },
  summaryAmount: { color: Colors.neutral.white, fontSize: 32, fontWeight: '700', marginBottom: 4 },
  summaryCount: { color: Colors.sky.blueLight, fontSize: 12 },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  periodPillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  periodText: { fontSize: 12, color: Colors.neutral.gray500 },
  periodTextActive: { color: Colors.neutral.white, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    ...Shadow.sm,
  },
  amountCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  amountText: { fontSize: 13, fontWeight: '700', color: Colors.accent.goldDark },
  info: { flex: 1 },
  family: { fontSize: 14, fontWeight: '700', color: Colors.primary.navy },
  type: { fontSize: 13, color: Colors.neutral.gray500 },
  date: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 1 },
});
