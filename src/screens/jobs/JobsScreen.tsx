import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useJobs } from '../../hooks/useCommunity';
import type { JobPosting } from '../../types';

const TYPE_LABEL: Record<JobPosting['type'], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  volunteer: 'Volunteer',
  contract: 'Contract',
};
const FILTERS: ('all' | JobPosting['type'])[] = ['all', 'full_time', 'part_time', 'volunteer'];

function posted(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function JobsScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, isError, refetch, isRefetching } = useJobs();

  const filtered = (data ?? []).filter(j => filter === 'all' || j.type === filter);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" style={styles.backIcon} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Parish Jobs Board</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.filterPill, filter === t && styles.filterPillActive]}
            onPress={() => setFilter(t)}>
            <Text style={[styles.filterText, filter === t && styles.filterTextActive]}>
              {t === 'all' ? 'All' : TYPE_LABEL[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={j => j._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={isError ? "Couldn't load job postings" : 'No openings right now'}
            subtitle={isError ? 'Check your connection and pull down to retry.' : undefined}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setOpen(open === item._id ? null : item._id)}>
            <View style={styles.cardTop}>
              <View style={styles.jobIcon}>
                <MaterialCommunityIcons name="briefcase-outline" style={styles.jobIconText} />
              </View>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                {!!item.contactName && <Text style={styles.company}>{item.contactName}</Text>}
                {!!item.location && (
                  <Text style={styles.location}><MaterialCommunityIcons name="map-marker-outline" size={13} /> {item.location}</Text>
                )}
              </View>
              <View style={[styles.typeBadge, item.type === 'full_time' ? styles.typeFull : styles.typePart]}>
                <Text style={styles.typeText}>{TYPE_LABEL[item.type]}</Text>
              </View>
            </View>
            {open === item._id && !!item.description && <Text style={styles.description}>{item.description}</Text>}
            <View style={styles.cardFooter}>
              {item.contactPhone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}>
                  <Text style={styles.salary}><MaterialCommunityIcons name="phone-outline" size={13} /> {item.contactPhone}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.posted}>Ask at the parish office</Text>
              )}
              <Text style={styles.posted}>{posted(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary.navy, paddingHorizontal: Spacing.screen, paddingVertical: 14 },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.neutral.white, borderWidth: 1, borderColor: Colors.neutral.gray200 },
  filterPillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  filterText: { fontSize: 13, color: Colors.neutral.gray500 },
  filterTextActive: { color: Colors.neutral.white, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: 24 },
  card: { backgroundColor: Colors.neutral.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  jobIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent.goldPale, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  jobIconText: { fontSize: 22 , color: Colors.primary.navy},
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  company: { fontSize: 13, color: Colors.neutral.gray600, marginTop: 2 },
  location: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  typeFull: { backgroundColor: Colors.semantic.success + '20' },
  typePart: { backgroundColor: Colors.sky.bluePale },
  typeText: { fontSize: 11, fontWeight: '700', color: Colors.primary.navy },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.neutral.gray100 },
  salary: { fontSize: 13, color: Colors.semantic.success, fontWeight: '600' },
  posted: { fontSize: 12, color: Colors.neutral.gray400 },
  description: { fontSize: 13, color: Colors.neutral.gray600, marginBottom: Spacing.sm, lineHeight: 19 },
});
