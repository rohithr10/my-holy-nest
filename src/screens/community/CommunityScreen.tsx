import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { Routes } from '../../constants/routes';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { useGroups, useEvents, useRsvp, GROUP_META, eventDate } from '../../hooks/useCommunity';
import { getApiErrorMessage } from '../../api/client';
import type { ClubType } from '../../types';

/** Screen for each kind of group; volunteers has no dedicated screen. */
const GROUP_ROUTE: Partial<Record<ClubType, string>> = {
  youth: Routes.YouthClub,
  women: Routes.WomensClub,
  widows: Routes.WidowSupport,
  children: Routes.ChildrenScholarship,
};

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const church = useAppSelector(selectChurch);
  const groups = useGroups();
  const events = useEvents();
  const rsvp = useRsvp();
  const groupName = (id?: string) => groups.data?.find(g => g._id === id)?.name;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSub}>{church?.name} Groups</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={groups.isRefetching || events.isRefetching}
            onRefresh={() => {
              groups.refetch();
              events.refetch();
            }}
          />
        }>
        {/* Groups */}
        <Text style={styles.sectionTitle}>Parish Groups</Text>
        {groups.isLoading && <LoadingSpinner size="small" />}
        {groups.isError && <Text style={styles.emptyText}>Couldn't load parish groups. Pull down to retry.</Text>}
        {groups.data && !groups.data.length && (
          <Text style={styles.emptyText}>The parish hasn't added any groups yet.</Text>
        )}
        {groups.data?.map(g => {
          const meta = GROUP_META[g.type];
          const route = GROUP_ROUTE[g.type];
          return (
          <TouchableOpacity
            key={g._id}
            style={styles.groupCard}
            disabled={!route}
            onPress={() => route && navigation.navigate(route)}>
            <View style={[styles.groupIconBg, { backgroundColor: meta.color + '20' }]}>
              <MaterialCommunityIcons name={meta.icon} style={styles.groupIcon} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={styles.groupNameTA}>{meta.nameTA}</Text>
              {!!g.description && <Text style={styles.groupDesc} numberOfLines={2}>{g.description}</Text>}
            </View>
            {g.membersCount > 0 && (
              <View style={styles.groupRight}>
                <Text style={styles.memberCount}>{g.membersCount}</Text>
                <Text style={styles.memberLabel}>members</Text>
              </View>
            )}
          </TouchableOpacity>
          );
        })}

        {/* Upcoming Events */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.isLoading && <LoadingSpinner size="small" />}
        {events.data && !events.data.length && (
          <Text style={styles.emptyText}>No upcoming events.</Text>
        )}
        {events.data?.map(e => {
          const full = !!e.maxAttendees && e.rsvpCount >= e.maxAttendees && !e.hasRsvped;
          return (
          <View key={e._id} style={styles.eventCard}>
            <MaterialCommunityIcons name="calendar-star" style={styles.eventIcon} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{e.title}</Text>
              <Text style={styles.eventMeta}>
                {groupName(e.communityGroupId) ? `${groupName(e.communityGroupId)} · ` : ''}
                {eventDate(e)}
                {e.venue ? ` · ${e.venue}` : ''}
              </Text>
              <Text style={styles.eventMeta}>{e.rsvpCount} going</Text>
            </View>
            <TouchableOpacity
              style={[styles.rsvpBtn, e.hasRsvped && styles.rsvpBtnActive]}
              disabled={full || rsvp.isPending}
              onPress={() =>
                rsvp.mutate(e._id, {
                  onError: err => Alert.alert("Couldn't update your RSVP", getApiErrorMessage(err)),
                })
              }>
              <Text style={[styles.rsvpText, e.hasRsvped && styles.rsvpTextActive]}>
                {e.hasRsvped ? 'Going' : full ? 'Full' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
          );
        })}

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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary.navy, paddingHorizontal: Spacing.screen, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  groupIconBg: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  groupIcon: { fontSize: 26 , color: Colors.primary.navy},
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  groupNameTA: { fontSize: 12, color: Colors.neutral.gray400 },
  groupDesc: { fontSize: 12, color: Colors.neutral.gray500, marginTop: 2 },
  groupRight: { alignItems: 'center' },
  memberCount: { fontSize: 20, fontWeight: '700', color: Colors.primary.navy },
  memberLabel: { fontSize: 11, color: Colors.neutral.gray400 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.xs,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  eventIcon: { fontSize: 24, marginRight: Spacing.md , color: Colors.primary.navy},
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray800 },
  eventMeta: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  emptyText: { fontSize: 14, color: Colors.neutral.gray500, paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: Colors.accent.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rsvpBtnActive: { backgroundColor: Colors.accent.gold },
  rsvpText: { fontSize: 12, fontWeight: '700', color: Colors.accent.goldDark },
  rsvpTextActive: { color: Colors.neutral.white },
});
