import { memo, useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { clayColors } from '../../../theme/colors';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { feedSpacing } from '../feedTheme';
import { clayDimensions, clayRadii } from '../../../theme/spacing';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import type { Post, PostMedia } from '../types';
import { FeedVideo } from './FeedVideo';
import { ReactionPicker } from './ReactionPicker';
import { reactionOf, type ReactionType } from '../reactions';
import { RichText } from '../../../components/common/RichText';
import { showToast } from '../../../components/common/toast';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useAuthSession } from '../../auth/authSession';
import { ReportModal } from '../../report/ReportModal';
import type { ReportTarget } from '../../report/reportService';
import { feedService } from '../services/feedService';
import { PostOptionsModal } from '../../post/components/PostOptionsModal';
import { SharePostModal } from '../../post/components/SharePostModal';
import { EditPostModal } from '../../post/components/EditPostModal';
import { DeletePostModal } from '../../post/components/DeletePostModal';
import { PostPrivacyModal } from '../../post/components/PostPrivacyModal';
import { postService } from '../../post/services/postService';
import { feedEvents } from '../feedEvents';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
// Media runs the content width (inside the page margins) with radius 8, in
// every post; one height for photos so text below starts on the same rhythm.
const MEDIA_WIDTH = SCREEN_WIDTH - feedSpacing.cardPadding * 2;
const MEDIA_HEIGHT = Math.round(MEDIA_WIDTH * 0.75);
// Several photos: each slide leaves the next one peeking in, so it reads as swipeable.
const SLIDE_GAP = 8;
const SLIDE_WIDTH = Math.round(MEDIA_WIDTH * 0.86);
const AVATAR_SIZE = 40;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders the author's avatar with fallback initials. */
function Avatar({ author }: { author: Post['author'] }) {
  const initials = (author.displayName ?? author.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    author.avatarUrl ? (
      <Image
        source={{ uri: author.avatarUrl }}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    ) : (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <ClayText variant="caption" style={styles.avatarInitials}>
          {initials}
        </ClayText>
      </View>
    )
  );
}

/** Compact number formatter (1200 → "1.2K"). */
function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return String(n);
}

// ---------------------------------------------------------------------------
// Media section
// ---------------------------------------------------------------------------

function SingleImage({ media }: { media: PostMedia }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={styles.mediaSingle}>
      {!loaded && <View style={styles.mediaPlaceholder} />}
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: media.url }}
        style={[styles.mediaSingleImage, !loaded && styles.hidden]}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
}

function SlideGap() {
  return <View style={styles.slideGap} />;
}

function MediaGrid({ items, onPressVideo }: { items: PostMedia[]; onPressVideo: () => void }) {
  if (items.length === 1) {
    return items[0].type === 'VIDEO' ? (
      <FeedVideo media={items[0]} onPress={onPressVideo} />
    ) : (
      <SingleImage media={items[0]} />
    );
  }

  return (
    <FlatList
      data={items}
      decelerationRate="fast"
      disableIntervalMomentum
      horizontal
      ItemSeparatorComponent={SlideGap}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: item.url }}
          style={styles.carouselImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={SLIDE_WIDTH + SLIDE_GAP}
      style={styles.carousel}
    />
  );
}

// ---------------------------------------------------------------------------
// Main PostCard (memoized)
// ---------------------------------------------------------------------------

export type PostCardProps = {
  /** The card is the subject of the Post detail screen: tapping it must not reopen it. */
  isDetail?: boolean;
  onPressComment?: (post: Post) => void;
  onToggleLike?: (post: Post) => void;
  onToggleSave?: (post: Post) => void;
  post: Post;
};

