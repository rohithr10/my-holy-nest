import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import TopSafeArea from '../common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { useGroups, useEvents, useRsvp, GROUP_META, eventDate } from '../../hooks/useCommunity';
import { getApiErrorMessage } from '../../api/client';
import type { ClubType, Event } from '../../types';

/**
 * One parish group (youth, women, widows, children…): its description and
 * member count as the parish office entered them, and the group's upcoming
 * events, which parishioners can RSVP to.
 */
export default function GroupDetail({ type, fallbackTitle }: { type: ClubType; fallbackTitle: string }) {
  const navigation = useNavigation<any>();
  const groups = useGroups();
  const group = groups.data?.find(g => g.type === type);
  const events = useEvents(group?._id);
  const rsvp = useRsvp();
  const meta = GROUP_META[type];

  const toggle = (e: Event) =>
    rsvp.mutate(e._id, {
      onError: err => Alert.alert("Couldn't update your RSVP", getApiErrorMessage(err)),
    });

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group?.name ?? fallbackTitle}</Text>
        <View style={{ width: 32 }} />
      </View>

      {groups.isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <MaterialCommunityIcons name={meta.icon} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>{group?.name ?? fallbackTitle}</Text>
            <Text style={styles.heroTA}>{meta.nameTA}</Text>
            {group ? (
              <>
                {!!group.description && <Text style={styles.heroDesc}>{group.description}</Text>}
                {group.membersCount > 0 && (
                  <Text style={styles.memberCount}>{group.membersCount} members</Text>
                )}
              </>
            ) : (
              <Text style={styles.heroDesc}>
                {groups.isError
                  ? "Couldn't load this group. Check your connection."
                  : "This group hasn't been set up in the app yet. Please ask at the parish office."}
              </Text>
            )}
          </View>

          {group && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {events.isLoading && <LoadingSpinner size="small" />}
              {!events.isLoading && !events.data?.length && (
                <Text style={styles.empty}>No upcoming events for this group.</Text>
              )}
              {events.data?.map(e => {
                const full = !!e.maxAttendees && e.rsvpCount >= e.maxAttendees && !e.hasRsvped;
                return (
                  <View key={e._id} style={styles.card}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{e.title}</Text>
                      <Text style={styles.cardMeta}>
                        <MaterialCommunityIcons name="calendar-outline" size={12} /> {eventDate(e)}
                        {e.venue ? ` · ${e.venue}` : ''}
                      </Text>
                      {!!e.description && <Text style={styles.cardDesc}>{e.description}</Text>}
                      <Text style={styles.cardMeta}>
                        {e.rsvpCount} going{e.maxAttendees ? ` · ${e.maxAttendees} places` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, e.hasRsvped && styles.rsvpBtnActive, full && styles.rsvpBtnDisabled]}
                      disabled={full || rsvp.isPending}
                      onPress={() => toggle(e)}>
                      <Text style={[styles.rsvpText, e.hasRsvped && styles.rsvpTextActive]}>
                        {e.hasRsvped ? 'Going' : full ? 'Full' : 'RSVP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
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
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    margin: Spacing.screen,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  heroIcon: { fontSize: 44, color: Colors.primary.navy, marginBottom: Spacing.sm },
  heroTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary.navy },
  heroTA: { fontSize: 13, color: Colors.neutral.gray400, marginTop: 2 },
  heroDesc: { fontSize: 14, color: Colors.neutral.gray600, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  memberCount: { fontSize: 13, fontWeight: '600', color: Colors.accent.goldDark, marginTop: Spacing.sm },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  empty: { fontSize: 14, color: Colors.neutral.gray500, paddingHorizontal: Spacing.screen },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  cardMeta: { fontSize: 12, color: Colors.neutral.gray500 },
  cardDesc: { fontSize: 13, color: Colors.neutral.gray600 },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: Colors.accent.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  rsvpBtnActive: { backgroundColor: Colors.accent.gold },
  rsvpBtnDisabled: { borderColor: Colors.neutral.gray300 },
  rsvpText: { fontSize: 13, fontWeight: '700', color: Colors.accent.goldDark },
  rsvpTextActive: { color: Colors.neutral.white },
});
