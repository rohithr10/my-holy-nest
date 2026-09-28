import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAdminMassTimings, useRemoveMassTiming } from '../../hooks/useAdmin';
import { formatMassTime } from '../../hooks/useMass';
import { adminApi } from '../../api/admin.api';
import { getApiErrorMessage } from '../../api/client';
import type { MassTiming } from '../../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LANG_LABEL = { en: 'English', ta: 'Tamil', both: 'Bilingual' } as const;
const emptyForm = { title: '', time: '', days: [0] as number[], language: 'both' as 'en' | 'ta' | 'both', venue: '' };

export default function AdminMassScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useAdminMassTimings();
  const remove = useRemoveMassTiming();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const add = useMutation({
    mutationFn: () =>
      adminApi.addMassTiming({
        title: form.title.trim(),
        time: form.time.trim(),
        dayOfWeek: form.days,
        language: form.language,
        ...(form.venue.trim() ? { venue: form.venue.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['mass-timings'] });
      setAdding(false);
      setForm(emptyForm);
    },
    onError: err => setError(getApiErrorMessage(err)),
  });

  const submit = () => {
    if (!form.title.trim()) return setError('Enter a title, e.g. "Tamil Mass".');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time.trim())) {
      return setError('Enter the time as HH:MM in 24-hour form, e.g. 06:30 or 18:30.');
    }
    if (!form.days.length) return setError('Choose at least one day.');
    setError('');
    add.mutate();
  };

  const deleteEntry = (id: string, title: string) => {
    Alert.alert('Remove Mass timing?', `"${title}" will disappear from the app.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onError: err => Alert.alert("Couldn't remove it", getApiErrorMessage(err)),
          }),
      },
    ]);
  };

  const describeDays = (t: MassTiming) =>
    t.specificDate
      ? new Date(t.specificDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : (t.dayOfWeek ?? []).map(d => DAYS[d]).join(', ');

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mass Schedule</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setAdding(!adding); setError(''); }}>
          <Text style={styles.addBtnText}>{adding ? 'Close' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {adding && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Title (e.g. Tamil Mass)" value={form.title}
            onChangeText={v => setForm({ ...form, title: v })} placeholderTextColor={Colors.neutral.gray400} />
          <View style={styles.formRow}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Time HH:MM (24h)" value={form.time}
              keyboardType="numbers-and-punctuation" maxLength={5}
              onChangeText={v => setForm({ ...form, time: v })} placeholderTextColor={Colors.neutral.gray400} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Venue (optional)" value={form.venue}
              onChangeText={v => setForm({ ...form, venue: v })} placeholderTextColor={Colors.neutral.gray400} />
          </View>
          <View style={styles.formRow}>
            {DAYS.map((d, i) => {
              const on = form.days.includes(i);
              return (
                <TouchableOpacity key={d} style={[styles.dayPill, on && styles.dayPillOn]}
                  onPress={() => setForm({ ...form, days: on ? form.days.filter(x => x !== i) : [...form.days, i].sort() })}>
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.formRow}>
            {(['both', 'ta', 'en'] as const).map(l => (
              <TouchableOpacity key={l} style={[styles.dayPill, form.language === l && styles.dayPillOn]}
                onPress={() => setForm({ ...form, language: l })}>
                <Text style={[styles.dayText, form.language === l && styles.dayTextOn]}>{LANG_LABEL[l]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.saveBtn} onPress={submit} disabled={add.isPending}>
            <Text style={styles.saveText}>{add.isPending ? 'Saving…' : 'Add Mass timing'}</Text>
          </TouchableOpacity>
        </View>
      )}

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
            icon="church"
            title={isError ? "Couldn't load the schedule" : 'No Mass timings yet'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        }
        renderItem={({ item }) => {
          const t = formatMassTime(item.time);
          return (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.massTitle}>{item.title}</Text>
              <Text style={styles.massMeta}>{describeDays(item)} · {t.clock} {t.meridiem}</Text>
              <Text style={styles.massVenue}>
                {item.venue ? <><MaterialCommunityIcons name="map-marker-outline" size={13} /> {item.venue}  ·  </> : null}
                <MaterialCommunityIcons name="account-voice" size={13} /> {LANG_LABEL[item.language]}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteEntry(item._id, item.title)} style={styles.deleteBtn}
              accessibilityLabel={`Remove ${item.title}`} disabled={remove.isPending}>
              <MaterialCommunityIcons name="trash-can-outline" style={styles.deleteIcon} />
            </TouchableOpacity>
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
  addBtn: { backgroundColor: Colors.accent.gold, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  addBtnText: { color: Colors.neutral.white, fontWeight: '700', fontSize: 13 },
  list: { padding: Spacing.screen },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardLeft: { flex: 1 },
  massTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  massMeta: { fontSize: 13, color: Colors.neutral.gray500, marginTop: 2 },
  massVenue: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18 , color: Colors.semantic.error},
  form: { backgroundColor: Colors.neutral.white, margin: Spacing.screen, marginBottom: 0, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, ...Shadow.sm },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  input: { borderWidth: 1, borderColor: Colors.neutral.gray200, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8, fontSize: 14, color: Colors.neutral.gray800 },
  dayPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.neutral.gray200 },
  dayPillOn: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  dayText: { fontSize: 12, color: Colors.neutral.gray500 },
  dayTextOn: { color: Colors.neutral.white, fontWeight: '700' },
  error: { fontSize: 13, color: Colors.semantic.error },
  saveBtn: { backgroundColor: Colors.primary.navy, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center' },
  saveText: { color: Colors.neutral.white, fontWeight: '700' },
});
