import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { useMyFamily, useMyTransfers, useRequestTransfer } from '../../hooks/useFamily';
import { churchApi } from '../../api/church.api';
import { getApiErrorMessage } from '../../api/client';
import type { Church, TransferRequest } from '../../types';

const REASONS = ['Relocation', 'Work Transfer', 'Marriage', 'Family Preference', 'Distance', 'Other'];

/** The two approvals a transfer needs, in order. */
const STEPS: { key: TransferRequest['status'][]; label: string }[] = [
  { key: ['pending_source'], label: 'Current parish reviews the request' },
  { key: ['approved_source', 'pending_destination'], label: 'New parish accepts your family' },
  { key: ['completed'], label: 'Transfer complete' },
];

const STATUS_TEXT: Record<TransferRequest['status'], string> = {
  pending_source: 'Waiting for your current parish',
  approved_source: 'Released — waiting for the new parish',
  pending_destination: 'Under review at the new parish',
  completed: 'Completed',
  rejected: 'Not approved',
};

function churchName(c: TransferRequest['destinationChurchId']): string {
  return typeof c === 'string' ? 'Parish' : c.name;
}

export default function ChurchTransferScreen() {
  const navigation = useNavigation<any>();
  const church = useAppSelector(selectChurch);
  const { isHead, isLoading: familyLoading } = useMyFamily();
  const { data: transfers, isLoading } = useMyTransfers();
  const request = useRequestTransfer();

  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState<Church | null>(null);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const results = useQuery({
    queryKey: ['churches', 'search', search.trim()],
    enabled: !destination && search.trim().length >= 2,
    queryFn: async () => (await churchApi.search(search.trim())).data.data,
  });
  const options = (results.data ?? []).filter(c => c._id !== church?._id);

  const open = transfers?.find(t => t.status !== 'completed' && t.status !== 'rejected');
  const past = (transfers ?? []).filter(t => t !== open);

  const handleSubmit = async () => {
    if (!destination || !reason) {
      Alert.alert('Missing details', 'Choose the parish you are moving to and a reason.');
      return;
    }
    try {
      await request.mutateAsync({
        destinationChurchId: destination._id,
        reason: [reason, remarks.trim()].filter(Boolean).join(' — '),
      });
      Alert.alert(
        'Transfer requested',
        `Your request has been sent to ${church?.name ?? 'your parish'}. Please give your parish priest's letter to the parish office.`,
      );
    } catch (err) {
      Alert.alert("Couldn't send request", getApiErrorMessage(err));
    }
  };

  const renderOpen = (t: TransferRequest) => {
    const current = STEPS.findIndex(step => step.key.includes(t.status));
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          <MaterialCommunityIcons name="swap-horizontal" size={14} /> Transfer to {churchName(t.destinationChurchId)}
        </Text>
        <Text style={styles.infoText}>{STATUS_TEXT[t.status]}</Text>
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step.label} style={styles.stepRow}>
              <MaterialCommunityIcons
                name={i < current ? 'check-circle' : i === current ? 'progress-clock' : 'circle-outline'}
                size={18}
                color={i <= current ? Colors.accent.gold : Colors.neutral.gray400}
              />
              <Text style={[styles.stepText, i === current && styles.stepTextActive]}>{step.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Church Transfer</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading || familyLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {open ? (
            renderOpen(open)
          ) : !isHead ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}><MaterialCommunityIcons name="information-outline" size={14} /> Transfers</Text>
              <Text style={styles.infoText}>
                Only the head of the family can request a transfer to another parish.
              </Text>
            </View>
          ) : (
          <>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}><MaterialCommunityIcons name="information-outline" size={14} /> Transfer Information</Text>
            <Text style={styles.infoText}>
              A church transfer moves your family's membership to another parish. Your current parish releases your family first, then the new parish accepts it.
            </Text>
          </View>

          <View style={styles.fromCard}>
            <Text style={styles.fromLabel}>FROM (Current Parish)</Text>
            <Text style={styles.fromChurch}><MaterialCommunityIcons name="church" size={13} /> {church?.name}</Text>
          </View>

          {destination ? (
            <View style={styles.fromCard}>
              <Text style={styles.fromLabel}>TO (New Parish)</Text>
              <Text style={styles.fromChurch}><MaterialCommunityIcons name="church" size={13} /> {destination.name}</Text>
              {!!destination.address?.city && <Text style={styles.infoText}>{destination.address.city}</Text>}
              <TouchableOpacity onPress={() => setDestination(null)}>
                <Text style={styles.letterReplace}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Input
                label="To Church / Parish *"
                value={search}
                onChangeText={setSearch}
                placeholder="Search by parish name"
              />
              {results.isFetching && <Text style={styles.infoText}>Searching…</Text>}
              {results.isError && <Text style={styles.errorText}>Couldn't search parishes. Check your connection.</Text>}
              {!results.isFetching && search.trim().length >= 2 && results.isSuccess && !options.length && (
                <Text style={styles.infoText}>No parish found with that name.</Text>
              )}
              {options.map(c => (
                <TouchableOpacity key={c._id} style={styles.resultRow} onPress={() => setDestination(c)}>
                  <MaterialCommunityIcons name="church" size={16} color={Colors.primary.navy} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{c.name}</Text>
                    {!!c.address?.city && <Text style={styles.infoText}>{c.address.city}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={styles.label}>Reason for Transfer *</Text>
          <View style={styles.pillRow}>
            {REASONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, reason === r && styles.pillActive]}
                onPress={() => setReason(r)}>
                <Text style={[styles.pillText, reason === r && styles.pillTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Additional Details"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any additional information..."
            multiline
          />

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}><MaterialCommunityIcons name="file-document-outline" size={14} /> Parish Priest's Letter</Text>
            <Text style={styles.infoText}>
              Your current parish priest issues a letter for the new parish. Please hand it to the parish office — it isn't uploaded through the app.
            </Text>
          </View>

          <Button title="Submit Transfer Request" onPress={handleSubmit} loading={request.isPending} fullWidth size="lg" style={styles.btn} />
          </>
          )}

          {past.length > 0 && (
            <>
              <Text style={styles.label}>Previous Requests</Text>
              {past.map(t => (
                <View key={t._id} style={styles.resultRow}>
                  <MaterialCommunityIcons
                    name={t.status === 'completed' ? 'check-circle-outline' : 'close-circle-outline'}
                    size={18}
                    color={t.status === 'completed' ? Colors.semantic.success : Colors.semantic.error}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{churchName(t.destinationChurchId)}</Text>
                    <Text style={styles.infoText}>
                      {STATUS_TEXT[t.status]}{t.rejectionReason ? ` — ${t.rejectionReason}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  backIcon: { color: Colors.primary.navy, fontSize: 22 },
  headerTitle: { color: Colors.primary.navy, fontSize: 18, fontWeight: '700' },
  scroll: { padding: Spacing.screen },
  infoCard: {
    backgroundColor: Colors.sky.bluePale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary.navy, marginBottom: 6 },
  infoText: { fontSize: 13, color: Colors.neutral.gray600, lineHeight: 20 },
  fromCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    ...Shadow.sm,
  },
  fromLabel: { fontSize: 11, color: Colors.neutral.gray400, letterSpacing: 0.5, marginBottom: 4 },
  fromChurch: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  label: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  pillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  pillText: { fontSize: 13, color: Colors.neutral.gray500 },
  pillTextActive: { color: Colors.neutral.white, fontWeight: '700' },
  helper: {
    fontSize: 12,
    color: Colors.neutral.gray500,
    lineHeight: 18,
    marginBottom: Spacing.sm,
    marginTop: -4,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.accent.gold,
    backgroundColor: Colors.accent.goldPale,
    marginBottom: Spacing.md,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.navy,
    marginTop: Spacing.sm,
  },
  uploadHint: { fontSize: 12, color: Colors.neutral.gray500, marginTop: 2 },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    ...Shadow.sm,
  },
  letterThumb: {
    width: 46,
    height: 60,
    borderRadius: Radius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.neutral.gray100,
  },
  letterInfo: { flex: 1 },
  letterName: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy },
  letterMeta: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  letterReplace: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.goldDark,
    marginTop: 6,
  },
  letterRemove: { padding: 4 },
  noteCard: {
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.gold,
  },
  noteText: { fontSize: 13, color: Colors.neutral.gray600, lineHeight: 20 },
  btn: { marginTop: Spacing.sm },
  steps: { marginTop: Spacing.md, gap: Spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepText: { fontSize: 13, color: Colors.neutral.gray500 },
  stepTextActive: { color: Colors.primary.navy, fontWeight: '700' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  resultName: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy },
  errorText: { fontSize: 13, color: Colors.semantic.error, marginBottom: Spacing.sm },
});
