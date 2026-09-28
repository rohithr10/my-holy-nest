import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { Routes } from '../../constants/routes';
import type { ProfileStackParamList } from '../../navigation/types';
import { useMyFamily, useMemberMutations, fullName } from '../../hooks/useFamily';
import type { MemberInput } from '../../api/family.api';
import { getApiErrorMessage } from '../../api/client';
import type { FamilyMember } from '../../types';
import { toDisplayDate, toIsoDate } from '../../utils/dates';

/**
 * The API stores a relation plus gender; Father/Mother are offered because
 * that's how families describe them, and map to "parent" with a gender.
 */
const RELATIONS = [
  { label: 'Spouse', relation: 'spouse' },
  { label: 'Son', relation: 'son', gender: 'M' },
  { label: 'Daughter', relation: 'daughter', gender: 'F' },
  { label: 'Father', relation: 'parent', gender: 'M' },
  { label: 'Mother', relation: 'parent', gender: 'F' },
  { label: 'Other', relation: 'other' },
] as const;
type RelationLabel = (typeof RELATIONS)[number]['label'];

const GENDERS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
] as const;

function relationLabel(m: FamilyMember): RelationLabel | '' {
  if (m.relation === 'parent') return m.gender === 'F' ? 'Mother' : m.gender === 'M' ? 'Father' : '';
  return (RELATIONS.find(r => r.relation === m.relation)?.label ?? '') as RelationLabel | '';
}

type Props = NativeStackScreenProps<ProfileStackParamList, typeof Routes.AddMember>;

export default function AddMemberScreen({ navigation, route }: Props) {
  const memberId = route.params?.memberId;
  const { family, isHead } = useMyFamily();
  const { add, update, remove } = useMemberMutations();
  const existing = memberId ? family?.members.find(m => m._id === memberId) : undefined;
  const editingHead = existing?.relation === 'head';

  const [form, setForm] = useState({
    firstName: existing?.firstName ?? '',
    lastName: existing?.lastName ?? '',
    relation: (existing ? relationLabel(existing) : '') as RelationLabel | '',
    gender: (existing?.gender ?? '') as 'M' | 'F' | '',
    dob: toDisplayDate(existing?.dob),
    occupation: existing?.occupation ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const update_ = <K extends keyof typeof form>(key: K) => (val: (typeof form)[K]) =>
    setForm(p => ({ ...p, [key]: val }));

  const pickRelation = (label: RelationLabel) => {
    const r = RELATIONS.find(x => x.label === label)!;
    // Son/Daughter/Father/Mother imply the gender; keep it in step.
    setForm(p => ({ ...p, relation: label, gender: 'gender' in r ? r.gender : p.gender }));
  };

  const saving = add.isPending || update.isPending;

  const handleSave = async () => {
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = 'Enter a first name';
    if (!editingHead && !form.relation) e.relation = 'Choose how they are related';
    let dob: string | undefined;
    if (form.dob.trim()) {
      dob = toIsoDate(form.dob) ?? undefined;
      if (!dob) e.dob = 'Enter a real date as DD/MM/YYYY';
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const rel = RELATIONS.find(x => x.label === form.relation);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(form.gender ? { gender: form.gender } : {}),
      ...(dob ? { dob } : {}),
      ...(form.occupation.trim() ? { occupation: form.occupation.trim() } : {}),
      // The head's relation is fixed by the API; never send it.
      ...(!editingHead && rel ? { relation: rel.relation } : {}),
    };

    try {
      if (existing) await update.mutateAsync({ id: existing._id, data: payload });
      else await add.mutateAsync(payload as MemberInput);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't save member", getApiErrorMessage(err));
    }
  };

  const confirmRemove = () => {
    if (!existing) return;
    Alert.alert(
      `Remove ${fullName(existing)}?`,
      'They will be removed from your family card. To add them back, you would need to enter their details again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync(existing._id);
              navigation.goBack();
            } catch (err) {
              Alert.alert("Couldn't remove member", getApiErrorMessage(err));
            }
          },
        },
      ],
    );
  };

  const title = existing ? 'Edit Member' : 'Add Member';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>
      {!isHead || (memberId && !existing) ? (
        <EmptyState
          icon="lock-outline"
          title={!isHead ? 'Only the head of the family can change the card' : 'Member not found'}
          subtitle={!isHead ? 'Ask the head of your family, or contact the parish office.' : undefined}
        />
      ) : (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <Input label="First Name" value={form.firstName} onChangeText={update_('firstName')}
              placeholder="First" containerStyle={styles.half} error={errors.firstName} />
            <Input label="Last Name" value={form.lastName} onChangeText={update_('lastName')}
              placeholder="Last" containerStyle={styles.half} />
          </View>

          <Text style={styles.label}>Relationship</Text>
          {editingHead ? (
            <Text style={styles.fixedValue}>Head of Family</Text>
          ) : (
            <>
              <View style={styles.pillRow}>
                {RELATIONS.map(r => (
                  <TouchableOpacity
                    key={r.label}
                    style={[styles.pill, form.relation === r.label && styles.pillActive]}
                    onPress={() => pickRelation(r.label)}>
                    <Text style={[styles.pillText, form.relation === r.label && styles.pillTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.relation && <Text style={styles.errorText}>{errors.relation}</Text>}
            </>
          )}

          <Text style={styles.label}>Gender</Text>
          <View style={styles.pillRow}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[styles.pill, form.gender === g.value && styles.pillActive]}
                onPress={() => update_('gender')(g.value)}>
                <Text style={[styles.pillText, form.gender === g.value && styles.pillTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Date of Birth (optional)" value={form.dob} onChangeText={update_('dob')}
            placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" maxLength={10}
            error={errors.dob} />
          <Input label="Occupation (optional)" value={form.occupation} onChangeText={update_('occupation')}
            placeholder="e.g. Student, Engineer..." />

          <Button title={existing ? 'Save Changes' : 'Save Member'} onPress={handleSave} loading={saving}
            fullWidth size="lg" style={styles.saveBtn} />
          {existing && !editingHead && (
            <TouchableOpacity style={styles.removeBtn} onPress={confirmRemove} disabled={remove.isPending}>
              <Text style={styles.removeText}>{remove.isPending ? 'Removing…' : 'Remove from family card'}</Text>
            </TouchableOpacity>
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
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
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
  prefix: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray600 },
  saveBtn: { marginTop: Spacing.lg },
  fixedValue: { fontSize: 14, color: Colors.neutral.gray600, marginBottom: Spacing.md },
  errorText: { fontSize: 12, color: Colors.semantic.error, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  removeBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  removeText: { fontSize: 14, fontWeight: '600', color: Colors.semantic.error },
});
