import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '../../../components/common/ActionSheet';
import { LoadError } from '../../../components/common/LoadError';
import { showToast } from '../../../components/common/toast';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { followApi } from '../../../services/followApi';
import { clayColors } from '../../../theme/colors';
import { useAuthSession } from '../../auth/authSession';
import { CommentModal } from '../../comment/components/CommentModal';
import { feedEvents } from '../../feed/feedEvents';
import { feedService } from '../../feed/services/feedService';
import type { Post } from '../../feed/types';
import { SharePostModal } from '../../post/components/SharePostModal';
import { ReportModal } from '../../report/ReportModal';
import type { ReportTarget } from '../../report/reportService';
import { ReelOverlay } from '../components/ReelOverlay';
import { ReelPlayer } from '../components/ReelPlayer';
import { useReelViewTracker } from '../hooks/useReelViewTracker';
import { reelService } from '../services/reelService';
import type { ReelViewStats } from '../types';

/** Ask for the next batch when this many reels are left below the current one. */
const PREFETCH_REMAINING = 3;
const SAMPLE_NOTICE = 'Đây là video mẫu. Tính năng này hoạt động khi có video thật.';
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 80 };

type ReelRowProps = {
  bottomInset: number;
  canFollow: boolean;
  height: number;
  isActive: boolean;
  isMuted: boolean;
  /** Only the current reel and its neighbours hold a video player. */
  isNear: boolean;
  onAction: (action: ReelAction, post: Post) => void;
  onViewEnd: (post: Post, stats: ReelViewStats) => void;
  post: Post;
};

type ReelAction =
  | 'author'
  | 'comments'
  | 'follow'
  | 'like'
  | 'menu'
  | 'mute'
  | 'save'
  | 'share';

const ReelRow = memo(function ReelRow({
  bottomInset,
  canFollow,
  height,
  isActive,
  isMuted,
  isNear,
  onAction,
  onViewEnd,
  post,
}: ReelRowProps) {
  const navigation = useAppNavigation();
  const media = post.media[0];

  return (
    <View style={[styles.row, { height }]}>
      {isNear && media ? (
        <ReelPlayer
          isActive={isActive}
          isMuted={isMuted}
          media={media}
          onDoubleTap={post.isLiked ? undefined : () => onAction('like', post)}
          onViewEnd={(stats) => onViewEnd(post, stats)}
        />
      ) : null}
      <ReelOverlay
        bottomInset={bottomInset}
        canFollow={canFollow}
        isMuted={isMuted}
        onFollow={() => onAction('follow', post)}
        onOpenComments={() => onAction('comments', post)}
        onOpenMenu={() => onAction('menu', post)}
        onPressAuthor={() => onAction('author', post)}
        onPressHashtag={navigation.openHashtag}
        onPressMention={navigation.openMention}
        onShare={() => onAction('share', post)}
        onToggleLike={() => onAction('like', post)}
        onToggleMute={() => onAction('mute', post)}
        onToggleSave={() => onAction('save', post)}
        post={post}
      />
      {post.isSample ? (
        <View pointerEvents="none" style={styles.sampleBadge}>
          <ClayText style={styles.sampleBadgeText} variant="meta">
            Video mẫu
          </ClayText>
        </View>
      ) : null}
    </View>
  );
});

type ReelsFeedProps = {
  /** False while the host screen is not the one on screen: playback stops. */
  isActive: boolean;
};

/**
 * Vertical, full-height feed of short videos. Rendered inside the Home tab,
 * so the tab bar stays where it is.
 */
