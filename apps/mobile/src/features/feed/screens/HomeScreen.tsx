import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentModal } from '../../comment/components/CommentModal';
import { ListFooter } from '../../../components/common/ListFooter';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { LoadError } from '../../../components/common/LoadError';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useIsScreenFocused } from '../../../navigation/useIsScreenFocused';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useUnreadNotifications } from '../../notifications/unreadStore';
import { ReelsFeed } from '../../reel/screens/ReelsFeed';
import { StoriesTray } from '../../stories/components/StoriesTray';
import { FeedEmptyState } from '../components/FeedEmptyState';
import { PostCard } from '../components/PostCard';
import { feedColors, feedSpacing } from '../feedTheme';
import { usePostList } from '../hooks/usePostList';
import { feedService } from '../services/feedService';
import { postKey } from '../services/postMapper';
import type { Post } from '../types';

const fetchFeedPage = (page: number) => feedService.getFeed(page);
const acceptCreated = () => true;

type HomePane = 'feed' | 'reels';

const PANES: Array<{ key: HomePane; label: string }> = [
  { key: 'feed', label: 'Bảng tin' },
  { key: 'reels', label: 'Reels' },
];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const feed = usePostList(fetchFeedPage, { acceptCreated });
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [pane, setPane] = useState<HomePane>('feed');
  const isFocused = useIsScreenFocused();
  const navigation = useAppNavigation();
  const unreadNotifications = useUnreadNotifications();
  const [storiesKey, setStoriesKey] = useState(0);
  const paneOpacity = useRef(new Animated.Value(1)).current;

  // Fade the new pane in instead of swapping it instantly.
  const switchPane = useCallback(
    (next: HomePane) => {
      if (next === pane) {
        return;
      }

      setPane(next);
      paneOpacity.setValue(0);
      Animated.timing(paneOpacity, { duration: 180, toValue: 1, useNativeDriver: true }).start();
    },
    [pane, paneOpacity],
  );

  // ── Render helpers ────────────────────────────────────────────────────
  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPressComment={setActiveCommentPost}
        onToggleLike={feed.toggleLike}
        onToggleSave={feed.toggleSave}
      />
    ),
    [feed.toggleLike, feed.toggleSave],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (feed.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={feedColors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ClayText variant="title" style={styles.headerTitle}>
          Mobile Social
        </ClayText>
        <View style={styles.headerRight}>
        <View style={styles.paneSwitch}>
          {PANES.map((item) => {
            const isActive = item.key === pane;

            return (
              <Pressable
                accessibilityLabel={`Xem ${item.label}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={item.key}
                hitSlop={6}
                onPress={() => switchPane(item.key)}
                style={[styles.paneButton, isActive && styles.paneButtonActive]}
              >
                <ClayText
                  variant="caption"
                  style={isActive ? styles.paneTextActive : undefined}
                >
                  {item.label}
                </ClayText>
              </Pressable>
            );
          })}
        </View>
          <Pressable
            accessibilityLabel={
              unreadNotifications > 0
                ? `Thông báo, ${unreadNotifications} chưa đọc`
                : 'Thông báo'
            }
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => navigation.open('Notifications')}
            style={styles.bellButton}
          >
            <ClayIcon color={feedColors.text} name="Bell" size={24} />
            {unreadNotifications > 0 ? (
              <View style={styles.bellBadge}>
                <ClayText variant="meta" style={styles.bellBadgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </ClayText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.list, { opacity: paneOpacity }]}>
      {pane === 'reels' ? (
        // Rendered inside this tab (not a separate screen) so the tab bar stays put.
        <ReelsFeed isActive={isFocused} />
      ) : feed.loadFailed && feed.posts.length === 0 ? (
        <LoadError onRetry={feed.refresh} />
      ) : (
        <FlatList
          contentContainerStyle={
            feed.posts.length === 0 ? styles.emptyContainer : styles.listContent
          }
          data={feed.posts}
          keyExtractor={postKey}
          ListEmptyComponent={
            <FeedEmptyState onFindPeople={() => navigation.openTab('Search')} />
          }
          ListHeaderComponent={<StoriesTray refreshKey={storiesKey} />}
          ListFooterComponent={
            <ListFooter
              endMessage="Bạn đã lướt quá nhiều rồi, đi ngủ đi"
              hasItems={feed.posts.length > 0}
              hasMore={feed.hasMore}
              isLoadingMore={feed.isLoadingMore}
              loadMoreFailed={feed.loadMoreFailed}
              onRetry={feed.loadMore}
            />
          }
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          onEndReached={feed.loadMore}
          onEndReachedThreshold={0.5}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              colors={[feedColors.primary]}
              onRefresh={() => {
                setStoriesKey((key) => key + 1);
                void feed.refresh();
              }}
              refreshing={feed.isRefreshing}
              tintColor={feedColors.primary}
            />
          }
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
      </Animated.View>

      <CommentModal
        onClose={() => setActiveCommentPost(null)}
        post={activeCommentPost}
        visible={!!activeCommentPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: feedColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: feedColors.background,
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    backgroundColor: feedColors.background,
    borderBottomColor: feedColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    color: feedColors.text,
  },
  list: {
    flex: 1,
  },
  paneButton: {
    alignItems: 'center',
    borderRadius: clayRadii.media - 2,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget - 12,
    paddingHorizontal: 12,
  },
  paneButtonActive: {
    backgroundColor: clayColors.surfaceHigh,
  },
  paneSwitch: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.media,
    flexDirection: 'row',
    padding: 2,
  },
  paneTextActive: {
    color: clayColors.text,
    fontFamily: fontFamilies.bold,
  },
  listContent: {
    paddingBottom: 24,
  },
  bellBadge: {
    alignItems: 'center',
    backgroundColor: clayColors.error,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 2,
    top: 4,
  },
  bellBadgeText: {
    color: clayColors.onPrimary,
    fontSize: 10,
    lineHeight: 14,
  },
  bellButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
});
