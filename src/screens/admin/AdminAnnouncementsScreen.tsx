import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import Button from '../../components/common/Button/Button';
import { adminApi } from '../../api/admin.api';
import { getApiErrorMessage } from '../../api/client';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import {
  addAnnouncement,
  removeAnnouncement,
} from '../../store/slices/church.slice';
import { queryClient } from '../../api/queryClient';
import { formatAnnouncementDate } from '../../constants/announcements';
import type { Announcement } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

export default function AdminAnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  // The same list the app's Home feed and Announcements screen read, so a post
  // made here is visible to members straight away.
  const { announcements, refetch } = useAnnouncements();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal'>('normal');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      type: 'general' as const,
      priority,
    };

    // The server is the source of truth: a post that only lands locally would
    // vanish on the next refresh and would never reach anyone else's phone.
    let announcement: Announcement;
    try {
      const res = await adminApi.postAnnouncement(payload);
      announcement = res.data.data;
    } catch (err) {
      setLoading(false);
      Alert.alert('Could not publish', getApiErrorMessage(err));
      return;
    }

    dispatch(addAnnouncement(announcement));
    void refetch();
    // The server notifies every parishioner (this admin included), so no
    // local notification is added here — it would show up twice.
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });

    setLoading(false);
    setShowModal(false);
    setTitle(''); setContent(''); setPriority('normal');
  };

  const deleteAnn = (id: string) => {
    Alert.alert('Delete', 'Delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteAnnouncement(id);
          } catch (err) {
            Alert.alert('Could not delete', getApiErrorMessage(err));
            return;
          }
          dispatch(removeAnnouncement(id));
        },
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
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={a => a._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, item.priority === 'high' && styles.cardHigh]}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.annTitle}>{item.title}</Text>
                <Text style={styles.annContent} numberOfLines={2}>{item.content}</Text>
                <Text style={styles.annDate}>
                  {formatAnnouncementDate(item.publishedAt)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteAnn(item._id)}>
                <MaterialCommunityIcons name="trash-can-outline" style={styles.deleteIcon} />
              </TouchableOpacity>
            </View>
            {item.priority === 'high' && (
              <View style={styles.highPriorityBadge}>
                <Text style={styles.highPriorityText}><MaterialCommunityIcons name="alert-outline" size={13} /> High Priority</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* Post Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Post Announcement</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Title..."
                placeholderTextColor={Colors.neutral.gray400}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Content..."
                placeholderTextColor={Colors.neutral.gray400}
                multiline
              />
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                {(['normal', 'high'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityPill, priority === p && styles.priorityPillActive]}
                    onPress={() => setPriority(p)}>
                    <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="ghost" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                <Button title="Post" onPress={handlePost} loading={loading} style={{ flex: 1 }} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardHigh: { borderLeftWidth: 3, borderLeftColor: Colors.accent.gold },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1, marginRight: Spacing.sm },
  annTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy, marginBottom: 4 },
  annContent: { fontSize: 13, color: Colors.neutral.gray500, lineHeight: 20 },
  annDate: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 4 },
  deleteIcon: { fontSize: 18 , color: Colors.semantic.error},
  highPriorityBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.accent.goldPale,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  highPriorityText: { fontSize: 11, color: Colors.accent.goldDark, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.lg },
  input: {
    backgroundColor: Colors.neutral.warmWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.neutral.gray800,
    marginBottom: Spacing.md,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  priorityLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary.navy },
  priorityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  priorityPillActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  priorityText: { fontSize: 13, color: Colors.neutral.gray500 },
  priorityTextActive: { color: Colors.neutral.white, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
});
