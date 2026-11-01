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
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { useUnreadNotifications } from '../../notifications/unreadStore';
import { ReelsFeed } from '../../reel/screens/ReelsFeed';
import { StoriesTray } from '../../stories/components/StoriesTray';
import { FeedEmptyState } from '../components/FeedEmptyState';
import { PostCard } from '../components/PostCard';
import { feedColors } from '../feedTheme';
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {/* The product's mark beside its name; the name is the screen's h1. */}
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={styles.mark}
          >
            <ClayText style={styles.markText} variant="caption">
              MS
            </ClayText>
          </View>
          <ClayText level={1} numberOfLines={1} style={styles.headerTitle} variant="title">
            Mobile Social
          </ClayText>
          <Pressable
            accessibilityLabel={
              unreadNotifications > 0
                ? `Thông báo, ${unreadNotifications} chưa đọc`
                : 'Thông báo'
            }
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => navigation.open('Notifications')}
            style={({ pressed }) => [styles.bellButton, pressed && styles.bellPressed]}
          >
            <ClayIcon color={feedColors.text} name="Bell" size={22} />
            {unreadNotifications > 0 ? (
              <View style={styles.bellBadge}>
                <ClayText style={[styles.bellBadgeText, tabularNums]} variant="meta">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </ClayText>
              </View>
            ) : null}
          </Pressable>
        </View>
        <View accessibilityRole="tablist" style={styles.paneSwitch}>
          {PANES.map((item) => {
            const isActive = item.key === pane;

            return (
              <Pressable
                accessibilityLabel={`Xem ${item.label}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={item.key}
                onPress={() => switchPane(item.key)}
                style={[styles.paneButton, isActive && styles.paneButtonActive]}
              >
                <ClayText
                  style={[styles.paneText, isActive && styles.paneTextActive]}
                  variant="caption"
                >
                  {item.label}
                </ClayText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Animated.View style={[styles.list, { opacity: paneOpacity }]}>
      {pane === 'reels' ? (
        // Rendered inside this tab (not a separate screen) so the tab bar stays put.
        <ReelsFeed isActive={isFocused} />
      ) : feed.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={feedColors.caption} size="large" />
        </View>
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
          ListHeaderComponent={
            <View style={styles.trayWrap}>
              <StoriesTray refreshKey={storiesKey} />
            </View>
          }
          ListFooterComponent={
            <ListFooter
              endMessage="Bạn đã xem hết bài viết mới."
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

const BADGE_HEIGHT = 18;

const styles = StyleSheet.create({
  bellBadge: {
    alignItems: 'center',
    backgroundColor: clayColors.primary,
    // A ring in the header's colour keeps the count apart from the bell's outline.
    borderColor: clayColors.surface,
    borderRadius: (BADGE_HEIGHT + 4) / 2,
    borderWidth: 2,
    height: BADGE_HEIGHT + 4,
    justifyContent: 'center',
    left: 22,
    minWidth: BADGE_HEIGHT + 4,
    paddingHorizontal: 4,
    position: 'absolute',
    top: 4,
  },
  bellBadgeText: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    lineHeight: 14,
  },
  bellButton: {
    alignItems: 'center',
    borderRadius: clayRadii.control,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    // The bell's glyph, not its touch area, lines up with the right margin.
    marginRight: -11,
    width: clayDimensions.minTouchTarget,
  },
  bellPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: feedColors.background,
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: feedColors.surface,
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    paddingBottom: claySpacing.sm,
    paddingHorizontal: clayDimensions.gutter,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: claySpacing.xl,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: clayColors.primary,
    borderRadius: clayRadii.control,
    height: 28,
    justifyContent: 'center',
    marginRight: claySpacing.sm,
    width: 28,
  },
  markText: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  paneButton: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: clayRadii.control,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: claySpacing.md,
  },
  paneButtonActive: {
    backgroundColor: clayColors.primarySoft,
    borderColor: clayColors.primaryTrack,
  },
  paneSwitch: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: claySpacing.xs,
  },
  paneText: {
    color: clayColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  paneTextActive: {
    color: clayColors.primaryInk,
    fontFamily: fontFamilies.semiBold,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
  },
  trayWrap: {
    backgroundColor: feedColors.surface,
    marginBottom: claySpacing.sm,
  },
});
