import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BoxedIcon } from "../../components/common/AppIcon/AppIcon";
import { Colors } from "../../constants/colors";
import { Spacing, Radius, Shadow } from "../../constants/spacing";
import { Routes } from "../../constants/routes";
import { useAppSelector } from "../../hooks/useAppDispatch";
import { selectUser, selectChurch } from "../../store/slices/auth.slice";
import { useNotifications } from "../../hooks/useNotifications";
import { useAnnouncements } from "../../hooks/useAnnouncements";
import { useDailyMeta, useReadingTexts } from "../../hooks/useDailyReadings";
import {
  useLiveStream,
  useMassTimings,
  nextMass,
  startsIn,
  timingsForDay,
  upcomingSpecial,
  formatMassTime,
} from "../../hooks/useMass";
import { localDate } from "../../utils/massSchedule";
import type { AppLanguage } from "../../i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import TopSafeArea from "../../components/common/TopSafeArea/TopSafeArea";

const QUICK_ACTIONS = [
  // { icon: 'hand-heart-outline', labelKey: 'home.give_offering', route: Routes.GiveTab },
  { icon: "church", labelKey: "home.mass_timings", route: Routes.MassTab },
  // {
  //   icon: "certificate-outline",
  //   labelKey: "home.certificate_request",
  //   route: Routes.ProfileTab,
  // },
  {
    icon: "bullhorn-outline",
    labelKey: "home.club_events",
    route: Routes.Community,
  },
];

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "home.greeting_morning";
  if (h < 17) return "home.greeting_afternoon";
  if (h < 20) return "home.greeting_evening";
  return "home.greeting_night";
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const user = useAppSelector(selectUser);
  const church = useAppSelector(selectChurch);
  const { announcements } = useAnnouncements();
  const { unreadCount } = useNotifications();

  // Today's first reading (reference + text preview) from the real lectionary.
  const lang = (i18n.language as AppLanguage) ?? "en";
  const today = React.useMemo(() => new Date(), []);
  const dailyMeta = useDailyMeta(today);
  const firstReadingRef = dailyMeta.data?.readings.find((r) => r.type === "first");
  const dailyText = useReadingTexts(
    firstReadingRef ? [firstReadingRef] : undefined,
    lang,
    localDate(today),
    !!firstReadingRef,
  );
  const firstReadingText = dailyText.data?.first?.text;

  const displayAnnouncements = announcements;

  // Schedule-driven cards: the live stream, today's Masses and the next one.
  const { data: stream } = useLiveStream();
  const { data: timings } = useMassTimings();
  const upcoming = nextMass(timings);
  const todaysTimes = timingsForDay(timings, today.getDay())
    .concat(upcomingSpecial(timings).filter(m => m.specificDate!.slice(0, 10) === localDate(today)))
    .map(m => formatMassTime(m.time))
    .map(time => `${time.clock} ${time.meridiem}`);
  const feast = dailyMeta.data?.feastName ?? dailyMeta.data?.season;
  const firstName = user?.profile.firstName ?? "Friend";

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.navyDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuBtn}>
            <MaterialCommunityIcons
              name="menu"
              size={24}
              color={Colors.neutral.white}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>
              {t(getGreetingKey(), { name: firstName })}
            </Text>
            <Text style={styles.churchName}>
              {church?.name ?? t("home.your_parish")}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate(Routes.Notifications)}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={Colors.neutral.white}
          />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Live Banner — only while the parish is actually streaming */}
        {stream?.status === "live" && (
        <TouchableOpacity
          style={styles.liveBanner}
          onPress={() =>
            navigation.navigate(Routes.MassTab, {
              screen: Routes.LiveMass,
              initial: false,
              params: { videoId: stream.youtubeVideoId, title: stream.title },
            })
          }
        >
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t("home.live_now")}</Text>
          <Text style={styles.liveMassName} numberOfLines={1}> {stream.title}</Text>
          <View style={styles.liveJoinRow}>
            <Text style={styles.liveJoin}>{t("home.join")}</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={14}
              color={Colors.neutral.white}
            />
          </View>
        </TouchableOpacity>
        )}

        {/* Feast Day / Welcome Card */}
        <View style={styles.featureCard}>
          <View style={styles.featureCardInner}>
            <Text style={styles.feastLabel}>
              {(dailyMeta.data?.feastName ? t("home.today_feast") : "Today").toUpperCase()}
            </Text>
            {!!feast && <Text style={styles.feastName}>{feast}</Text>}
            <Text style={styles.feastDate}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.feastMass}>
              {todaysTimes.length
                ? `Mass today at ${todaysTimes.join(", ").replace(/, ([^,]*)$/, " & $1")}`
                : "No Mass scheduled today"}
            </Text>
            <TouchableOpacity
              style={styles.feastCta}
              onPress={() => navigation.navigate(Routes.MassTab)}
            >
              <Text style={styles.feastCtaText}>
                {t("home.view_mass_timings")}
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={15}
                color={Colors.accent.gold}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Mass */}
        {upcoming && (
        <View style={styles.nextMassCard}>
          <View style={styles.nextMassLeft}>
            <View style={styles.cardLabelRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={Colors.neutral.gray400}
              />
              <Text style={styles.nextMassLabel}>{t("home.next_mass")}</Text>
            </View>
            <Text style={styles.nextMassTitle}>{upcoming.mass.title}</Text>
            <Text style={styles.nextMassTime}>
              {formatMassTime(upcoming.mass.time).clock} {formatMassTime(upcoming.mass.time).meridiem}
              {upcoming.mass.venue ? ` · ${upcoming.mass.venue}` : ""}
            </Text>
          </View>
          <View style={styles.nextMassRight}>
            <Text style={styles.nextMassIn}>{startsIn(upcoming.at)}</Text>
          </View>
        </View>
        )}

        {/* Daily Reading */}
        <TouchableOpacity
          style={styles.readingCard}
          onPress={() =>
            navigation.navigate(Routes.BibleTab, { screen: Routes.DailyReading, initial: false })
          }
        >
          <View style={styles.cardLabelRow}>
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={14}
              color={Colors.neutral.gray400}
            />
            <Text style={styles.readingLabel}>{t("home.daily_reading")}</Text>
          </View>
          <Text style={styles.readingRef}>
            {firstReadingRef
              ? `First Reading: ${firstReadingRef.reference}`
              : dailyMeta.isLoading
              ? "Loading today's reading…"
              : "Today's Reading"}
          </Text>
          <Text style={styles.readingPreview} numberOfLines={2}>
            {firstReadingText ?? dailyMeta.data?.feastName ?? " "}
          </Text>
          <View style={styles.readMoreRow}>
            <Text style={styles.readMore}>{t("home.read_more")}</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={15}
              color={Colors.sky.blue}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t("home.quick_actions")}</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionTile}
              onPress={() => navigation.navigate(action.route)}
            >
              <BoxedIcon
                name={action.icon}
                size={24}
                boxSize={48}
                color={Colors.primary.navy}
                background={Colors.accent.goldPale}
                style={styles.actionIcon}
              />
              <Text style={styles.actionLabel}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Announcements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.announcements")}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(Routes.Announcements)}
          >
            <Text style={styles.seeAll}>{t("home.see_all")}</Text>
          </TouchableOpacity>
        </View>
        {displayAnnouncements.slice(0, 3).map((ann) => (
          <View
            key={ann._id}
            style={[
              styles.annCard,
              ann.priority === "high" && styles.annCardHigh,
            ]}
          >
            <View style={styles.annDot} />
            <View style={styles.annContent}>
              <Text style={styles.annTitle}>
                {lang === "ta" && ann.titleTA ? ann.titleTA : ann.title}
              </Text>
              <Text style={styles.annBody} numberOfLines={2}>
                {ann.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Donation Summary */}

        {/* <View style={styles.donationCard}>
          <View style={styles.donationRow}>
            <View>
              <Text style={styles.donationLabel}>
                {t("home.donation_summary", { year: new Date().getFullYear() })}
              </Text>
              <Text style={styles.donationAmount}>₹4,200</Text>
            </View>
            <TouchableOpacity
              style={styles.giveBtn}
              onPress={() => navigation.navigate(Routes.GiveTab)}
            >
              <Text style={styles.giveBtnText}>{t("home.give_now")}</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color={Colors.neutral.white}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: "42%" }]} />
          </View>
          <Text style={styles.progressLabel}>
            {t("home.annual_goal")}: ₹9,999
          </Text>
        </View> */}

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
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  menuBtn: { marginRight: Spacing.md },
  greeting: { fontSize: 17, fontWeight: "600", color: Colors.neutral.white },
  churchName: { fontSize: 12, color: Colors.sky.blueLight, marginTop: 2 },
  notifBtn: { position: "relative" },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.semantic.error,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  scroll: { flex: 1 },

  liveBanner: {
    backgroundColor: Colors.semantic.error,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
    paddingVertical: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  liveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },
  liveMassName: { color: "#fff", fontSize: 13, flex: 1 },
  liveJoin: { color: "#fff", fontWeight: "600", fontSize: 13, marginRight: 4 },
  liveJoinRow: { flexDirection: "row", alignItems: "center" },
  cardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  featureCard: {
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary.navy,
    overflow: "hidden",
    ...Shadow.md,
  },
  featureCardInner: {
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.gold,
  },
  feastLabel: {
    color: Colors.accent.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  feastName: {
    color: Colors.neutral.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  feastDate: { color: Colors.sky.blueLight, fontSize: 13, marginBottom: 6 },
  feastMass: { color: Colors.neutral.white, opacity: 0.8, fontSize: 13 },
  feastCta: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feastCtaText: { color: Colors.accent.gold, fontWeight: "600", fontSize: 13 },

  nextMassCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.gold,
    ...Shadow.sm,
  },
  nextMassLeft: { flex: 1 },
  nextMassLabel: { fontSize: 12, color: Colors.neutral.gray400 },
  nextMassTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary.navy,
  },
  nextMassTime: { fontSize: 13, color: Colors.neutral.gray500, marginTop: 2 },
  nextMassRight: { alignItems: "flex-end" },
  nextMassIn: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.semantic.success,
    marginBottom: 8,
  },
  remindBtn: {
    backgroundColor: Colors.accent.goldPale,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  remindText: {
    fontSize: 12,
    color: Colors.accent.goldDark,
    fontWeight: "600",
  },

  readingCard: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  readingLabel: { fontSize: 12, color: Colors.neutral.gray400 },
  readingRef: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary.navy,
    marginBottom: 6,
  },
  readingPreview: {
    fontSize: 14,
    color: Colors.neutral.gray600,
    lineHeight: 22,
    fontStyle: "italic",
  },
  readMore: { color: Colors.sky.blue, fontWeight: "600", fontSize: 13 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  seeAll: { color: Colors.sky.blue, fontSize: 13, fontWeight: "500" },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionTile: {
    width: "47.5%",
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.sm,
  },
  actionIcon: { marginBottom: 8 },
  actionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary.navy,
    textAlign: "center",
    lineHeight: 18,
  },

  annCard: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  annCardHigh: { borderLeftWidth: 3, borderLeftColor: Colors.accent.gold },
  annDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.gold,
    marginTop: 5,
    marginRight: Spacing.sm,
  },
  annContent: { flex: 1 },
  annTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.gray800,
    marginBottom: 4,
  },
  annBody: { fontSize: 13, color: Colors.neutral.gray500, lineHeight: 20 },

  donationCard: {
    backgroundColor: Colors.primary.navy,
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  donationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  donationLabel: { color: Colors.sky.blueLight, fontSize: 12, marginBottom: 4 },
  donationAmount: {
    color: Colors.neutral.white,
    fontSize: 28,
    fontWeight: "700",
  },
  giveBtn: {
    backgroundColor: Colors.accent.gold,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  giveBtnText: { color: Colors.neutral.white, fontWeight: "700", fontSize: 14 },
  progressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.accent.gold,
    borderRadius: 3,
  },
  progressLabel: { color: Colors.sky.blueLight, fontSize: 12 },
});
