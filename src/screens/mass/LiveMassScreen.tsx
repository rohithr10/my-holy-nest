import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar,
  TouchableOpacity, ScrollView, Dimensions, Share, Alert, Linking,
} from 'react-native';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Routes } from '../../constants/routes';
import type { MassStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { useLiveStream } from '../../hooks/useMass';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

type Props = NativeStackScreenProps<MassStackParamList, typeof Routes.LiveMass>;

export default function LiveMassScreen({ navigation, route }: Props) {
  const { videoId, title } = route.params;
  const [isLiked, setIsLiked] = useState(false);
  const church = useAppSelector(selectChurch);
  const { data: current } = useLiveStream();
  // The route only carries the video; status and start time come from the API.
  const stream = current?.youtubeVideoId === videoId ? current : null;
  const isLive = stream ? stream.status === 'live' : true;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const shareStream = useCallback(async () => {
    try {
      await Share.share({
        message: `${title}${isLive ? ' — live now' : ''} from ${church?.name ?? 'our parish'}.\nWatch: ${watchUrl}\n\n— Shared via My Holy Nest`,
        url: watchUrl,
        title,
      });
    } catch {
      Alert.alert('Share failed', "The live stream couldn't be shared right now.");
    }
  }, [title, watchUrl, isLive, church?.name]);

  // The Give tab is a sibling of the Mass stack, so the offering screen is
  // reached through the parent tab navigator.
  const openDonate = useCallback(() => {
    const parent = navigation.getParent();
    const target = parent ?? navigation;
    (target as any).navigate(Routes.GiveTab, {
      screen: Routes.MakeOffering,
      initial: false,
      params: { offeringType: 'Mass Offering' },
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.primary.navyDark} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={shareStream} hitSlop={8}>
          <MaterialCommunityIcons name="share-variant-outline" size={20} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <View style={styles.playerContainer}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      </View>

      <ScrollView style={styles.bottom} showsVerticalScrollIndicator={false}>
        {/* Mass Info */}
        <View style={styles.infoCard}>
          <Text style={styles.massTitle}>{title}</Text>
          <Text style={styles.massSubtitle}>{church?.name}</Text>
          {stream && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.neutral.gray400} />
                <Text style={styles.statText}>
                  {stream.status === 'live' ? 'Started' : 'Starts'}{' '}
                  {new Date(stream.scheduledAt).toLocaleString('en-IN', {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isLiked && styles.actionBtnActive]}
              onPress={() => setIsLiked(l => !l)}>
              <MaterialCommunityIcons
                name="hands-pray"
                size={18}
                color={isLiked ? Colors.accent.goldDark : Colors.neutral.gray600}
              />
              <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextActive]}>
                {isLiked ? 'Praying' : 'Pray'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={shareStream}>
              <MaterialCommunityIcons name="share-variant-outline" size={18} color={Colors.neutral.gray600} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={openDonate}>
              <MaterialCommunityIcons name="hand-heart-outline" size={18} color={Colors.neutral.gray600} />
              <Text style={styles.actionBtnText}>Donate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live chat happens on YouTube; the app doesn't host one. */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(watchUrl)}>
            <MaterialCommunityIcons name="youtube" size={18} color={Colors.neutral.gray600} />
            <Text style={styles.actionBtnText}>Open in YouTube for live chat</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.navyDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: 12,
    backgroundColor: Colors.primary.navyDark,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.sm },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.semantic.error,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    alignSelf: 'center',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 4 },
  liveText: { color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 1 },
  headerTitle: { color: Colors.neutral.white, fontSize: 14, fontWeight: '600' },
  shareBtn: { padding: 4 },

  playerContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  webview: { flex: 1 },

  bottom: { flex: 1, backgroundColor: Colors.neutral.warmWhite },

  infoCard: {
    padding: Spacing.screen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  massTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary.navy, marginBottom: 4 },
  massSubtitle: { fontSize: 13, color: Colors.neutral.gray500, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  statText: { fontSize: 12, color: Colors.neutral.gray400 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionsRow: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.gray100,
    gap: 4,
  },
  actionBtnActive: { backgroundColor: Colors.accent.goldPale, borderWidth: 1, borderColor: Colors.accent.gold },
  actionBtnText: { fontSize: 13, color: Colors.neutral.gray600, fontWeight: '500' },
  actionBtnTextActive: { color: Colors.accent.goldDark },

  section: { padding: Spacing.screen },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.md },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  commentAvatarText: { color: Colors.neutral.white, fontWeight: '700', fontSize: 14 },
  commentBubble: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    ...Shadow.sm,
  },
  commentUser: { fontSize: 12, fontWeight: '600', color: Colors.primary.navy },
  commentText: { fontSize: 13, color: Colors.neutral.gray700, marginTop: 2 },
  commentTime: { fontSize: 11, color: Colors.neutral.gray400, marginLeft: Spacing.sm },
});
