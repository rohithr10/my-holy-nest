import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { removeBookmark, selectBookmarks } from '../../store/slices/bible.slice';
import { pushBookmarkRemoval } from '../../utils/bookmarkSync';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { ThemeToggle } from '../../components/common/BibleControls/BibleControls';
import type { Bookmark } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

function savedAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function BookmarksScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const bookmarks = useAppSelector(selectBookmarks);
  const { theme } = useBibleTheme();

  // Tapping a bookmark expands it to the full verse instead of the 3-line
  // preview, and reveals the action to open it in the reader.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const deleteBookmark = (item: Bookmark) => {
    Alert.alert('Remove Bookmark', 'Remove this verse from bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          dispatch(removeBookmark(item._id));
          pushBookmarkRemoval(item);
        },
      },
    ]);
  };

  const openInReader = (item: Bookmark) => {
    navigation.navigate(Routes.BibleReader, {
      book: item.book,
      bookId: item.bookId ?? item.book,
      chapter: item.chapter,
      numberOfChapters: item.numberOfChapters,
      verse: item.verse,
    });
  };

  const header = (
    <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
        <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bookmarks</Text>
      <View style={styles.headerRight}>
        {bookmarks.length > 0 && (
          <Text style={styles.count}>{bookmarks.length}</Text>
        )}
        <ThemeToggle variant="onDark" />
      </View>
    </View>
  );

  if (bookmarks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.bg }]}
        edges={['left', 'right']}>
        <TopSafeArea color={theme.headerBg} />
        <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
        {header}
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bookmark-outline" style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, theme.dark && { color: theme.text }]}>
            No Bookmarks Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Tap the bookmark icon next to any verse while reading to save it here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <TopSafeArea color={theme.headerBg} />
      {header}

      <FlatList
        data={bookmarks}
        keyExtractor={i => i._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const expanded = expandedId === item._id;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface }]}
              activeOpacity={0.8}
              onPress={() => setExpandedId(expanded ? null : item._id)}>
              <View style={styles.cardHeader}>
                <Text style={styles.ref}>
                  {item.book} {item.chapter}:{item.verse}
                </Text>
                <View style={styles.headerRight}>
                  <Text style={[styles.date, { color: theme.textMuted }]}>
                    {savedAgo(item.createdAt)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteBookmark(item)}
                    style={styles.deleteBtn}
                    hitSlop={6}>
                    <Text style={[styles.deleteIcon, { color: theme.textMuted }]}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text
                style={[styles.verse, { color: theme.dark ? theme.text : Colors.neutral.gray700 }]}
                numberOfLines={expanded ? undefined : 3}>
                "{item.text}"
              </Text>
              {expanded && (
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => openInReader(item)}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={15}
                    color={Colors.accent.goldDark}
                  />
                  <Text style={styles.openBtnText}>
                    Open {item.book} {item.chapter}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  count: {
    backgroundColor: Colors.accent.gold,
    color: Colors.neutral.white,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  list: { padding: Spacing.screen },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.gold,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  ref: { fontSize: 14, fontWeight: '700', color: Colors.accent.goldDark },
  date: { fontSize: 12, color: Colors.neutral.gray400 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 20, color: Colors.neutral.gray400 },
  verse: { fontSize: 14, color: Colors.neutral.gray700, lineHeight: 22, fontStyle: 'italic' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent.goldPale,
    borderWidth: 1,
    borderColor: Colors.accent.gold + '55',
  },
  openBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accent.goldDark },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.lg, color: Colors.neutral.gray300 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: 14, color: Colors.neutral.gray500, textAlign: 'center', lineHeight: 22 },
});
