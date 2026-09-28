import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Share, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import { useBibleChapter } from '../../hooks/useBible';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  selectBookmarks,
  selectFontSize,
  setFontSize,
  toggleBookmark,
} from '../../store/slices/bible.slice';
import { selectUser } from '../../store/slices/auth.slice';
import {
  LanguageToggle,
  ThemeToggle,
} from '../../components/common/BibleControls/BibleControls';
import type { AppLanguage } from '../../i18n';
import type { BibleStackParamList } from '../../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { pushBookmarkToggle } from '../../utils/bookmarkSync';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

type Props = NativeStackScreenProps<BibleStackParamList, typeof Routes.BibleReader>;

const FONT_SIZES = [14, 16, 18, 20, 22];

export default function BibleReaderScreen({ navigation, route }: Props) {
  const { book, bookId, chapter, numberOfChapters, verse } = route.params;
  const { i18n } = useTranslation();
  const lang = (i18n.language as AppLanguage) ?? 'en';
  const dispatch = useAppDispatch();
  const { theme } = useBibleTheme();

  const user = useAppSelector(selectUser);
  const bookmarks = useAppSelector(selectBookmarks);
  const storedFontSize = useAppSelector(selectFontSize);

  // Snap the persisted size onto the nearest step so A-/A+ stay in sync.
  const storedIdx = FONT_SIZES.findIndex(f => f >= storedFontSize);
  const [fontSizeIdx, setFontSizeIdx] = useState(
    storedIdx === -1 ? FONT_SIZES.length - 1 : storedIdx,
  );
  const fontSize = FONT_SIZES[fontSizeIdx];
  const [currentChapter, setCurrentChapter] = useState(chapter);

  // The chapter is fetched in the app language only — switching language with
  // the toggle re-fetches and replaces the text, rather than showing both.
  const primary = useBibleChapter(lang, bookId, currentChapter);

  const totalChapters = primary.data?.numberOfChapters ?? numberOfChapters ?? 1;
  const bookTitle = primary.data?.bookName ?? book;

  const changeFontSize = (next: number) => {
    setFontSizeIdx(next);
    dispatch(setFontSize(FONT_SIZES[next]));
  };

  /** Verse numbers bookmarked in the chapter currently on screen. */
  const bookmarkedVerses = useMemo(() => {
    const set = new Set<number>();
    bookmarks.forEach(b => {
      if (b.bookId === bookId && b.chapter === currentChapter) set.add(b.verse);
    });
    return set;
  }, [bookmarks, bookId, currentChapter]);

  const onToggleBookmark = (verseNum: number, text: string) => {
    const bookmark = {
      _id: `${bookId}-${currentChapter}-${verseNum}`,
      userId: user?._id ?? 'local',
      verseId: `${bookId}.${currentChapter}.${verseNum}`,
      book: bookTitle,
      bookId,
      numberOfChapters: totalChapters,
      chapter: currentChapter,
      verse: verseNum,
      text,
      createdAt: new Date().toISOString(),
    };
    dispatch(toggleBookmark(bookmark));
    pushBookmarkToggle(bookmark);
  };

  const shareVerse = async (verseNum: number, text: string) => {
    await Share.share({
      message: `${bookTitle} ${currentChapter}:${verseNum}\n\n"${text}"\n\n— Shared via My Holy Nest`,
    });
  };

  const bg = theme.dark ? theme.bg : Colors.neutral.white;
  const textColor = theme.text;
  const verseNumColor = theme.accent;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['left', 'right']}>
      <TopSafeArea color={bg} />
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />

      {/* Header — title only, so the controls get a full line below */}
      <View style={[styles.header, { backgroundColor: bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.dark ? Colors.neutral.white : Colors.primary.navy}
          />
        </TouchableOpacity>
        <View style={styles.titleBtn}>
          <Text
            style={[
              styles.headerBook,
              { color: theme.dark ? Colors.neutral.white : Colors.primary.navy },
            ]}
            numberOfLines={1}>
            {bookTitle}
          </Text>
          <Text style={[styles.headerChapter, { color: theme.textMuted }]}>
            Chapter {currentChapter} / {totalChapters}
          </Text>
        </View>
      </View>

      {/* Controls — font size on the left, language + light/dark on the right */}
      <View style={[styles.controls, { backgroundColor: bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => changeFontSize(Math.max(0, fontSizeIdx - 1))}
          style={styles.fontBtn}>
          <Text style={[styles.fontBtnText, { color: textColor }]}>A-</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>{fontSize}px</Text>
        <TouchableOpacity
          onPress={() =>
            changeFontSize(Math.min(FONT_SIZES.length - 1, fontSizeIdx + 1))
          }
          style={styles.fontBtn}>
          <Text style={[styles.fontBtnText, { color: textColor }]}>A+</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <LanguageToggle variant="onSurface" />
        <ThemeToggle variant="onSurface" />
      </View>

      <ScrollView style={[styles.scroll, { backgroundColor: bg }]}>
        <View style={styles.chapterHeader}>
          <Text style={[styles.chapterNum, { color: verseNumColor }]}>{currentChapter}</Text>
        </View>

        {primary.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent.gold} />
          </View>
        ) : primary.isError ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="wifi-off" size={40} color={Colors.neutral.gray400} />
            <Text style={[styles.stateText, { color: textColor }]}>Couldn't load this chapter.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => primary.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (primary.data?.verses ?? []).map(v => {
            const isBookmarked = bookmarkedVerses.has(v.number);
            const isTarget = verse === v.number;
            return (
              <TouchableOpacity
                key={v.number}
                style={[
                  styles.verseRow,
                  { borderBottomColor: theme.border },
                  isTarget && { backgroundColor: theme.surfaceAlt },
                ]}
                activeOpacity={0.6}
                onLongPress={() => shareVerse(v.number, v.text)}>
                <Text style={[styles.verseNum, { color: verseNumColor, fontSize: fontSize - 4 }]}>
                  {v.number}
                </Text>
                <View style={styles.verseContent}>
                  <Text style={[styles.verseText, { fontSize, color: textColor }]}>{v.text}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onToggleBookmark(v.number, v.text)}
                  style={styles.bookmarkBtn}
                  hitSlop={6}>
                  <MaterialCommunityIcons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={isBookmarked ? Colors.accent.gold : theme.textMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* Chapter Navigation */}
        {!primary.isLoading && !primary.isError && (
          <View style={styles.chapterNav}>
            <TouchableOpacity
              style={[styles.chapterNavBtn, currentChapter <= 1 && styles.chapterNavBtnDisabled]}
              onPress={() => currentChapter > 1 && setCurrentChapter(c => c - 1)}
              disabled={currentChapter <= 1}>
              <Text style={styles.chapterNavText}><MaterialCommunityIcons name="arrow-left" size={13} /> Ch {currentChapter - 1}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chapterNavBtn, currentChapter >= totalChapters && styles.chapterNavBtnDisabled]}
              onPress={() => currentChapter < totalChapters && setCurrentChapter(c => c + 1)}
              disabled={currentChapter >= totalChapters}>
              <Text style={styles.chapterNavText}>Ch {currentChapter + 1} <MaterialCommunityIcons name="arrow-right" size={13} /></Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: 10,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  titleBtn: { flex: 1 },
  headerBook: { fontSize: 17, fontWeight: '700' },
  headerChapter: { fontSize: 13, marginTop: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: 8,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  fontBtn: { padding: 4 },
  fontBtnText: { fontSize: 15, fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: Spacing.screen },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  stateText: { marginTop: Spacing.sm, fontSize: 14 },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  retryText: { color: Colors.neutral.white, fontWeight: '700' },
  chapterHeader: { alignItems: 'center', paddingVertical: Spacing.xl },
  chapterNum: { fontSize: 64, fontWeight: '700' },
  verseRow: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  verseNum: { width: 32, fontWeight: '700', marginTop: 2 },
  verseContent: { flex: 1 },
  verseText: { lineHeight: 28 },
  bookmarkBtn: { padding: 4 },
  chapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  chapterNavBtn: {
    flex: 1,
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent.gold + '40',
  },
  chapterNavBtnDisabled: { opacity: 0.4 },
  chapterNavText: { color: Colors.accent.goldDark, fontWeight: '600', fontSize: 14 },
});
