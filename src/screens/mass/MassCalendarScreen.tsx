import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { useMassTimings, formatMassTime } from '../../hooks/useMass';
import type { MassTiming } from '../../types';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** Colour per kind of dated Mass the parish publishes. */
const TYPE_STYLE: Record<MassTiming['massType'], { label: string; color: string }> = {
  feast: { label: 'Feast', color: Colors.accent.gold },
  special: { label: 'Special', color: Colors.sky.blue },
  funeral: { label: 'Funeral', color: Colors.neutral.gray500 },
  wedding: { label: 'Wedding', color: Colors.semantic.error },
  regular: { label: 'Mass', color: Colors.primary.navy },
};

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function MassCalendarScreen() {
  const navigation = useNavigation<any>();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const cells = buildCalendar(year, month);
  const today = now.getDate();

  // Dated Masses the parish office publishes (feasts, special Masses).
  const { data: timings, isLoading } = useMassTimings();
  const events = (timings ?? [])
    .filter(t => !!t.specificDate)
    .map(t => ({ ...t, date: t.specificDate!.slice(0, 10) }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const eventDates = new Set(events.map(e => e.date));

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const currentMonthEvents = events.filter(e =>
    e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mass Calendar</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" style={styles.navArrow} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" style={styles.navArrow} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          <View style={styles.dayRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <Text key={i} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              if (cell === null) return <View key={i} style={styles.cell} />;
              const dateStr = formatDate(year, month, cell);
              const isToday = cell === today && month === now.getMonth() && year === now.getFullYear();
              const hasEvent = eventDates.has(dateStr);
              return (
                <View key={i} style={styles.cell}>
                  <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                    <Text style={[styles.dayNum, isToday && styles.todayNum]}>{cell}</Text>
                  </View>
                  {hasEvent && <View style={styles.eventDot} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {(['feast', 'special'] as const).map(k => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: TYPE_STYLE[k].color }]} />
              <Text style={styles.legendText}>{TYPE_STYLE[k].label} Mass</Text>
            </View>
          ))}
        </View>

        {/* Events This Month */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Special Masses in {MONTH_NAMES[month]}
          </Text>
          {isLoading ? (
            <Text style={styles.noEvents}>Loading…</Text>
          ) : currentMonthEvents.length === 0 ? (
            <Text style={styles.noEvents}>No special Masses published for this month</Text>
          ) : (
            currentMonthEvents.map(event => {
              const kind = TYPE_STYLE[event.massType] ?? TYPE_STYLE.regular;
              const t = formatMassTime(event.time);
              return (
              <View key={event._id} style={styles.eventCard}>
                <View style={[styles.eventColorBar, { backgroundColor: kind.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventDate}>
                    {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {t.clock} {t.meridiem}
                  </Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {!!event.titleTA && <Text style={styles.eventTitleTA}>{event.titleTA}</Text>}
                </View>
                <View style={[styles.typeBadge, { backgroundColor: kind.color + '20' }]}>
                  <Text style={[styles.typeText, { color: kind.color }]}>{kind.label}</Text>
                </View>
              </View>
              );
            })
          )}
        </View>

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
  backIcon: { color: Colors.neutral.white, fontSize: 22 },
  headerTitle: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
  },
  navBtn: { padding: Spacing.sm },
  navArrow: { fontSize: 24, color: Colors.primary.navy, fontWeight: '300' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary.navy },
  calendarCard: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.gray400,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: Colors.accent.gold },
  dayNum: { fontSize: 14, color: Colors.neutral.gray700 },
  todayNum: { color: Colors.neutral.white, fontWeight: '700' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.semantic.error, marginTop: 1 },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Colors.neutral.gray500 },
  section: { paddingHorizontal: Spacing.screen },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.sm },
  noEvents: { color: Colors.neutral.gray400, fontSize: 14, textAlign: 'center', padding: Spacing.xl },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  eventColorBar: { width: 4, alignSelf: 'stretch' },
  eventInfo: { flex: 1, padding: Spacing.md },
  eventDate: { fontSize: 12, color: Colors.neutral.gray400, marginBottom: 2 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray800 },
  eventTitleTA: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, margin: Spacing.md, borderRadius: Radius.full },
  typeText: { fontSize: 11, fontWeight: '700' },
});
