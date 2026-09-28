import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity, Alert, TextInput,
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
import { useAdminCertificates, useUpdateCertificate } from '../../hooks/useAdmin';
import { getApiErrorMessage } from '../../api/client';
import type { CertificateRequest } from '../../types';

const STATUS: Record<CertificateRequest['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  under_review: { label: 'Under review', variant: 'info' },
  approved: { label: 'Approved', variant: 'success' },
  ready: { label: 'Ready', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
};

const FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Ready', value: 'ready' },
  { label: 'All', value: '' },
];

export default function AdminCertificatesScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState('pending');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useAdminCertificates(filter);
  const update = useUpdateCertificate();

  const decide = (
    item: CertificateRequest,
    status: 'under_review' | 'approved' | 'rejected' | 'ready',
    extra?: { rejectionReason?: string },
  ) =>
    update.mutate(
      { id: item._id, status, ...extra },
      {
        onSuccess: () => {
          setRejecting(null);
          setReason('');
        },
        onError: err => Alert.alert("Couldn't update the request", getApiErrorMessage(err)),
      },
    );

  const confirm = (item: CertificateRequest, status: 'approved' | 'ready') =>
    Alert.alert(
      status === 'approved' ? 'Approve this request?' : 'Mark as ready?',
      status === 'approved'
        ? `${item.memberName}'s family will be told it's approved.`
        : `${item.memberName}'s family will be told to collect it at the parish office.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: status === 'approved' ? 'Approve' : 'Mark ready', onPress: () => decide(item, status) },
      ],
    );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificates</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
            onPress={() => setFilter(f.value)}>
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
      <FlatList
        data={data ?? []}
        keyExtractor={c => c._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="certificate-outline"
            title={isError ? "Couldn't load requests" : 'No requests here'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        }
        renderItem={({ item }) => {
          const st = STATUS[item.status];
          const open = item.status === 'pending' || item.status === 'under_review';
          return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.certType}>
                  {item.type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())} Certificate
                </Text>
                <Text style={styles.certMember}>{item.memberName}</Text>
                <Text style={styles.certFamily}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.purpose}>Purpose: {item.purpose}</Text>
                {item.status === 'rejected' && !!item.rejectionReason && (
                  <Text style={styles.purpose}>Reason: {item.rejectionReason}</Text>
                )}
              </View>
              <Badge label={st.label} variant={st.variant} />
            </View>

            {rejecting === item._id ? (
              <View style={styles.rejectBox}>
                <TextInput
                  style={styles.reasonInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Reason (shown to the family)"
                  placeholderTextColor={Colors.neutral.gray400}
                  autoFocus
                />
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => setRejecting(null)}>
                    <Text style={styles.approveBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    disabled={update.isPending}
                    onPress={() => decide(item, 'rejected', { rejectionReason: reason.trim() || 'Please contact the parish office' })}>
                    <Text style={styles.rejectBtnText}>Reject request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (open || item.status === 'approved') && (
              <View style={styles.actionsRow}>
                {open && (
                  <TouchableOpacity style={styles.approveBtn} disabled={update.isPending} onPress={() => confirm(item, 'approved')}>
                    <Text style={styles.approveBtnText}><MaterialCommunityIcons name="check" size={13} /> Approve</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'approved' && (
                  <TouchableOpacity style={styles.approveBtn} disabled={update.isPending} onPress={() => confirm(item, 'ready')}>
                    <Text style={styles.approveBtnText}><MaterialCommunityIcons name="check-all" size={13} /> Mark ready</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => {
                    setRejecting(item._id);
                    setReason('');
                  }}>
                  <Text style={styles.rejectBtnText}><MaterialCommunityIcons name="close" size={13} /> Reject</Text>
                </TouchableOpacity>
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
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 16, fontWeight: '700' },
  list: { padding: Spacing.screen },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  certType: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  certMember: { fontSize: 14, color: Colors.neutral.gray700, marginTop: 2 },
  certFamily: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  purpose: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: {
    flex: 1,
    backgroundColor: Colors.semantic.success + '20',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.semantic.success,
  },
  approveBtnText: { color: Colors.semantic.success, fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1,
    backgroundColor: Colors.semantic.error + '15',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.semantic.error,
  },
  rejectBtnText: { color: Colors.semantic.error, fontWeight: '700', fontSize: 13 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.screen, paddingTop: Spacing.md },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.neutral.white, borderWidth: 1, borderColor: Colors.neutral.gray200 },
  filterPillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  filterText: { fontSize: 13, color: Colors.neutral.gray500 },
  filterTextActive: { color: Colors.neutral.white, fontWeight: '700' },
  rejectBox: { gap: Spacing.sm, marginTop: Spacing.sm },
  reasonInput: { borderWidth: 1, borderColor: Colors.neutral.gray200, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8, fontSize: 14, color: Colors.neutral.gray800 },
});