export const PostCard = memo(function PostCard({
  isDetail = false,
  onPressComment,
  onToggleLike,
  onToggleSave,
  post,
}: PostCardProps) {
  const { user } = useAuthSession();
  const likeScale = useRef(new Animated.Value(1)).current;

  // ── Modal states ───────────────────────────────────────────────────
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const navigation = useAppNavigation();

  const isAuthor = Boolean(user && user.id === post.author.id);

  const handleToggleRepost = useCallback(async () => {
    try {
      const updated = await feedService.toggleRepost(post);

      feedEvents.emitPostUpdated(updated);
      showToast(
        updated.isReposted ? 'Đã đăng lại lên bảng tin của bạn.' : 'Đã huỷ đăng lại.',
      );
    } catch {
      showToast('Không đăng lại được. Vui lòng thử lại.', 'error');
    }
  }, [post]);

  const handleHide = useCallback(async () => {
    try {
      await feedService.hidePost(post.id);
      feedEvents.emitPostHidden({ postId: post.id });
      showToast('Đã ẩn bài viết khỏi bảng tin.');
    } catch {
      showToast('Không ẩn được bài viết. Vui lòng thử lại.', 'error');
    }
  }, [post.id]);

  const handleLike = useCallback(() => {
    Animated.sequence([
      Animated.timing(likeScale, {
        duration: 100,
        toValue: 1.35,
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        friction: 3,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleLike?.(post);
  }, [likeScale, onToggleLike, post]);

  // Held like button: pick one of the reactions. Picking the current one removes it.
  const likeButtonRef = useRef<View>(null);
  const [reactionAnchor, setReactionAnchor] = useState<{ x: number; y: number } | null>(null);

  const handleReact = useCallback(
    async (type: ReactionType) => {
      setReactionAnchor(null);

      const next = post.myReaction === type ? null : type;

      // Every list showing this post updates through the feed event.
      feedEvents.emitPostUpdated({
        ...post,
        isLiked: next !== null,
        likesCount: post.likesCount + (next !== null ? 1 : 0) - (post.isLiked ? 1 : 0),
        myReaction: next,
      });

      try {
        await feedService.react(post.id, next);
      } catch {
        feedEvents.emitPostUpdated(post);
        showToast('Không gửi được cảm xúc. Vui lòng thử lại.', 'error');
      }
    },
    [post],
  );

  // The plain heart is LIKE; any other reaction shows its own emoji.
  const otherReaction = post.myReaction && post.myReaction !== 'LIKE' ? reactionOf(post.myReaction) : null;

  const handleSave = useCallback(() => {
    onToggleSave?.(post);
  }, [onToggleSave, post]);

  const displayName = post.author.displayName ?? post.author.username;
  const canRepost = !isAuthor && post.privacy !== 'ONLY_ME';

  const privacyIconName =
    post.privacy === 'FRIENDS'
      ? 'Users'
      : post.privacy === 'ONLY_ME'
        ? 'LockKey'
        : 'GlobeSimple';

  const repostBanner = post.repost ? (
    <Pressable
      accessibilityLabel={`Xem trang cá nhân của ${post.repost.by.displayName ?? post.repost.by.username}`}
      accessibilityRole="button"
      onPress={() => navigation.openProfile(post.repost!.by.id)}
      style={styles.repostBanner}
    >
      <ClayIcon name="Repeat" size={14} weight="bold" color={clayColors.caption} />
      <ClayText variant="meta" style={styles.repostBannerText} numberOfLines={1}>
        {post.repost.by.id === user?.id
          ? 'Bạn'
          : (post.repost.by.displayName ?? post.repost.by.username)}{' '}
        đã đăng lại · {formatTimeAgo(post.repost.createdAt)}
      </ClayText>
    </Pressable>
  ) : null;

  // The original of this repost was deleted or is no longer visible.
  if (post.unavailable) {
    return (
      <ClaySurface variant="flat" style={styles.card}>
        {repostBanner}
        <View style={styles.unavailable}>
          <ClayIcon name="EyeSlash" size={20} weight="regular" color={clayColors.caption} />
          <ClayText variant="caption" style={styles.unavailableText}>
            Bài viết này không còn khả dụng.
          </ClayText>
        </View>
      </ClaySurface>
    );
  }

  return (
    <ClaySurface variant="flat" style={styles.card}>
      {repostBanner}
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={`Xem trang cá nhân của ${displayName}`}
          accessibilityRole="button"
          onPress={() => navigation.openProfile(post.author.id)}
          style={styles.authorButton}
        >
        <Avatar author={post.author} />
        <View style={styles.headerText}>
          <ClayText variant="heading" style={styles.displayName} numberOfLines={1}>
            {displayName}
          </ClayText>
          <View style={styles.headerMeta}>
            <ClayText variant="caption" style={styles.metaText} numberOfLines={1}>
              @{post.author.username} · {formatTimeAgo(post.createdAt)}
            </ClayText>
            {Boolean(post.privacy) && (
              <ClayIcon
                name={privacyIconName}
                size={13}
                weight="regular"
                color={clayColors.caption}
              />
            )}
          </View>
        </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={10}
          onPress={() => setIsOptionsModalOpen(true)}
          style={styles.moreButton}
        >
          <ClayIcon name="DotsThree" size={20} weight="bold" color={clayColors.caption} />
        </Pressable>
      </View>

      {/* ── Content ────────────────────────────────────────── */}
      {post.content.trim().length > 0 && (
        <RichText
          onPressHashtag={navigation.openHashtag}
          onPressMention={navigation.openMention}
          onPressText={
            isDetail ? undefined : () => navigation.open('PostDetail', { postId: post.id })
          }
          style={styles.content}
          text={post.content}
        />
      )}

      {/* ── Media ──────────────────────────────────── */}
      {post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <MediaGrid
            items={post.media}
            onPressVideo={() => navigation.open('ReelViewer', { post })}
          />
        </View>
      )}

      {/* ── Action Bar ─────────────────────────────────────── */}
      <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.isLiked ? 'Unlike post' : 'Like post'}
            accessibilityHint="Nhấn giữ để chọn cảm xúc khác"
            delayLongPress={280}
            onLongPress={() =>
              likeButtonRef.current?.measureInWindow((x, y) => setReactionAnchor({ x, y }))
            }
            onPress={handleLike}
            ref={likeButtonRef}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              {otherReaction ? (
                <ClayText style={styles.reactionEmoji} variant="body">
                  {otherReaction.emoji}
                </ClayText>
              ) : (
                <ClayIcon
                  name="Heart"
                  size={20}
                  weight={post.isLiked ? 'fill' : 'regular'}
                  color={post.isLiked ? clayColors.liked : clayColors.caption}
                />
              )}
            </Animated.View>
            <ClayText
              variant="caption"
              style={[styles.actionCount, post.isLiked && styles.actionCountLiked]}
            >
              {formatCount(post.likesCount)}
            </ClayText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Comments"
            onPress={() => onPressComment?.(post)}
            style={styles.actionButton}
            hitSlop={8}
          >
            <ClayIcon name="ChatCircle" size={20} weight="regular" color={clayColors.caption} />
            <ClayText variant="caption" style={styles.actionCount}>
              {formatCount(post.commentsCount)}
            </ClayText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.isReposted ? 'Undo repost' : 'Repost'}
            accessibilityState={{ disabled: !canRepost }}
            disabled={!canRepost}
            onPress={handleToggleRepost}
            style={[styles.actionButton, !canRepost && styles.actionDisabled]}
            hitSlop={8}
          >
            <ClayIcon
              name="Repeat"
              size={20}
              weight={post.isReposted ? 'bold' : 'regular'}
              color={post.isReposted ? clayColors.text : clayColors.caption}
            />
            {(post.repostsCount ?? 0) > 0 && (
              <ClayText
                variant="caption"
                style={[styles.actionCount, post.isReposted && styles.actionCountReposted]}
              >
                {formatCount(post.repostsCount ?? 0)}
              </ClayText>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share post"
            onPress={() => setIsShareModalOpen(true)}
            style={[styles.actionButton, styles.shareButton]}
            hitSlop={8}
          >
            <ClayIcon name="ShareNetwork" size={20} weight="regular" color={clayColors.caption} />
          </Pressable>
      </View>

      <ReactionPicker
        anchor={reactionAnchor}
        onClose={() => setReactionAnchor(null)}
        onSelect={handleReact}
        selected={post.myReaction}
      />

      {/* ── Modals ─────────────────────────────────────────── */}
      <PostOptionsModal
        isAuthor={isAuthor}
        isSaved={post.isSaved}
        onChangePrivacy={() => setIsPrivacyModalOpen(true)}
        onClose={() => setIsOptionsModalOpen(false)}
        onDelete={() => setIsDeleteModalOpen(true)}
        onEdit={() => setIsEditModalOpen(true)}
        onHide={handleHide}
        onReport={() => setReportTarget({ id: post.id, type: 'POST' })}
        onSave={handleSave}
        onShare={() => setIsShareModalOpen(true)}
        post={post}
        visible={isOptionsModalOpen}
      />

      <SharePostModal
        canRepost={canRepost}
        onClose={() => setIsShareModalOpen(false)}
        onToggleRepost={handleToggleRepost}
        post={post}
        visible={isShareModalOpen}
      />

      <ReportModal
        onClose={() => setReportTarget(null)}
        onReported={() => feedEvents.emitPostHidden({ postId: post.id })}
        target={reportTarget}
      />

      <EditPostModal
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        visible={isEditModalOpen}
      />

      <DeletePostModal
        onClose={() => setIsDeleteModalOpen(false)}
        post={post}
        visible={isDeleteModalOpen}
      />

      <PostPrivacyModal
        currentPrivacy={post.privacy ?? 'PUBLIC'}
        onClose={() => setIsPrivacyModalOpen(false)}
        onSelectPrivacy={async (newPrivacy) => {
          try {
            const updated = await postService.updatePrivacy(post.id, newPrivacy, post);
            feedEvents.emitPostUpdated(updated);
          } catch (error) {
            console.error('Update privacy failed:', error);
          }
        }}
        visible={isPrivacyModalOpen}
      />
    </ClaySurface>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: clayDimensions.minTouchTarget,
    minWidth: 72,
    paddingHorizontal: 8,
  },
  actionCount: {
    ...tabularNums,
    color: clayColors.caption,
  },
  reactionEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionCountLiked: {
    color: clayColors.liked,
  },
  actionCountReposted: {
    color: clayColors.text,
  },
  authorButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  repostBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: feedSpacing.cardPadding,
    paddingTop: 8,
  },
  repostBannerText: {
    color: clayColors.caption,
    flexShrink: 1,
  },
  unavailable: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: feedSpacing.cardPadding,
  },
  unavailableText: {
    color: clayColors.caption,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 4,
    // Buttons pad 8px, so the first icon starts on the 16px margin.
    paddingHorizontal: feedSpacing.cardPadding - 8,
  },
  avatar: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: clayColors.primaryInk,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  card: {
    backgroundColor: clayColors.surface,
    marginBottom: feedSpacing.cardGap,
  },
  carousel: {
    borderRadius: clayRadii.media,
    width: MEDIA_WIDTH,
  },
  carouselImage: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.media,
    height: MEDIA_HEIGHT,
    width: SLIDE_WIDTH,
  },
  content: {
    lineHeight: 22,
    paddingBottom: 12,
    paddingHorizontal: feedSpacing.cardPadding,
  },
  displayName: {
    fontSize: 15,
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
    paddingLeft: feedSpacing.cardPadding,
    paddingRight: 4,
    paddingTop: 12,
  },
  headerMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
  },
  mediaContainer: {
    paddingBottom: 4,
    paddingHorizontal: feedSpacing.cardPadding,
  },
  mediaPlaceholder: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.media,
    height: MEDIA_HEIGHT,
    width: '100%',
  },
  mediaSingle: {
    borderRadius: clayRadii.media,
    overflow: 'hidden',
  },
  mediaSingleImage: {
    borderRadius: clayRadii.media,
    height: MEDIA_HEIGHT,
    width: '100%',
  },
  metaText: {
    flexShrink: 1,
  },
  moreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  shareButton: {
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    minWidth: clayDimensions.minTouchTarget,
  },
  slideGap: {
    width: SLIDE_GAP,
  },
});
