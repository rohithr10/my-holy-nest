import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Dimensions, Image, Modal, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useGallery } from '../../hooks/useCommunity';
import type { MediaItem } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.xs * 2) / 3;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type TabType = 'albums' | 'photos';

interface Album {
  key: string;
  title: string;
  items: MediaItem[];
}

/** Albums are the parish's uploads grouped by month (or year when no month). */
function toAlbums(items: MediaItem[]): Album[] {
  const map = new Map<string, Album>();
  for (const m of items) {
    const key = `${m.year}-${m.month ?? 0}`;
    const title = m.month ? `${MONTHS[m.month - 1]} ${m.year}` : String(m.year);
    const album = map.get(key) ?? { key, title, items: [] };
    album.items.push(m);
    map.set(key, album);
  }
  return [...map.values()];
}

export default function GalleryScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<TabType>('albums');
  const [album, setAlbum] = useState<Album | null>(null);
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const { data, isLoading, isError, refetch, isRefetching } = useGallery();
  const items = data ?? [];
  const albums = toAlbums(items);
  const photos = album ? album.items : items;

  const open = (m: MediaItem) => {
    if (m.type === 'video') Linking.openURL(m.url);
    else setViewing(m);
  };

  const empty = (
    <EmptyState
      icon="image-multiple-outline"
      title={isError ? "Couldn't load the gallery" : 'No photos yet'}
      subtitle={isError ? 'Check your connection and try again.' : 'Photos the parish shares will appear here.'}
      actionLabel={isError ? 'Try again' : undefined}
      onAction={isError ? () => refetch() : undefined}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (album ? setAlbum(null) : navigation.goBack())}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{album ? album.title : 'Gallery'}</Text>
        <View style={{ width: 32 }} />
      </View>

      {!album && (
        <View style={styles.tabRow}>
          {(['albums', 'photos'] as TabType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : tab === 'albums' && !album ? (
        <FlatList
          data={albums}
          keyExtractor={a => a.key}
          contentContainerStyle={styles.albumList}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={empty}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.albumCard} onPress={() => setAlbum(item)}>
              <Image source={{ uri: item.items[0].thumbnailUrl }} style={styles.albumCover} />
              <Text style={styles.albumTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.albumCount}>
                {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
              </Text>
            </TouchableOpacity>
          )}
          numColumns={2}
        />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={p => p._id}
          numColumns={3}
          contentContainerStyle={styles.photoGrid}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={empty}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.photoItem}
              accessibilityLabel={item.title ?? (item.type === 'video' ? 'Video' : 'Photo')}
              onPress={() => open(item)}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.photoBg} />
              {item.type === 'video' && (
                <MaterialCommunityIcons name="play-circle" style={styles.videoBadge} />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={styles.viewer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewing(null)} accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={28} color={Colors.neutral.white} />
          </TouchableOpacity>
          {viewing && (
            <>
              <Image source={{ uri: viewing.url }} style={styles.viewerImage} resizeMode="contain" />
              {!!viewing.title && <Text style={styles.viewerTitle}>{viewing.title}</Text>}
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary.navy, paddingHorizontal: Spacing.screen, paddingVertical: 14 },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', padding: Spacing.screen, gap: Spacing.sm },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: Colors.neutral.white, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.neutral.gray200 },
  tabBtnActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray500 },
  tabTextActive: { color: Colors.neutral.white },
  albumList: { padding: Spacing.screen },
  albumCard: { width: '48%', backgroundColor: Colors.neutral.white, borderRadius: Radius.lg, marginBottom: Spacing.sm, marginRight: '2%', overflow: 'hidden', ...Shadow.sm },
  albumCover: { height: 120, width: '100%', backgroundColor: Colors.primary.navyLight },
  albumTitle: { fontSize: 13, fontWeight: '600', color: Colors.primary.navy, padding: Spacing.sm, paddingBottom: 2 },
  albumCount: { fontSize: 11, color: Colors.neutral.gray400, paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
  photoGrid: { padding: Spacing.screen },
  photoItem: { margin: Spacing.xs / 2 },
  photoBg: { width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: Colors.primary.navyLight, borderRadius: Radius.md },
  videoBadge: { position: 'absolute', right: 6, bottom: 6, fontSize: 24, color: Colors.neutral.white },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 48, right: 20, zIndex: 1, padding: 8 },
  viewerImage: { width: '100%', height: '75%' },
  viewerTitle: { color: Colors.neutral.white, fontSize: 15, textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.screen },
});
