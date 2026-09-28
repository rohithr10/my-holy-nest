import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Colors } from "../../constants/colors";
import { Spacing, Radius, Shadow } from "../../constants/spacing";
import { Routes } from "../../constants/routes";
import {
  NT_BOOK_IDS,
  DEUTEROCANONICAL_BOOKS,
} from "../../constants/bible";
import { useBibleBooks } from "../../hooks/useBible";
import { useDailyMeta, useReadingTexts } from "../../hooks/useDailyReadings";
import type { AppLanguage } from "../../i18n";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import TopSafeArea from "../../components/common/TopSafeArea/TopSafeArea";
import { BibleControls } from "../../components/common/BibleControls/BibleControls";
import { useBibleTheme } from "../../hooks/useBibleTheme";

const CARD_WIDTH =
  (Dimensions.get("window").width - Spacing.screen * 2 - Spacing.xs * 2) / 3;

const TRANSLATION_LABEL: Record<AppLanguage, string> = {
  en: "Berean Standard Bible",
  ta: "தமிழ் திருத்தப்பட்ட பதிப்பு (IRV)",
};

export default function BibleHomeScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as AppLanguage) ?? "en";
  const { theme } = useBibleTheme();

  const [tab, setTab] = useState<"OT" | "NT">("OT");
  const [search, setSearch] = useState("");

  const { data: books, isLoading, isError, refetch } = useBibleBooks(lang);

  // Today's real lectionary reading for the banner.
  const today = useMemo(() => new Date(), []);
  const dailyMeta = useDailyMeta(today);
  const firstRef = dailyMeta.data?.readings.find((r) => r.type === "first");
  const gospelRef = dailyMeta.data?.readings.find((r) => r.type === "gospel");
  const dailyText = useReadingTexts(
    firstRef ? [firstRef] : undefined,
    lang,
    today.toISOString().slice(0, 10),
    !!firstRef,
  );
  const bannerRefs = [firstRef?.reference, gospelRef?.reference]
    .filter(Boolean)
    .join(" · ");
  const bannerPreview = dailyText.data?.first?.text;

  const { otBooks, ntBooks } = useMemo(() => {
    const ot = (books ?? []).filter((b) => !NT_BOOK_IDS.has(b.id));
    const nt = (books ?? []).filter((b) => NT_BOOK_IDS.has(b.id));
    return { otBooks: ot, ntBooks: nt };
  }, [books]);

  const activeBooks = tab === "OT" ? otBooks : ntBooks;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? activeBooks.filter((b) => b.name.toLowerCase().includes(q))
    : activeBooks;

  // Deuterocanonical books aren't in the free translation — show them disabled
  // in the OT tab so the Catholic canon is still represented.
  const showDeutero = tab === "OT" && !q;
  const deuteroLabel = (b: { name: string; nameTA: string }) =>
    lang === "ta" ? b.nameTA : b.name;

  const openBook = (bookId: string, name: string, numberOfChapters: number) =>
    navigation.navigate(Routes.BibleReader, {
      book: name,
      bookId,
      chapter: 1,
      numberOfChapters,
    });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={["left", "right"]}
    >
      <TopSafeArea color={theme.headerBg} />
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />

      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {t("bible.title", "Holy Bible")}
            </Text>
            <Text style={styles.headerSub}>{TRANSLATION_LABEL[lang]}</Text>
          </View>
          <BibleControls variant="onDark" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Daily Reading Banner */}
        <TouchableOpacity
          style={styles.dailyBanner}
          onPress={() => navigation.navigate(Routes.DailyReading)}
        >
          <View style={styles.dailyLeft}>
            <Text style={styles.dailyLabel}>
              {t("bible.todays_reading", "TODAY'S READING")}
            </Text>
            <Text style={styles.dailyRef}>
              {bannerRefs || (dailyMeta.isLoading ? "Loading…" : "Tap to read")}
            </Text>
            <Text style={styles.dailyPreview} numberOfLines={2}>
              {bannerPreview ?? dailyMeta.data?.feastName ?? " "}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            style={styles.dailyArrow}
          />
        </TouchableOpacity>

        {/* Quick Access */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate(Routes.Bookmarks)}
          >
            <MaterialCommunityIcons
              name="bookmark-outline"
              style={[styles.quickIcon, { color: theme.accent }]}
            />
            <Text style={[styles.quickLabel, { color: theme.textMuted }]}>
              {t("bible.bookmarks", "Bookmarks")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface }]}
            onPress={() =>
              ntBooks[3] &&
              openBook("JHN", ntBooks[3].name, ntBooks[3].numberOfChapters)
            }
          >
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              style={[styles.quickIcon, { color: theme.accent }]}
            />
            <Text style={[styles.quickLabel, { color: theme.textMuted }]}>
              {t("bible.gospels", "Gospels")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface }]}
            onPress={() =>
              otBooks.find((b) => b.id === "PSA") &&
              openBook(
                "PSA",
                otBooks.find((b) => b.id === "PSA")!.name,
                otBooks.find((b) => b.id === "PSA")!.numberOfChapters,
              )
            }
          >
            <MaterialCommunityIcons
              name="music-clef-treble"
              style={[styles.quickIcon, { color: theme.accent }]}
            />
            <Text style={[styles.quickLabel, { color: theme.textMuted }]}>
              {t("bible.psalms", "Psalms")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons
            name="magnify"
            style={[styles.searchIcon, { color: theme.textMuted }]}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t("bible.search_book", "Search book...")}
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* OT / NT Toggle */}
        <View style={styles.tabRow}>
          {(["OT", "NT"] as const).map((tb) => (
            <TouchableOpacity
              key={tb}
              style={[
                styles.tab,
                { backgroundColor: theme.surface, borderColor: theme.border },
                tab === tb && styles.tabActive,
              ]}
              onPress={() => setTab(tb)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.textMuted },
                  tab === tb && styles.tabTextActive,
                ]}
              >
                {tb === "OT"
                  ? t("bible.old_testament", "Old Testament")
                  : t("bible.new_testament", "New Testament")}
              </Text>
              <Text
                style={[
                  styles.tabCount,
                  { color: theme.textMuted },
                  tab === tb && styles.tabTextActive,
                ]}
              >
                {tb === "OT"
                  ? `${otBooks.length}${showDeutero ? "+7" : ""} books`
                  : `${ntBooks.length} books`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* States */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent.gold} />
            <Text style={[styles.stateText, { color: theme.textMuted }]}>
              Loading books…
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={40}
              color={Colors.neutral.gray400}
            />
            <Text style={[styles.stateText, { color: theme.textMuted }]}>
              Couldn't load the Bible.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookGrid}>
            {filtered.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[styles.bookCard, { backgroundColor: theme.surface }]}
                onPress={() =>
                  openBook(book.id, book.name, book.numberOfChapters)
                }
              >
                <Text
                  style={[
                    styles.bookName,
                    { color: theme.dark ? theme.text : Colors.primary.navy },
                  ]}
                  numberOfLines={2}
                >
                  {book.name}
                </Text>
                <Text style={[styles.bookChapters, { color: theme.textMuted }]}>
                  {book.numberOfChapters} ch
                </Text>
              </TouchableOpacity>
            ))}

            {/* Deuterocanonical books — not in the free translation yet */}
            {showDeutero &&
              DEUTEROCANONICAL_BOOKS.map((book) => (
                <View
                  key={book.name}
                  style={[
                    styles.bookCard,
                    styles.bookCardDisabled,
                    { backgroundColor: theme.surfaceAlt },
                  ]}
                >
                  <Text
                    style={[styles.bookName, styles.bookNameDisabled]}
                    numberOfLines={2}
                  >
                    {deuteroLabel(book)}
                  </Text>
                  <Text style={styles.soonBadge}>soon</Text>
                </View>
              ))}
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
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: Colors.neutral.white },
  headerSub: { fontSize: 13, color: Colors.sky.blueLight, marginTop: 2 },

  dailyBanner: {
    backgroundColor: Colors.primary.navyLight,
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...Shadow.md,
  },
  dailyLeft: { flex: 1 },
  dailyLabel: {
    color: Colors.accent.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  dailyRef: {
    color: Colors.neutral.white,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  dailyPreview: {
    color: Colors.sky.blueLight,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
  },
  dailyArrow: {
    color: Colors.accent.gold,
    fontSize: 28,
    fontWeight: "300",
    marginLeft: Spacing.sm,
  },

  quickRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.sm,
  },
  quickIcon: { fontSize: 24, marginBottom: 6, color: Colors.primary.navy },
  quickLabel: {
    fontSize: 12,
    color: Colors.neutral.gray600,
    fontWeight: "500",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.screen,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
    color: Colors.neutral.gray400,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.neutral.gray800,
  },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray200,
  },
  tabActive: {
    backgroundColor: Colors.accent.gold,
    borderColor: Colors.accent.gold,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.neutral.gray500 },
  tabTextActive: { color: Colors.neutral.white },
  tabCount: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 2 },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  stateText: {
    marginTop: Spacing.sm,
    color: Colors.neutral.gray500,
    fontSize: 14,
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  retryText: { color: Colors.neutral.white, fontWeight: "700" },

  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.screen,
    gap: Spacing.xs,
  },
  bookCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 68,
    ...Shadow.sm,
  },
  bookCardDisabled: {
    backgroundColor: Colors.neutral.gray100,
    ...Shadow.sm,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary.navy,
    textAlign: "center",
  },
  bookNameDisabled: { color: Colors.neutral.gray400 },
  bookChapters: {
    fontSize: 10,
    color: Colors.neutral.gray400,
    marginTop: 3,
  },
  soonBadge: {
    fontSize: 9,
    color: Colors.accent.goldDark,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 3,
  },
});
