import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectUser, selectChurch } from '../../store/slices/auth.slice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { churchApi } from '../../api/church.api';
import { useMyFamily, fullName } from '../../hooks/useFamily';

export default function FamilyCardScreen() {
  const navigation = useNavigation<any>();
  const user = useAppSelector(selectUser);
  const church = useAppSelector(selectChurch);
  const { family, memberCount, isLoading, isError, refetch, isRefetching } = useMyFamily();

  // The card shows the diocese by name; churches only carry its id.
  const { data: dioceses } = useQuery({
    queryKey: ['dioceses'],
    queryFn: async () => (await churchApi.getDioceses()).data.data,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const dioceseName = dioceses?.find(d => d._id === church?.dioceseId)?.name;

  if (isLoading) return <LoadingSpinner fullScreen label="Loading your family card…" />;

  const head = family?.members.find(m => m.relation === 'head');
  const headName = fullName(head) || fullName(user?.profile);
  const address = family
    ? [family.address.street, family.address.area, family.address.city].filter(Boolean).join(', ') +
      (family.address.pincode ? ` — ${family.address.pincode}` : '')
    : '';
  const since = family ? new Date(family.registeredAt).getFullYear() : undefined;
  const status = family?.isActive === false ? 'Inactive' : 'Active';

  const shareCard = async () => {
    if (!family) return;
    await Share.share({
      message: `My Holy Nest family card ${family.cardNumber}\n${family.familyName}\n${church?.name ?? ''}`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.warmWhite} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Card</Text>
        <TouchableOpacity onPress={shareCard} disabled={!family}>
          <MaterialCommunityIcons name="arrow-up" style={styles.shareIcon} />
        </TouchableOpacity>
      </View>

      {!family ? (
        <EmptyState
          icon="card-account-details-outline"
          title={isError ? "Couldn't load your family card" : 'No family card yet'}
          subtitle={
            isError
              ? 'Check your connection and try again.'
              : 'Your account is not linked to a family card. Please contact the parish office.'
          }
          actionLabel={isError ? (isRefetching ? 'Retrying…' : 'Try again') : undefined}
          onAction={isError ? () => refetch() : undefined}
        />
      ) : (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Physical-style Card */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.churchNameCard}>{church?.name}</Text>
              {!!church?.nameTA && <Text style={styles.churchTA}>{church.nameTA}</Text>}
              {!!dioceseName && <Text style={styles.diocese}>{dioceseName}</Text>}
            </View>
            <MaterialCommunityIcons name="cross" style={styles.crossIcon} />
          </View>

          <View style={styles.cardDivider} />

          {/* Family Info */}
          <View style={styles.cardBody}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{family.familyName[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>{family.familyName}</Text>
              {!!headName && <Text style={styles.headName}>Head: {headName}</Text>}
              <Text style={styles.members}><MaterialCommunityIcons name="account-group-outline" size={13} /> {memberCount} {memberCount === 1 ? 'Member' : 'Members'}</Text>
            </View>
          </View>

          {/* Card Details */}
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-outline" style={styles.detailIcon} />
              <Text style={styles.detailText}>{address}</Text>
            </View>
            {!!user?.phone && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone-outline" style={styles.detailIcon} />
                <Text style={styles.detailText}>+91 {user.phone}</Text>
              </View>
            )}
            {!!since && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar-outline" style={styles.detailIcon} />
                <Text style={styles.detailText}>Registered {since}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardDivider} />

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardIdLabel}>FAMILY CARD NO.</Text>
              <Text style={styles.cardId}>{family.cardNumber}</Text>
            </View>
            <View style={[styles.statusBadge, status === 'Active' ? styles.statusActive : styles.statusInactive]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate(Routes.Members)}>
            <MaterialCommunityIcons name="account-group-outline" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Members</Text>
            <Text style={styles.actionCount}>{memberCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate(Routes.Certificates)}>
            <MaterialCommunityIcons name="certificate-outline" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Certificates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate(Routes.ChurchTransfer)}>
            <MaterialCommunityIcons name="swap-horizontal" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={shareCard}>
            <MaterialCommunityIcons name="arrow-up" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    backgroundColor: Colors.neutral.white,
  },
  backIcon: { color: Colors.primary.navy, fontSize: 22 },
  headerTitle: { color: Colors.primary.navy, fontSize: 18, fontWeight: '700' },
  shareIcon: { fontSize: 20, color: Colors.primary.navy },
  scroll: { padding: Spacing.screen },

  card: {
    backgroundColor: Colors.primary.navy,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.gold,
    borderWidth: 1,
    borderColor: Colors.accent.gold + '30',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  churchNameCard: { color: Colors.neutral.white, fontSize: 16, fontWeight: '700' },
  churchTA: { color: Colors.accent.gold, fontSize: 14, marginTop: 2 },
  diocese: { color: Colors.sky.blueLight, fontSize: 11, marginTop: 4 },
  crossIcon: { color: Colors.accent.gold, fontSize: 32 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: Spacing.md },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.neutral.white, fontSize: 22, fontWeight: '700' },
  familyInfo: { flex: 1 },
  familyName: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  headName: { color: Colors.sky.blueLight, fontSize: 13, marginTop: 2 },
  members: { color: Colors.sky.blueLight, fontSize: 13, marginTop: 4 },
  cardDetails: { gap: Spacing.xs, marginBottom: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  detailIcon: { fontSize: 14, marginTop: 1 , color: Colors.primary.navy},
  detailText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardIdLabel: { color: Colors.sky.blueLight, fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  cardId: { color: Colors.accent.gold, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  statusActive: { backgroundColor: Colors.semantic.success + '30', borderWidth: 1, borderColor: Colors.semantic.success },
  statusInactive: { backgroundColor: Colors.semantic.error + '30', borderWidth: 1, borderColor: Colors.semantic.error },
  statusText: { color: Colors.semantic.success, fontWeight: '700', fontSize: 12 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 , color: Colors.primary.navy},
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy },
  actionCount: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 4 },
});