export function ReelsFeed({ isActive }: ReelsFeedProps) {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { user } = useAuthSession();
  const tracker = useReelViewTracker();

  const [reels, setReels] = useState<Post[]>([]);
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [followedIds, setFollowedIds] = useState<ReadonlySet<string>>(new Set());
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const reelsRef = useRef<Post[]>([]);
  reelsRef.current = reels;
  /** Which recommendation response each reel came from, for the view log. */
  const requestIdsRef = useRef(new Map<string, string>());
  const isFetchingRef = useRef(false);

  // ── Loading ───────────────────────────────────────────────────────────
  const loadBatch = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const current = reset ? [] : reelsRef.current;
      const batch = await reelService.getFeed(current.map((reel) => reel.id));

      batch.items.forEach((reel) => requestIdsRef.current.set(reel.id, batch.requestId));

      const known = new Set(current.map((reel) => reel.id));

      setReels([...current, ...batch.items.filter((reel) => !known.has(reel.id))]);
      setReachedEnd(batch.items.length === 0);
      setLoadFailed(false);

      if (reset) {
        setActiveIndex(0);
      }
    } catch (error) {
      console.error('Failed to load reels:', error);
      setLoadFailed(true);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadBatch(true).finally(() => setIsLoading(false));
  }, [loadBatch]);

  useEffect(() => {
    if (!reachedEnd && !loadFailed && reels.length - activeIndex <= PREFETCH_REMAINING) {
      void loadBatch(false);
    }
  }, [activeIndex, loadBatch, loadFailed, reachedEnd, reels.length]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBatch(true);
    setIsRefreshing(false);
  }, [loadBatch]);

  // ── Changes made in the comment sheet or on other screens ─────────────
  useEffect(() => {
    const unsubscribers = [
      feedEvents.on('commentAdded', ({ commentsCount, postId }) => {
        setReels((current) =>
          current.map((reel) => (reel.id === postId ? { ...reel, commentsCount } : reel)),
        );
      }),
      feedEvents.on('postUpdated', (updated) => {
        setReels((current) => current.map((reel) => (reel.id === updated.id ? updated : reel)));
      }),
      feedEvents.on('postHidden', ({ authorId, postId }) => {
        setReels((current) =>
          current.filter((reel) => reel.id !== postId && reel.author.id !== authorId),
        );
      }),
      feedEvents.on('followChanged', ({ isFollowing, userId }) => {
        setFollowedIds((current) => {
          const next = new Set(current);

          if (isFollowing) {
            next.add(userId);
          } else {
            next.delete(userId);
          }

          return next;
        });
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  // ── Which reel is on screen ───────────────────────────────────────────
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];

    if (first?.index !== null && first?.index !== undefined) {
      setActiveIndex(first.index);
    }
  }).current;

  const handleViewEnd = useCallback(
    (post: Post, stats: ReelViewStats) => {
      tracker.trackView(
        {
          position: reelsRef.current.findIndex((reel) => reel.id === post.id),
          post,
          requestId: requestIdsRef.current.get(post.id) ?? '',
        },
        stats,
      );
    },
    [tracker],
  );

  // ── Actions ───────────────────────────────────────────────────────────
  const toggleFlag = useCallback(
    async (post: Post, flag: 'isLiked' | 'isSaved') => {
      const optimistic: Post =
        flag === 'isLiked'
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: Math.max(0, post.likesCount + (post.isLiked ? -1 : 1)),
            }
          : { ...post, isSaved: !post.isSaved };

      // Sample reels have no server record: the change stays on the device.
      if (post.isSample) {
        setReels((current) => current.map((reel) => (reel.id === post.id ? optimistic : reel)));
        return;
      }

      feedEvents.emitPostUpdated(optimistic);

      if (optimistic[flag]) {
        tracker.track(flag === 'isLiked' ? 'LIKE' : 'SAVE', {
          position: reelsRef.current.findIndex((reel) => reel.id === post.id),
          post,
          requestId: requestIdsRef.current.get(post.id) ?? '',
        });
      }

      try {
        await (flag === 'isLiked' ? feedService.toggleLike(post) : feedService.toggleSave(post));
      } catch {
        feedEvents.emitPostUpdated(post);
        showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
      }
    },
    [tracker],
  );

  const handleAction = useCallback(
    (action: ReelAction, post: Post) => {
      if (action === 'mute') {
        setIsMuted((muted) => !muted);
        return;
      }

      if (action === 'like' || action === 'save') {
        void toggleFlag(post, action === 'like' ? 'isLiked' : 'isSaved');
        return;
      }

      if (action === 'menu') {
        setMenuPost(post);
        return;
      }

      // Everything below talks to the API about this post or its author.
      if (post.isSample) {
        showToast(SAMPLE_NOTICE);
        return;
      }

      if (action === 'comments') {
        setCommentPost(post);
      } else if (action === 'share') {
        setSharePost(post);
      } else if (action === 'author') {
        navigation.openProfile(post.author.id);
      } else if (action === 'follow') {
        followApi
          .follow(post.author.id)
          .catch(() => showToast('Không theo dõi được. Vui lòng thử lại.', 'error'));
      }
    },
    [navigation, toggleFlag],
  );

  const handleNotInterested = useCallback(
    (post: Post) => {
      setReels((current) => current.filter((reel) => reel.id !== post.id));
      tracker.track('NOT_INTERESTED', {
        position: reelsRef.current.findIndex((reel) => reel.id === post.id),
        post,
        requestId: requestIdsRef.current.get(post.id) ?? '',
      });
      void reelService.notInterested(post.id).catch(() => undefined);
      showToast('Đã ẩn video. Chúng tôi sẽ gợi ý ít nội dung tương tự hơn.');
    },
    [tracker],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(Math.round(event.nativeEvent.layout.height));
  }, []);

  // The tab bar is part of the layout below this pane, so only a small margin is needed.
  const bottomInset = 12;

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: Post }) => (
      <ReelRow
        bottomInset={bottomInset}
        canFollow={
          !item.isSample && item.author.id !== user?.id && !followedIds.has(item.author.id)
        }
        height={height}
        isActive={isActive && index === activeIndex}
        isMuted={isMuted}
        isNear={Math.abs(index - activeIndex) <= 1}
        onAction={handleAction}
        onViewEnd={handleViewEnd}
        post={item}
      />
    ),
    [
      activeIndex,
      bottomInset,
      followedIds,
      handleAction,
      handleViewEnd,
      height,
      isActive,
      isMuted,
      user?.id,
    ],
  );

  const menuOptions = useMemo(
    () =>
      menuPost
        ? [
            {
              icon: 'EyeSlash',
              key: 'not-interested',
              label: 'Không quan tâm',
              onPress: () => handleNotInterested(menuPost),
            },
            ...(menuPost.isSample || menuPost.author.id === user?.id
              ? []
              : [
                  {
                    destructive: true,
                    icon: 'Flag',
                    key: 'report',
                    label: 'Báo cáo video',
                    onPress: () => setReportTarget({ id: menuPost.id, type: 'POST' as const }),
                  },
                ]),
          ]
        : [],
    [handleNotInterested, menuPost, user?.id],
  );

  return (
    <View onLayout={handleLayout} style={styles.container}>
      {isLoading || height === 0 ? (
        <ActivityIndicator color={clayColors.onPrimary} size="large" style={styles.fill} />
      ) : loadFailed && reels.length === 0 ? (
        <View style={styles.lightPanel}>
          <LoadError onRetry={handleRefresh} />
        </View>
      ) : (
        <FlatList
          data={reels}
          initialNumToRender={2}
          windowSize={3}
          getItemLayout={(_, index) => ({ index, length: height, offset: height * index })}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={[styles.endCard, { height }]}>
              <ClayText style={styles.endText} variant="heading">
                Chưa có video nào
              </ClayText>
              <ClayText style={styles.endSubtext} variant="body">
                Hãy quay lại sau, hoặc đăng video đầu tiên của bạn.
              </ClayText>
            </View>
          }
          ListFooterComponent={
            reachedEnd && reels.length > 0 ? (
              <View style={[styles.endCard, { height }]}>
                <ClayText style={styles.endText} variant="heading">
                  Bạn đã xem hết video mới
                </ClayText>
                <ClayButton
                  accessibilityLabel="Tải lại danh sách video"
                  onPress={handleRefresh}
                  size="sm"
                  title="Làm mới"
                  variant="secondary"
                />
              </View>
            ) : null
          }
          maxToRenderPerBatch={2}
          onViewableItemsChanged={onViewableItemsChanged}
          pagingEnabled
          refreshControl={
            <RefreshControl
              colors={[clayColors.primary]}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
              tintColor={clayColors.onPrimary}
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={VIEWABILITY_CONFIG}
        />
      )}

      <CommentModal
        onClose={() => setCommentPost(null)}
        post={commentPost}
        visible={commentPost !== null}
      />

      {sharePost ? (
        <SharePostModal
          canRepost={sharePost.author.id !== user?.id}
          onClose={() => setSharePost(null)}
          onToggleRepost={() => {
            feedService
              .toggleRepost(sharePost)
              .then((updated) => {
                feedEvents.emitPostUpdated(updated);
                showToast(updated.isReposted ? 'Đã đăng lại video.' : 'Đã huỷ đăng lại.');
              })
              .catch(() => showToast('Không đăng lại được. Vui lòng thử lại.', 'error'));
          }}
          post={sharePost}
          visible
        />
      ) : null}

      <ActionSheet
        onClose={() => setMenuPost(null)}
        options={menuOptions}
        title="Tuỳ chọn video"
        visible={menuPost !== null}
      />

      <ReportModal
        onClose={() => setReportTarget(null)}
        onReported={() => feedEvents.emitPostHidden({ postId: reportTarget?.id })}
        target={reportTarget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: clayColors.text,
    flex: 1,
  },
  endCard: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  endSubtext: {
    color: clayColors.onPrimary,
    opacity: 0.8,
    textAlign: 'center',
  },
  endText: {
    color: clayColors.onPrimary,
    textAlign: 'center',
  },
  fill: {
    flex: 1,
  },
  lightPanel: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  row: {
    backgroundColor: clayColors.text,
    width: '100%',
  },
  sampleBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 10,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 16,
  },
  sampleBadgeText: {
    color: clayColors.onPrimary,
  },
});
