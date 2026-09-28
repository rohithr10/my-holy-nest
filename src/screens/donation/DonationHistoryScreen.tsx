import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useDonationHistory, OFFERING_LABEL, METHOD_LABEL, inr, donationDate } from '../../hooks/useDonations';

export default function DonationHistoryScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch, isRefetching } = useDonationHistory();

  // Years that actually have donations, newest first, plus the current year.
  const thisYear = new Date().getFullYear();
  const years = Array.from(
    new Set([thisYear, ...(data ?? []).map(d => new Date(d.processedAt ?? d.createdAt).getFullYear())]),
  ).sort((a, b) => b - a);
  const [year, setYear] = useState(thisYear);

  // Only settled offerings belong in history — an abandoned checkout isn't one.
  const items = (data ?? []).filter(
    d => d.status !== 'pending' && new Date(d.processedAt ?? d.createdAt).getFullYear() === year,
  );
  const completed = items.filter(d => d.status === 'completed');
  const total = completed.reduce((sum, d) => sum + d.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donation History</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.yearRow}>
        {years.map(y => (
          <TouchableOpacity
            key={y}
            style={[styles.yearPill, year === y && styles.yearPillActive]}
            onPress={() => setYear(y)}>
            <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Given in {year}</Text>
        <Text style={styles.totalAmount}>{inr(total)}</Text>
        <Text style={styles.totalCount}>
          {completed.length} {completed.length === 1 ? 'offering' : 'offerings'}
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
      <FlatList
        data={items}
        keyExtractor={d => d._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="hand-heart-outline"
            title={isError ? "Couldn't load your donations" : `No offerings in ${year}`}
            subtitle={isError ? 'Check your connection and pull down to retry.' : undefined}
          />
        }
        renderItem={({ item }) => {
          const ok = item.status === 'completed';
          return (
          <TouchableOpacity
            style={styles.row}
            disabled={!ok}
            onPress={() => navigation.navigate(Routes.DonationReceipt, { donationId: item._id })}>
            <View style={[styles.statusDot, ok ? styles.dotGreen : styles.dotRed]} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowType}>{OFFERING_LABEL[item.type] ?? item.type}</Text>
              <Text style={styles.rowDate}>
                {donationDate(item)}
                {item.method && item.method !== 'online' ? ` · ${METHOD_LABEL[item.method]} at parish office` : ''}
                {!ok ? ` · ${item.status}` : ''}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowAmount, !ok && styles.rowAmountFailed]}>
                {ok ? inr(item.amount) : '—'}
              </Text>
              <MaterialCommunityIcons
                name={ok ? 'check-circle' : 'close-circle'}
                size={16}
                color={ok ? Colors.semantic.success : Colors.semantic.error}
              />
            </View>
          </TouchableOpacity>
          );
        }}
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
    justifyContent: 'space-between',
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
  },
  backIcon: { color: Colors.neutral.white, fontSize: 22 },
  headerTitle: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  yearRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  yearPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  yearPillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  yearText: { fontSize: 14, color: Colors.neutral.gray500, fontWeight: '500' },
  yearTextActive: { color: Colors.neutral.white, fontWeight: '700' },

  totalCard: {
    backgroundColor: Colors.primary.navyLight,
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: 0,
    alignItems: 'center',
  },
  totalLabel: { color: Colors.sky.blueLight, fontSize: 13, marginBottom: 6 },
  totalAmount: { color: Colors.neutral.white, fontSize: 36, fontWeight: '700', marginBottom: 4 },
  totalCount: { color: Colors.sky.blueLight, fontSize: 12 },

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
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.md },
  dotGreen: { backgroundColor: Colors.semantic.success },
  dotRed: { backgroundColor: Colors.semantic.error },
  rowInfo: { flex: 1 },
  rowType: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray800 },
  rowDate: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  rowAmountFailed: { color: Colors.semantic.error },
  rowStatus: { fontSize: 12, color: Colors.semantic.success, marginTop: 2 },
  rowStatusFailed: { color: Colors.semantic.error },
});
