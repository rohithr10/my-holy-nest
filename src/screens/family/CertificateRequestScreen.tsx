import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { Routes } from '../../constants/routes';
import type { ProfileStackParamList } from '../../navigation/types';
import { useMyFamily, useRequestCertificate, fullName } from '../../hooks/useFamily';
import { getApiErrorMessage } from '../../api/client';
import type { CertType } from '../../types';

const CERT_TYPES: { id: CertType; label: string; labelTA: string; icon: string }[] = [
  { id: 'baptism', label: 'Baptism', labelTA: 'ஞானஸ்நானம்', icon: 'water-outline' },
  { id: 'holy_communion', label: 'First Communion', labelTA: 'புதுநன்மை', icon: 'bread-slice-outline' },
  { id: 'confirmation', label: 'Confirmation', labelTA: 'உறுதிப்பூசுதல்', icon: 'bird' },
  { id: 'marriage', label: 'Marriage', labelTA: 'திருமணம்', icon: 'ring' },
  { id: 'death', label: 'Death', labelTA: 'இறப்பு', icon: 'candle' },
  { id: 'general', label: 'Other', labelTA: 'பிற', icon: 'file-document-outline' },
];

const PURPOSES = ['Personal Records', 'Government', 'Marriage', 'Visa', 'School', 'Other'];

type Props = NativeStackScreenProps<ProfileStackParamList, typeof Routes.CertificateRequest>;

export default function CertificateRequestScreen({ navigation, route }: Props) {
  const { family, isLoading: familyLoading } = useMyFamily();
  const request = useRequestCertificate();
  const preset = CERT_TYPES.find(c => c.id === route.params?.certType)?.id ?? '';
  const [certType, setCertType] = useState<CertType | ''>(preset);
  const [memberId, setMemberId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [copies, setCopies] = useState('1');
  const [remarks, setRemarks] = useState('');

  const members = family?.members ?? [];
  const member = members.find(m => m._id === memberId);

  const handleSubmit = async () => {
    if (!certType || !member || !purpose) {
      Alert.alert('Missing details', 'Choose the certificate, the family member and the purpose.');
      return;
    }
    const n = Math.max(1, parseInt(copies, 10) || 1);
    // The parish office reads one purpose line; copies and remarks go with it.
    const fullPurpose = [purpose, `${n} ${n === 1 ? 'copy' : 'copies'}`, remarks.trim()]
      .filter(Boolean)
      .join(' · ');
    try {
      await request.mutateAsync({
        type: certType,
        memberId: member._id,
        memberName: fullName(member),
        familyId: family?._id,
        purpose: fullPurpose,
      });
      Alert.alert(
        'Request submitted',
        'The parish office will review your request. You can follow its status under Certificates.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Couldn't submit request", getApiErrorMessage(err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Certificate</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Certificate Type *</Text>
          <View style={styles.typeGrid}>
            {CERT_TYPES.map(ct => (
              <TouchableOpacity
                key={ct.id}
                style={[styles.typeCard, certType === ct.id && styles.typeCardActive]}
                onPress={() => setCertType(ct.id)}>
                <MaterialCommunityIcons name={ct.icon} style={styles.typeIcon} />
                <Text style={[styles.typeLabel, certType === ct.id && styles.typeLabelActive]}>{ct.label}</Text>
                <Text style={styles.typeLabelTA}>{ct.labelTA}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>For Member *</Text>
          <View style={styles.pillRow}>
            {familyLoading && <Text style={styles.pillText}>Loading family members…</Text>}
            {!familyLoading && !members.length && (
              <Text style={styles.pillText}>No family card found. Please contact the parish office.</Text>
            )}
            {members.map(m => (
              <TouchableOpacity
                key={m._id}
                style={[styles.pill, memberId === m._id && styles.pillActive]}
                onPress={() => setMemberId(m._id)}>
                <Text style={[styles.pillText, memberId === m._id && styles.pillTextActive]}>{fullName(m)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Purpose *</Text>
          <View style={styles.pillRow}>
            {PURPOSES.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.pill, purpose === p && styles.pillActive]}
                onPress={() => setPurpose(p)}>
                <Text style={[styles.pillText, purpose === p && styles.pillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="No. of Copies"
            value={copies}
            onChangeText={t => setCopies(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={1}
          />
          <Input
            label="Additional Remarks"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any specific requirements..."
            multiline
          />

          <View style={styles.feeCard}>
            <Text style={styles.feeTitle}><MaterialCommunityIcons name="note-edit-outline" size={13} /> Certificate Fee</Text>
            <Text style={styles.feeText}>Any certificate fee is paid at the parish office when you collect it</Text>
          </View>

          <Button title="Submit Request" onPress={handleSubmit} loading={request.isPending} fullWidth size="lg" style={styles.submitBtn} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.gray200,
    ...Shadow.sm,
  },
  typeCardActive: { borderColor: Colors.accent.gold, backgroundColor: Colors.accent.goldPale },
  typeIcon: { fontSize: 28, marginBottom: 6 , color: Colors.primary.navy},
  typeLabel: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray700 },
  typeLabelActive: { color: Colors.primary.navy },
  typeLabelTA: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 2 },
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
  feeCard: {
    backgroundColor: Colors.sky.bluePale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  feeTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary.navy, marginBottom: 4 },
  feeText: { fontSize: 13, color: Colors.neutral.gray600 },
  submitBtn: { marginTop: Spacing.sm },
});
