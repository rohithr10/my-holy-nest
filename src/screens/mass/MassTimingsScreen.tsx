import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { useMassTimings, timingsForDay, upcomingSpecial, formatMassTime } from '../../hooks/useMass';
import { callParish } from '../../utils/contact';
import type { MassTiming } from '../../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];

interface Section {
  day: string;
  dayTA: string;
  timings: MassTiming[];
}

/** "Monday – Saturday" for a consecutive run, "Monday, Wednesday" otherwise. */
function dayLabel(days: number[], names: string[]): string {
  const consecutive = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  if (days.length > 2 && consecutive) return `${names[days[0]]} – ${names[days[days.length - 1]]}`;
  return days.map(d => names[d]).join(', ');
}

/** Groups weekdays that share exactly the same Masses, Sunday first. */
function buildSections(timings: MassTiming[]): Section[] {
  const groups = new Map<string, { days: number[]; timings: MassTiming[] }>();
  for (let day = 0; day < 7; day++) {
    const list = timingsForDay(timings, day);
    if (!list.length) continue;
    const key = list.map(t => t._id).join('|');
    const g = groups.get(key) ?? { days: [], timings: list };
    g.days.push(day);
    groups.set(key, g);
  }
  const sections = [...groups.values()].map(g => ({
    day: dayLabel(g.days, DAY_NAMES),
    dayTA: dayLabel(g.days, DAY_NAMES_TA),
    timings: g.timings,
  }));
  const special = upcomingSpecial(timings);
  if (special.length) {
    sections.push({ day: 'Special Masses', dayTA: 'சிறப்பு திருப்பலிகள்', timings: special });
  }
  return sections;
}

export default function MassTimingsScreen() {
  const navigation = useNavigation<any>();
  const church = useAppSelector(selectChurch);
  const { data, isLoading, isError, refetch } = useMassTimings();
  const sections = buildSections(data ?? []);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mass Timings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.churchBanner}>
          <MaterialCommunityIcons name="church" size={36} color={Colors.accent.gold} />
          <View>
            <Text style={styles.churchName}>{church?.name}</Text>
            {!!church?.address && (
              <Text style={styles.churchArea}>
                {[church.address.area, church.address.city].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        </View>

        {isLoading && <LoadingSpinner label="Loading the schedule…" />}
        {!isLoading && !sections.length && (
          <EmptyState
            icon="church"
            title={isError ? "Couldn't load the Mass schedule" : 'No Mass timings published yet'}
            subtitle={isError ? 'Check your connection and try again.' : 'Please check with the parish office.'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        )}
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDay}>{section.day}</Text>
              <Text style={styles.sectionDayTA}>{section.dayTA}</Text>
            </View>
            {section.timings.map((t) => (
              <View key={t._id} style={styles.row}>
                <View style={styles.timeCol}>
                  <Text style={styles.time}>
                    {formatMassTime(t.time).clock} {formatMassTime(t.time).meridiem}
                  </Text>
                  {!!t.specificDate && (
                    <Text style={styles.venue}>
                      {new Date(t.specificDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.massTitle}>{t.title}</Text>
                  {!!t.titleTA && <Text style={styles.massTitleTA}>{t.titleTA}</Text>}
                  <View style={styles.venueRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color={Colors.neutral.gray400} />
                    <Text style={styles.venue}>{t.venue}</Text>
                  </View>
                </View>
                <View style={[
                  styles.langBadge,
                  t.language === 'ta' ? styles.langTA : t.language === 'en' ? styles.langEN : styles.langBoth,
                ]}>
                  <Text style={styles.langText}>
                    {t.language === 'ta' ? 'Tamil' : t.language === 'en' ? 'English' : 'Bilingual'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.noteCard}>
          <View style={styles.noteTitleRow}>
            <MaterialCommunityIcons name="information-outline" size={16} color={Colors.accent.goldDark} />
            <Text style={styles.noteTitle}>Note</Text>
          </View>
          <Text style={styles.noteText}>
            Mass timings may change on special feast days and holy days. Check announcements or contact the parish office for latest updates.
          </Text>
        </View>

        {!!church?.contact?.phone && (
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Parish Office</Text>
            <TouchableOpacity style={styles.contactRow} onPress={() => callParish(church.contact.phone)}>
              <MaterialCommunityIcons name="phone-outline" size={15} color={Colors.neutral.gray500} />
              <Text style={styles.contactText}>{church.contact.phone}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  headerTitle: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  scroll: { padding: Spacing.screen },
  churchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.navyLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  churchName: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  churchArea: { color: Colors.sky.blueLight, fontSize: 13, marginTop: 2 },
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  sectionHeader: {
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionDay: { color: Colors.neutral.white, fontWeight: '700', fontSize: 14 },
  sectionDayTA: { color: Colors.sky.blueLight, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  timeCol: { width: 80 },
  time: { fontSize: 13, fontWeight: '700', color: Colors.primary.navy },
  infoCol: { flex: 1 },
  massTitle: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray800 },
  massTitleTA: { fontSize: 12, color: Colors.neutral.gray400 },
  venue: { fontSize: 11, color: Colors.neutral.gray400 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  langTA: { backgroundColor: Colors.primary.navyLight + '30' },
  langEN: { backgroundColor: Colors.sky.bluePale },
  langBoth: { backgroundColor: Colors.accent.goldPale },
  langText: { fontSize: 11, fontWeight: '600', color: Colors.primary.navy },
  noteCard: {
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.gold,
  },
  noteTitle: { fontSize: 14, fontWeight: '700', color: Colors.accent.goldDark },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  noteText: { fontSize: 13, color: Colors.neutral.gray600, lineHeight: 20 },
  contactCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.sm },
  contactText: { fontSize: 13, color: Colors.neutral.gray600 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
});
