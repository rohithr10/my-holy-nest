import React from 'react';
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
import { useMyFamily, fullName } from '../../hooks/useFamily';
import type { FamilyMember } from '../../types';

const RELATION_LABEL: Record<FamilyMember['relation'], string> = {
  head: 'Head of Family',
  spouse: 'Spouse',
  son: 'Son',
  daughter: 'Daughter',
  parent: 'Parent',
  other: 'Other',
};

/** "2002-06-22" → "22 Jun 2002"; anything unparseable is shown as entered. */
function formatDob(dob?: string): string | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  return isNaN(d.getTime())
    ? dob
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MembersScreen() {
  const navigation = useNavigation<any>();
  const { family, isHead, isLoading, isError, refetch, isRefetching } = useMyFamily();
  // Head first, then everyone in the order they were added.
  const members = [...(family?.members ?? [])].sort(
    (a, b) => Number(b.relation === 'head') - Number(a.relation === 'head'),
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Members</Text>
        {isHead && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate(Routes.AddMember)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen label="Loading members…" />
      ) : !family ? (
        <EmptyState
          icon="account-group-outline"
          title={isError ? "Couldn't load family members" : 'No family card yet'}
          subtitle={isError ? 'Check your connection and try again.' : 'Please contact the parish office.'}
          actionLabel={isError ? (isRefetching ? 'Retrying…' : 'Try again') : undefined}
          onAction={isError ? () => refetch() : undefined}
        />
      ) : (
      <FlatList
        data={members}
        keyExtractor={m => m._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{members.length}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{members.filter(m => m.gender === 'M').length}</Text>
              <Text style={styles.statLabel}>Male</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{members.filter(m => m.gender === 'F').length}</Text>
              <Text style={styles.statLabel}>Female</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isHeadMember = item.relation === 'head';
          const details = [formatDob(item.dob), item.occupation].filter(Boolean).join('  ·  ');
          return (
          <View style={[styles.memberCard, isHeadMember && styles.memberCardHead]}>
            <View style={[styles.avatar, { backgroundColor: item.gender === 'F' ? Colors.sky.blue : Colors.primary.navy }]}>
              <Text style={styles.avatarText}>{item.firstName[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.memberName}>{fullName(item)}</Text>
                {isHeadMember && (
                  <View style={styles.headBadge}><Text style={styles.headBadgeText}>Head</Text></View>
                )}
              </View>
              <Text style={styles.relation}>{RELATION_LABEL[item.relation]}{item.isDeceased ? ' · Deceased' : ''}</Text>
              {!!details && (
                <Text style={styles.details}><MaterialCommunityIcons name="cake-variant-outline" size={13} /> {details}</Text>
              )}
            </View>
            {isHead && (
              <TouchableOpacity
                style={styles.editBtn}
                accessibilityLabel={`Edit ${fullName(item)}`}
                onPress={() => navigation.navigate(Routes.AddMember, { memberId: item._id })}>
                <MaterialCommunityIcons name="pencil-outline" style={styles.editIcon} />
              </TouchableOpacity>
            )}
          </View>
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
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
  },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  addBtn: {
    backgroundColor: Colors.accent.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: { color: Colors.neutral.white, fontWeight: '700', fontSize: 13 },
  list: { padding: Spacing.screen },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: Colors.primary.navy },
  statLabel: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 2 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  memberCardHead: { borderLeftWidth: 3, borderLeftColor: Colors.accent.gold },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.neutral.gray800 },
  headBadge: {
    backgroundColor: Colors.accent.goldPale,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  headBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.accent.goldDark },
  relation: { fontSize: 13, color: Colors.neutral.gray500, marginBottom: 2 },
  details: { fontSize: 12, color: Colors.neutral.gray400 },
  editBtn: { padding: Spacing.sm },
  editIcon: { fontSize: 16, color: Colors.neutral.gray400 },
});
