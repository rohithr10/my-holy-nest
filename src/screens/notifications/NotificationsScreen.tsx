import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { useNotifications } from '../../hooks/useNotifications';
import type { AppNotification, NotificationType } from '../../types';

const TYPE_META: Record<
  NotificationType,
  { icon: string; color: string; bg: string }
> = {
  announcement: { icon: 'bullhorn-outline', color: Colors.primary.navy, bg: Colors.sky.blueLight },
  mass: { icon: 'church', color: Colors.accent.goldDark, bg: Colors.accent.goldPale },
  donation: { icon: 'cash-multiple', color: Colors.semantic.success, bg: Colors.semantic.successBg },
  certificate: { icon: 'certificate-outline', color: Colors.semantic.warning, bg: Colors.semantic.warningBg },
  transfer: { icon: 'swap-horizontal', color: Colors.sky.blue, bg: Colors.sky.bluePale },
  community: { icon: 'account-group-outline', color: Colors.primary.navyLight, bg: Colors.sky.blueLight },
  general: { icon: 'bell-outline', color: Colors.neutral.gray600, bg: Colors.neutral.gray100 },
};

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

/**
 * Screens that live inside a tab's stack can't be reached by name from the
 * drawer, so route them through their tab.
 */
const NESTED: Record<string, { tab: string }> = {
  [Routes.Certificates]: { tab: Routes.ProfileTab },
  [Routes.ChurchTransfer]: { tab: Routes.ProfileTab },
  [Routes.FamilyCard]: { tab: Routes.ProfileTab },
  [Routes.DonationHistory]: { tab: Routes.GiveTab },
  [Routes.MassHome]: { tab: Routes.MassTab },
};

function openRoute(navigation: any, route: string) {
  const nested = NESTED[route];
  if (nested) {
    // initial: false keeps the tab's own first screen underneath, so Back
    // returns to it instead of leaving the tab.
    navigation.navigate('MainTabs', { screen: nested.tab, params: { screen: route, initial: false } });
  } else {
    navigation.navigate(route);
  }
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefetching,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handlePress = (item: AppNotification) => {
    markAsRead(item._id);
    if (item.route) openRoute(navigation, item.route);
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const meta = TYPE_META[item.type] ?? TYPE_META.general;
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}>
        <View style={[styles.iconBg, { backgroundColor: meta.bg }]}>
          <MaterialCommunityIcons name={meta.icon} style={[styles.icon, { color: meta.color }]} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent.gold} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n._id}
          renderItem={renderItem}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : styles.list
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Colors.accent.gold]}
              tintColor={Colors.accent.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBg}>
                <MaterialCommunityIcons name="bell-off-outline" style={styles.emptyIcon} />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptyText}>
                New parish updates, mass changes and reminders will appear here.
              </Text>
            </View>
          }
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
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
  },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  headerSub: { color: Colors.sky.blueLight, fontSize: 12, marginTop: 1 },
  markAll: { color: Colors.accent.goldLight, fontSize: 13, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: Spacing.screen, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardUnread: {
    backgroundColor: Colors.sky.blueLight,
    borderWidth: 1,
    borderColor: Colors.sky.bluePale,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.neutral.gray700 },
  titleUnread: { color: Colors.primary.navy, fontWeight: '700' },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.semantic.info,
    marginLeft: Spacing.sm,
  },
  body: { fontSize: 13, color: Colors.neutral.gray500, marginTop: 3, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 6 },

  emptyList: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.neutral.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyIcon: { fontSize: 40, color: Colors.neutral.gray400 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary.navy, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.neutral.gray500, textAlign: 'center', lineHeight: 20 },
});
