import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import Badge from '../../components/common/Badge/Badge';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAdminTransfers, useUpdateTransfer } from '../../hooks/useAdmin';
import type { AdminTransfer } from '../../api/admin.api';
import { getApiErrorMessage } from '../../api/client';

const STATUS: Record<AdminTransfer['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  pending_source: { label: 'Awaiting current parish', variant: 'warning' },
  approved_source: { label: 'Released', variant: 'info' },
  pending_destination: { label: 'At new parish', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
};

const name = (c: AdminTransfer['sourceChurchId']) => (typeof c === 'string' ? 'Parish' : c.name);
const family = (f: AdminTransfer['familyId']) =>
  typeof f === 'string' ? 'Family' : `${f.familyName ?? 'Family'}${f.cardNumber ? ` (${f.cardNumber})` : ''}`;

export default function AdminTransfersScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch, isRefetching } = useAdminTransfers();
  const update = useUpdateTransfer();

  // The API decides what this parish may do next (release, accept, reject).
  const act = (item: AdminTransfer, status: 'approved_source' | 'completed' | 'rejected') => {
    const copy = {
      approved_source: ['Release this family?', `${name(item.destinationChurchId)} will then review the transfer.`, 'Release'],
      completed: ['Accept this family?', 'The family and their accounts move to your parish.', 'Accept'],
      rejected: ['Reject this transfer?', 'The family will be told it was not approved.', 'Reject'],
    }[status];
    Alert.alert(copy[0], copy[1], [
      { text: 'Cancel', style: 'cancel' },
      {
        text: copy[2],
        style: status === 'rejected' ? 'destructive' : 'default',
        onPress: () =>
          update.mutate(
            { id: item._id, status, ...(status === 'rejected' ? { rejectionReason: 'Please contact the parish office' } : {}) },
            { onError: err => Alert.alert("Couldn't update the transfer", getApiErrorMessage(err)) },
          ),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Requests</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
      <FlatList
        data={data ?? []}
        keyExtractor={t => t._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="swap-horizontal"
            title={isError ? "Couldn't load transfers" : 'No transfer requests'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        }
        renderItem={({ item }) => {
          const actions = item.actions ?? [];
          return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.family}>{family(item.familyId)}</Text>
              <Badge label={STATUS[item.status].label} variant={STATUS[item.status].variant} size="sm" />
            </View>
            <View style={styles.transferRoute}>
              <Text style={styles.church}>{name(item.sourceChurchId)}</Text>
              <MaterialCommunityIcons name="arrow-right" style={styles.arrow} />
              <Text style={styles.church}>{name(item.destinationChurchId)}</Text>
            </View>
            {!!item.reason && <Text style={styles.reason}>Reason: {item.reason}</Text>}
            <Text style={styles.date}>
              Requested: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            {actions.length > 0 && (
              <View style={styles.actionsRow}>
                {actions.includes('approved_source') && (
                  <TouchableOpacity style={styles.approveBtn} disabled={update.isPending} onPress={() => act(item, 'approved_source')}>
                    <Text style={styles.approveBtnText}><MaterialCommunityIcons name="check" size={13} /> Release family</Text>
                  </TouchableOpacity>
                )}
                {actions.includes('completed') && (
                  <TouchableOpacity style={styles.approveBtn} disabled={update.isPending} onPress={() => act(item, 'completed')}>
                    <Text style={styles.approveBtnText}><MaterialCommunityIcons name="check" size={13} /> Accept</Text>
                  </TouchableOpacity>
                )}
                {actions.includes('rejected') && (
                  <TouchableOpacity style={styles.rejectBtn} disabled={update.isPending} onPress={() => act(item, 'rejected')}>
                    <Text style={styles.rejectBtnText}><MaterialCommunityIcons name="close" size={13} /> Reject</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          );
        }}
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
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  list: { padding: Spacing.screen },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  family: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  transferRoute: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  church: { fontSize: 13, color: Colors.neutral.gray600, flex: 1 },
  arrow: { color: Colors.accent.gold, fontSize: 18, fontWeight: '700' },
  reason: { fontSize: 12, color: Colors.neutral.gray500, marginBottom: 2 },
  date: { fontSize: 11, color: Colors.neutral.gray400, marginBottom: Spacing.sm },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: {
    flex: 1, backgroundColor: Colors.semantic.success + '20', borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.semantic.success,
  },
  approveBtnText: { color: Colors.semantic.success, fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1, backgroundColor: Colors.semantic.error + '15', borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.semantic.error,
  },
  rejectBtnText: { color: Colors.semantic.error, fontWeight: '700', fontSize: 13 },
});
