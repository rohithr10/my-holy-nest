import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, TouchableOpacity, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAdminFamilies } from '../../hooks/useAdmin';
import { fullName } from '../../hooks/useFamily';

export default function AdminFamiliesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const { data, isLoading, isError, refetch, isRefetching } = useAdminFamilies(debounced);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Families{data ? ` (${data.total})` : ''}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by family name or card number..."
          placeholderTextColor={Colors.neutral.gray400}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
      <FlatList
        data={data?.families ?? []}
        keyExtractor={f => f._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="account-group-outline"
            title={isError ? "Couldn't load families" : debounced ? 'No family matches your search' : 'No families registered yet'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        }
        renderItem={({ item }) => {
          const head = item.members.find(m => m.relation === 'head');
          const area = [item.address?.area, item.address?.city].filter(Boolean).join(', ');
          return (
          <View style={styles.card}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{item.familyName[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.familyName}>{item.familyName}</Text>
                <View style={[styles.statusDot, item.isActive !== false ? styles.dotGreen : styles.dotGray]} />
              </View>
              {!!head && <Text style={styles.head}>{fullName(head)}</Text>}
              <Text style={styles.meta}>
                {!!area && <><MaterialCommunityIcons name="map-marker-outline" size={13} /> {area}  ·  </>}
                <MaterialCommunityIcons name="account-group-outline" size={13} /> {item.members.length} members
              </Text>
              <Text style={styles.phone}>{item.cardNumber}</Text>
            </View>
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
  exportBtn: { borderWidth: 1, borderColor: Colors.neutral.white, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  exportText: { color: Colors.neutral.white, fontSize: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    margin: Spacing.screen,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.xs , color: Colors.neutral.gray400},
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.neutral.gray800 },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  familyName: { fontSize: 15, fontWeight: '700', color: Colors.primary.navy },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: Colors.semantic.success },
  dotGray: { backgroundColor: Colors.neutral.gray300 },
  head: { fontSize: 13, color: Colors.neutral.gray600 },
  meta: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 2 },
  phone: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 1 },
});
