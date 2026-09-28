import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BoxedIcon } from "../../components/common/AppIcon/AppIcon";
import { Colors } from "../../constants/colors";
import { Spacing, Radius, Shadow } from "../../constants/spacing";
import { Routes } from "../../constants/routes";
import Badge from "../../components/common/Badge/Badge";
import { SafeAreaView } from "react-native-safe-area-context";
import TopSafeArea from "../../components/common/TopSafeArea/TopSafeArea";
import {
  useMassTimings,
  useLiveStream,
  timingsForDay,
  upcomingSpecial,
  formatMassTime,
} from "../../hooks/useMass";
import { useAppSelector } from "../../hooks/useAppDispatch";
import { selectChurch } from "../../store/slices/auth.slice";
import {
  callParish,
  emailParish,
  openDirections,
} from "../../utils/contact";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MassHomeScreen() {
  const navigation = useNavigation<any>();
  const church = useAppSelector(selectChurch);
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);

  const timings = useMassTimings();
  const live = useLiveStream();
  const stream = live.data;
  const todayTimings = timingsForDay(timings.data, selectedDay);
  const special = upcomingSpecial(timings.data);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.navyDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mass</Text>
        <Text style={styles.headerSub}>{church?.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Live / upcoming stream */}
        {stream && (
          <TouchableOpacity
            style={styles.liveBanner}
            onPress={() =>
              navigation.navigate(Routes.LiveMass, {
                videoId: stream.youtubeVideoId,
                title: stream.title,
              })
            }
          >
            <View style={{ flex: 1 }}>
              <View style={styles.liveRow}>
                {stream.status === "live" && <View style={styles.livePulse} />}
                <Text style={styles.liveLabel}>
                  {stream.status === "live" ? "LIVE NOW" : "UPCOMING STREAM"}
                </Text>
              </View>
              <Text style={styles.liveMassName}>{stream.title}</Text>
              <View style={styles.liveWatchingRow}>
                <MaterialCommunityIcons
                  name={stream.status === "live" ? "youtube" : "clock-outline"}
                  size={14}
                  color={Colors.sky.blueLight}
                />
                <Text style={styles.liveWatching}>
                  {stream.status === "live"
                    ? "Watch on YouTube"
                    : new Date(stream.scheduledAt).toLocaleString("en-IN", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                </Text>
              </View>
            </View>
            <View style={styles.livePlayBtn}>
              <MaterialCommunityIcons
                name="play"
                size={26}
                color={Colors.neutral.white}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Day Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScrollOuter}
          contentContainerStyle={styles.dayScroll}
        >
          {DAYS.map((day, i) => {
            const isToday = i === today;
            const isSelected = i === selectedDay;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => setSelectedDay(i)}
              >
                <Text
                  style={[styles.dayText, isSelected && styles.dayTextActive]}
                >
                  {day}
                </Text>
                {isToday && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Mass Timings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedDay === today ? "Today" : DAYS[selectedDay]} — Mass
            Schedule
          </Text>
          {timings.isLoading ? (
            <View style={styles.noMass}>
              <Text style={styles.noMassText}>Loading the schedule…</Text>
            </View>
          ) : timings.isError ? (
            <TouchableOpacity style={styles.noMass} onPress={() => timings.refetch()}>
              <Text style={styles.noMassText}>Couldn't load the schedule. Tap to try again.</Text>
            </TouchableOpacity>
          ) : todayTimings.length === 0 ? (
            <View style={styles.noMass}>
              <Text style={styles.noMassText}>No mass scheduled</Text>
            </View>
          ) : (
            todayTimings.map((mass) => (
              <View key={mass._id} style={styles.massCard}>
                <View style={styles.massTimeCol}>
                  <Text style={styles.massTime}>{formatMassTime(mass.time).clock}</Text>
                  <Text style={styles.massMeridiem}>
                    {formatMassTime(mass.time).meridiem}
                  </Text>
                </View>
                <View style={styles.massInfo}>
                  <Text style={styles.massTitle}>{mass.title}</Text>
                  {!!mass.titleTA && <Text style={styles.massTitleTA}>{mass.titleTA}</Text>}
                  {/* <Text style={styles.massPriest}>Fr. {mass.priest?.replace('Fr. ', '')}</Text> */}
                  <View style={styles.venueRow}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={13}
                      color={Colors.neutral.gray400}
                    />
                    <Text style={styles.massVenue}>{mass.venue}</Text>
                  </View>
                </View>
                <View style={styles.massActions}>
                  <Badge
                    label={
                      mass.language === "ta"
                        ? "Tamil"
                        : mass.language === "en"
                        ? "English"
                        : "Bilingual"
                    }
                    variant={mass.language === "ta" ? "navy" : "gold"}
                    size="sm"
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Special Masses — one-off dated timings set by the parish */}
        {special.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Special Masses</Text>
          {special.map((m) => (
            <View key={m._id} style={[styles.massCard, styles.specialCard]}>
              <View style={styles.massTimeCol}>
                <Text style={styles.specialDate}>
                  {new Date(m.specificDate!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </Text>
              </View>
              <View style={styles.massInfo}>
                <Text style={styles.massTitle}>{m.title}</Text>
                <View style={styles.venueRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={13}
                    color={Colors.neutral.gray500}
                  />
                  <Text style={styles.massPriest}>
                    {formatMassTime(m.time).clock} {formatMassTime(m.time).meridiem}
                  </Text>
                </View>
                {!!m.venue && (
                <View style={styles.venueRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={13}
                    color={Colors.neutral.gray400}
                  />
                  <Text style={styles.massVenue}>{m.venue}</Text>
                </View>
                )}
              </View>
              {m.massType !== "regular" && (
                <Badge label={m.massType[0].toUpperCase() + m.massType.slice(1)} variant="gold" size="sm" />
              )}
            </View>
          ))}
        </View>
        )}

        {/* Contact */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => callParish(church?.contact?.phone)}
          >
            <BoxedIcon
              name="phone-outline"
              size={20}
              boxSize={44}
              style={styles.contactIcon}
            />
            <Text style={styles.contactLabel}>Call Office</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() =>
              emailParish(church?.contact?.email, "Parish enquiry")
            }
          >
            <BoxedIcon
              name="email-outline"
              size={20}
              boxSize={44}
              style={styles.contactIcon}
            />
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => openDirections(church)}
          >
            <BoxedIcon
              name="map-marker-outline"
              size={20}
              boxSize={44}
              style={styles.contactIcon}
            />
            <Text style={styles.contactLabel}>Directions</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
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
  headerTitle: { fontSize: 26, fontWeight: "700", color: Colors.neutral.white },
  headerSub: { fontSize: 13, color: Colors.sky.blueLight, marginTop: 2 },

  liveBanner: {
    backgroundColor: Colors.primary.navyLight,
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadow.md,
  },
  liveRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.error,
    marginRight: 6,
  },
  liveLabel: {
    color: Colors.semantic.error,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },
  liveMassName: {
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  liveWatching: { color: Colors.sky.blueLight, fontSize: 13 },
  liveWatchingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  livePlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  dayScrollOuter: { marginBottom: Spacing.xs },
  dayScroll: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    minWidth: 56,
  },
  dayPillActive: {
    backgroundColor: Colors.accent.gold,
    borderColor: Colors.accent.gold,
  },
  dayText: { fontSize: 13, color: Colors.neutral.gray600, fontWeight: "500" },
  dayTextActive: { color: Colors.neutral.white, fontWeight: "700" },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.gold,
    marginTop: 3,
  },

  section: { paddingHorizontal: Spacing.screen, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary.navy,
    marginBottom: Spacing.sm,
  },
  noMass: { padding: Spacing.xl, alignItems: "center" },
  noMassText: { color: Colors.neutral.gray400, fontSize: 14 },

  massCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  specialCard: { borderLeftWidth: 3, borderLeftColor: Colors.accent.gold },
  massTimeCol: {
    width: 56,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: Colors.neutral.gray200,
    marginRight: Spacing.md,
    paddingRight: Spacing.sm,
  },
  massTime: { fontSize: 18, fontWeight: "700", color: Colors.primary.navy },
  massMeridiem: { fontSize: 11, color: Colors.neutral.gray400 },
  specialDate: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.accent.goldDark,
    textAlign: "center",
  },
  massInfo: { flex: 1 },
  massTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.neutral.gray800,
    marginBottom: 2,
  },
  massTitleTA: { fontSize: 12, color: Colors.neutral.gray400, marginBottom: 4 },
  massPriest: { fontSize: 13, color: Colors.neutral.gray500 },
  massVenue: { fontSize: 12, color: Colors.neutral.gray400 },
  massActions: { alignItems: "flex-end", gap: Spacing.xs },
  remindBtn: { marginTop: Spacing.xs },

  contactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  contactBtn: { alignItems: "center", padding: Spacing.md },
  contactIcon: { marginBottom: 6 },
  contactLabel: {
    fontSize: 12,
    color: Colors.neutral.gray500,
    fontWeight: "500",
  },
});
