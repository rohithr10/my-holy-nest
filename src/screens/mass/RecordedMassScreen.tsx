import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, TextInput, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useRecordedMasses } from '../../hooks/useMass';

export default function RecordedMassScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useRecordedMasses();

  const q = search.trim().toLowerCase();
  const filtered = (data ?? []).filter(v => !q || v.title.toLowerCase().includes(q));

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recorded Masses</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search masses..."
          placeholderTextColor={Colors.neutral.gray400}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="video-off-outline"
            title={isError ? "Couldn't load recordings" : q ? 'No recordings match your search' : 'No recorded Masses yet'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate(Routes.LiveMass, { videoId: item.youtubeVideoId, title: item.title })}>
            <View style={styles.thumbnail}>
              <Image
                source={{ uri: item.thumbnailUrl ?? `https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg` }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <MaterialCommunityIcons name="play" style={styles.playIcon} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  <MaterialCommunityIcons name="calendar-outline" size={13} />{' '}
                  {new Date(item.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    margin: Spacing.screen,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.xs , color: Colors.neutral.gray400},
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.neutral.gray800 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  filterPillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  filterText: { fontSize: 13, color: Colors.neutral.gray500 },
  filterTextActive: { color: Colors.neutral.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  thumbnail: {
    width: 110,
    height: 88,
    backgroundColor: Colors.primary.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playIcon: { color: Colors.neutral.white, fontSize: 28 },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  cardInfo: { flex: 1, padding: Spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray800, marginBottom: 2 },
  cardTitleTA: { fontSize: 12, color: Colors.neutral.gray400, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: Colors.neutral.gray500 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontSize: 11, color: Colors.neutral.gray400 },
  cardViews: { fontSize: 11, color: Colors.neutral.gray400 },
});
