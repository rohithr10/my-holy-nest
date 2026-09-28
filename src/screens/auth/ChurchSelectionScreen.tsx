import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setChurch } from '../../store/slices/auth.slice';
import { churchApi } from '../../api/church.api';
import type { AuthStackParamList } from '../../navigation/types';
import type { Church } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

type Props = NativeStackScreenProps<AuthStackParamList, typeof Routes.ChurchSelection>;

export default function ChurchSelectionScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Fetch from the API, debounced on the search term. A failure is shown as
  // an error with a retry — never as sample parishes, whose ids don't exist.
  useEffect(() => {
    let active = true;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await churchApi.search(search.trim());
        if (!active) return;
        setChurches(res.data.data);
        setError(false);
      } catch {
        if (!active) return;
        setChurches([]);
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [search, attempt]);

  const filtered = churches;

  const selectChurchHandler = (church: Church) => {
    dispatch(setChurch(church));
    navigation.navigate(Routes.Login, { church });
  };

  const renderItem = ({ item }: { item: Church }) => (
    <TouchableOpacity style={styles.card} onPress={() => selectChurchHandler(item)} activeOpacity={0.85}>
      <View style={styles.cardLeft}>
        <View style={styles.churchIcon}>
          <MaterialCommunityIcons name="church" style={styles.churchIconText} />
        </View>
      </View>
      <View style={styles.cardCenter}>
        <Text style={styles.churchName}>{item.name}</Text>
        {!!item.nameTA && <Text style={styles.churchNameTA}>{item.nameTA}</Text>}
        <Text style={styles.churchArea}>
          {[item.address?.area, item.address?.city].filter(Boolean).join(', ')}
        </Text>
        <Text style={styles.churchStats}>
          {item.stats.totalFamilies.toLocaleString()} {item.stats.totalFamilies === 1 ? 'family' : 'families'}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.neutral.warmWhite} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.warmWhite} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Church</Text>
        <Text style={styles.subtitle}>Search for your parish to get started</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search church name or area..."
          placeholderTextColor={Colors.neutral.gray400}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.accent.gold} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              {error ? (
                <>
                  <Text style={styles.emptyText}>Couldn't load parishes. Check your connection.</Text>
                  <TouchableOpacity onPress={() => setAttempt(a => a + 1)} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Try again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  {search.trim() ? `No parish matches "${search.trim()}"` : 'No parishes available yet'}
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity>
          <Text style={styles.footerText}>Can't find your church? Contact us</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: '700', color: Colors.primary.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.neutral.gray500 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16, marginRight: 8 , color: Colors.neutral.gray400},
  searchInput: { flex: 1, height: 48, fontSize: 15, color: Colors.neutral.gray800 },
  clearIcon: { color: Colors.neutral.gray400, fontSize: 14, padding: 4 },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardLeft: { marginRight: Spacing.md },
  churchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  churchIconText: { fontSize: 22 , color: Colors.primary.navy},
  cardCenter: { flex: 1 },
  churchName: { fontSize: 15, fontWeight: '600', color: Colors.neutral.gray800, marginBottom: 2 },
  churchNameTA: { fontSize: 12, color: Colors.neutral.gray500, marginBottom: 3 },
  churchArea: { fontSize: 13, color: Colors.neutral.gray500 },
  churchStats: { fontSize: 12, color: Colors.accent.gold, fontWeight: '500', marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.neutral.gray300, marginLeft: 8 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.neutral.gray400, fontSize: 15 },
  footer: { padding: Spacing.screen, alignItems: 'center' },
  footerText: { color: Colors.sky.blue, fontSize: 13 },
  retryBtn: { marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.accent.gold },
  retryText: { color: Colors.neutral.white, fontWeight: '700' },
});
