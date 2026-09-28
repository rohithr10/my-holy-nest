import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { signOut } from '../../utils/logout';
import { selectUser, selectChurch } from '../../store/slices/auth.slice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { useAdminStats, ago, inrShort } from '../../hooks/useAdmin';

const QUICK_MODULES = [
  { icon: 'church', label: 'Mass Schedule', sub: 'Timings & services', route: Routes.AdminMass },
  { icon: 'account-group-outline', label: 'Families', sub: 'Parish registry', route: Routes.AdminFamilies },
  { icon: 'cash-multiple', label: 'Donations', sub: 'Offerings & reports', route: Routes.AdminDonations },
  { icon: 'certificate-outline', label: 'Certificates', sub: 'Requests & issuing', route: Routes.AdminCertificates },
  { icon: 'swap-horizontal', label: 'Transfers', sub: 'Church transfers', route: Routes.AdminTransfers },
  { icon: 'bullhorn-outline', label: 'Announcements', sub: 'Notices & alerts', route: Routes.AdminAnnouncements },
];

const ACTIVITY_ICON: Record<string, string> = {
  certificate: 'certificate-outline',
  donation: 'cash-multiple',
  transfer: 'swap-horizontal',
};

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const user = useAppSelector(selectUser);
  const church = useAppSelector(selectChurch);

  const firstName = user?.profile?.firstName ?? 'Admin';
  const { data, isLoading, isError, refetch, isRefetching } = useAdminStats();
  const st = data?.stats;
  const stats = [
    { icon: 'account-group-outline', value: st ? st.totalFamilies.toLocaleString('en-IN') : '–', label: 'Families', sub: st ? `${st.totalMembers.toLocaleString('en-IN')} members` : '', color: Colors.primary.navy, bg: Colors.sky.blueLight },
    { icon: 'cash-multiple', value: st ? inrShort(st.donationsThisMonth) : '–', label: 'This Month', sub: st ? `${inrShort(st.donationsYearToDate)} this year` : '', color: Colors.semantic.success, bg: Colors.semantic.successBg },
    { icon: 'certificate-outline', value: st ? String(st.pendingCertificates) : '–', label: 'Pending Certs', sub: 'Awaiting review', color: Colors.semantic.warning, bg: Colors.semantic.warningBg },
    { icon: 'swap-horizontal', value: st ? String(st.pendingTransfers) : '–', label: 'Transfers', sub: 'In progress', color: Colors.sky.blue, bg: Colors.sky.bluePale },
  ];
  const activity = data?.activity ?? [];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerGreet}>Welcome, {firstName}</Text>
          <Text style={styles.headerSub}>{church?.name}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>{user?.role?.replace(/_/g, ' ').toUpperCase() ?? 'ADMIN'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityLabel="Logout"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="logout" style={styles.logoutIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
        {isError && (
          <Text style={styles.errorText}>Couldn't load the parish figures. Pull down to retry.</Text>
        )}
        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} style={[styles.statIcon, { color: s.color }]} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        {/* Quick Modules */}
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.modulesGrid}>
          {QUICK_MODULES.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={styles.moduleCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(m.route)}>
              <View style={styles.moduleIconBg}>
                <MaterialCommunityIcons name={m.icon} style={styles.moduleIcon} />
              </View>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleLabel}>{m.label}</Text>
                <Text style={styles.moduleSub}>{m.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" style={styles.moduleChevron} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {isLoading && <Text style={styles.activityTime}>Loading…</Text>}
          {!isLoading && !activity.length && (
            <View style={styles.activityRow}>
              <Text style={styles.activityTime}>Nothing yet — new requests and offerings will appear here.</Text>
            </View>
          )}
          {activity.map((a, i) => (
            <View
              key={i}
              style={[styles.activityRow, i < activity.length - 1 && styles.activityBorder]}>
              <View style={styles.activityIconBg}>
                <MaterialCommunityIcons name={ACTIVITY_ICON[a.type] ?? 'bell-outline'} style={styles.activityIcon} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>{a.text}</Text>
                <Text style={styles.activityTime}>{ago(a.at)}</Text>
              </View>
            </View>
          ))}
        </View>

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
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: { flex: 1, marginRight: Spacing.md },
  headerGreet: { fontSize: 22, fontWeight: '700', color: Colors.neutral.white },
  headerSub: { fontSize: 13, color: Colors.sky.blueLight, marginTop: 2 },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  roleText: { color: Colors.neutral.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { fontSize: 20, color: Colors.neutral.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.screen, gap: Spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statIcon: { fontSize: 20, color: Colors.primary.navy },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 13, color: Colors.neutral.gray700, fontWeight: '600' },
  statSub: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary.navy, paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  modulesGrid: { paddingHorizontal: Spacing.screen, gap: Spacing.sm, marginBottom: Spacing.lg },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  moduleIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.sky.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  moduleIcon: { fontSize: 24, color: Colors.primary.navy },
  moduleInfo: { flex: 1 },
  moduleLabel: { fontSize: 15, fontWeight: '600', color: Colors.primary.navy },
  moduleSub: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 1 },
  moduleChevron: { fontSize: 22, color: Colors.neutral.gray300 },
  activityCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.screen,
    ...Shadow.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityIcon: { fontSize: 18, color: Colors.primary.navy },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 14, color: Colors.neutral.gray700 },
  activityTime: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 2 },
  errorText: { fontSize: 13, color: Colors.semantic.error, paddingHorizontal: Spacing.screen, paddingTop: Spacing.md },
});
