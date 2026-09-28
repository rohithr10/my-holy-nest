import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { formatAnnouncementDate } from '../../constants/announcements';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  // Loads from the API and shares the result with Home and the Admin screen,
  // so anything published from the parish dashboard shows up here.
  const { announcements, isLoading, isRefetching, refetch } = useAnnouncements();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" style={styles.backIcon} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 32 }} />
      </View>
      <FlatList
        data={announcements}
        keyExtractor={a => a._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary.navy}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading announcements…' : 'No announcements yet.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.priority === 'high' && styles.cardHigh]}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityDot, item.priority === 'high' ? styles.dotHigh : styles.dotNormal]} />
              <Text style={styles.date}>
                {formatAnnouncementDate(item.publishedAt)}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.titleTA && <Text style={styles.titleTA}>{item.titleTA}</Text>}
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary.navy, paddingHorizontal: Spacing.screen, paddingVertical: 14 },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  list: { padding: Spacing.screen },
  card: { backgroundColor: Colors.neutral.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardHigh: { borderLeftWidth: 3, borderLeftColor: Colors.accent.gold },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.xs },
  dotHigh: { backgroundColor: Colors.accent.gold },
  dotNormal: { backgroundColor: Colors.neutral.gray300 },
  date: { fontSize: 11, color: Colors.neutral.gray400 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy, marginBottom: 2 },
  titleTA: { fontSize: 12, color: Colors.neutral.gray400, marginBottom: Spacing.xs },
  content: { fontSize: 13, color: Colors.neutral.gray600, lineHeight: 20 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.neutral.gray400 },
});
