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
import { fontFamilies } from '../../../theme/typography';
import { feedRadii, feedSpacing } from '../feedTheme';
import { clayDimensions } from '../../../theme/spacing';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import type { Post, PostMedia } from '../types';
import { useAuthSession } from '../../auth/authSession';
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
const CARD_HORIZONTAL_MARGIN = feedSpacing.cardPadding;
const MEDIA_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const AVATAR_SIZE = 44;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders the author's avatar with clay halo and fallback initials. */
function Avatar({ author }: { author: Post['author'] }) {
  const initials = (author.displayName ?? author.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarHalo}>
      {author.avatarUrl ? (
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
      )}
    </View>
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
        source={{ uri: media.url }}
        style={[styles.mediaSingleImage, !loaded && styles.hidden]}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
}

function MediaGrid({ items }: { items: PostMedia[] }) {
  if (items.length === 1) {
    return <SingleImage media={items[0]} />;
  }

  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) => item.id}
      pagingEnabled
      renderItem={({ item }) => (
        <View style={styles.carouselItem}>
          <Image
            source={{ uri: item.url }}
            style={styles.carouselImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
      )}
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    />
  );
}

// ---------------------------------------------------------------------------
// Main PostCard (memoized)
// ---------------------------------------------------------------------------

export type PostCardProps = {
  onPressComment?: (post: Post) => void;
  onToggleLike?: (post: Post) => void;
  onToggleSave?: (post: Post) => void;
  post: Post;
};

export const PostCard = memo(function PostCard({
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

  const isAuthor = Boolean(user && user.id === post.author.id);

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

  const handleSave = useCallback(() => {
    onToggleSave?.(post);
  }, [onToggleSave, post]);

  const displayName = post.author.displayName ?? post.author.username;

  const privacyIconName =
    post.privacy === 'FRIENDS'
      ? 'Users'
      : post.privacy === 'ONLY_ME'
        ? 'LockKey'
        : 'GlobeSimple';

  return (
    <ClaySurface variant="raisedLite" style={styles.card}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <Avatar author={post.author} />
        <View style={styles.headerText}>
          <ClayText variant="heading" style={styles.displayName} numberOfLines={1}>
            {displayName}
          </ClayText>
          <View style={styles.headerMeta}>
            <ClayText variant="meta" style={styles.username}>
              @{post.author.username}
            </ClayText>
            <ClayText variant="meta" style={styles.dot}>
              ·
            </ClayText>
            <ClayText variant="meta" style={styles.timestamp}>
              {formatTimeAgo(post.createdAt)}
            </ClayText>
            {Boolean(post.privacy) && (
              <>
                <ClayText variant="meta" style={styles.dot}>
                  ·
                </ClayText>
                <ClayIcon
                  name={privacyIconName}
                  size={12}
                  weight="bold"
                  color={clayColors.caption}
                />
              </>
            )}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={10}
          onPress={() => setIsOptionsModalOpen(true)}
          style={styles.moreButton}
        >
          <ClayIcon name="DotsThree" size={22} weight="bold" color={clayColors.caption} />
        </Pressable>
      </View>

      {/* ── Content ────────────────────────────────────────── */}
      {post.content.trim().length > 0 && (
        <ClayText variant="body" style={styles.content}>
          {post.content}
        </ClayText>
      )}

      {/* ── Media ──────────────────────────────────── */}
      {post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <MediaGrid items={post.media} />
        </View>
      )}

      {/* ── Action Bar ─────────────────────────────────────── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.isLiked ? 'Unlike post' : 'Like post'}
            onPress={handleLike}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <ClayIcon
                name="Heart"
                size={22}
                weight={post.isLiked ? 'fill' : 'duotone'}
                color={post.isLiked ? clayColors.liked : clayColors.caption}
              />
            </Animated.View>
            {post.likesCount > 0 && (
              <ClayText
                variant="caption"
                style={[styles.actionCount, post.isLiked && styles.actionCountLiked]}
              >
                {formatCount(post.likesCount)}
              </ClayText>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Comments"
            onPress={() => onPressComment?.(post)}
            style={styles.actionButton}
            hitSlop={8}
          >
            <ClayIcon name="ChatCircle" size={22} weight="duotone" color={clayColors.caption} />
            {post.commentsCount > 0 && (
              <ClayText variant="caption" style={styles.actionCount}>
                {formatCount(post.commentsCount)}
              </ClayText>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share post"
            onPress={() => setIsShareModalOpen(true)}
            style={styles.actionButton}
            hitSlop={8}
          >
            <ClayIcon name="ShareNetwork" size={22} weight="duotone" color={clayColors.caption} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.isSaved ? 'Unsave post' : 'Save post'}
          onPress={handleSave}
          style={styles.actionButton}
          hitSlop={8}
        >
          <ClayIcon
            name="BookmarkSimple"
            size={22}
            weight={post.isSaved ? 'fill' : 'duotone'}
            color={post.isSaved ? clayColors.saved : clayColors.caption}
          />
        </Pressable>
      </View>

      {/* ── Modals ─────────────────────────────────────────── */}
      <PostOptionsModal
        isAuthor={isAuthor}
        isSaved={post.isSaved}
        onChangePrivacy={() => setIsPrivacyModalOpen(true)}
        onClose={() => setIsOptionsModalOpen(false)}
        onDelete={() => setIsDeleteModalOpen(true)}
        onEdit={() => setIsEditModalOpen(true)}
        onSave={handleSave}
        onShare={() => setIsShareModalOpen(true)}
        post={post}
        visible={isOptionsModalOpen}
      />

      <SharePostModal
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        visible={isShareModalOpen}
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
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    minWidth: clayDimensions.minTouchTarget,
    paddingHorizontal: 8,
  },
  actionCount: {
    color: clayColors.caption,
    fontSize: 12,
    marginLeft: 4,
  },
  actionCountLiked: {
    color: clayColors.liked,
  },
  actions: {
    alignItems: 'center',
    borderTopColor: clayColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionsLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  avatarHalo: {
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: clayColors.surfaceHigh,
    shadowColor: 'rgb(150,84,96)',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitials: {
    color: clayColors.caption,
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  card: {
    marginBottom: feedSpacing.cardGap,
    marginHorizontal: feedSpacing.cardPadding,
    overflow: 'hidden',
  },
  carousel: {
    width: MEDIA_WIDTH,
  },
  carouselImage: {
    borderRadius: feedRadii.media,
    borderWidth: 1,
    borderColor: clayColors.border,
    height: MEDIA_WIDTH * 0.65,
    width: MEDIA_WIDTH - feedSpacing.cardPadding * 2 - 8,
  },
  carouselItem: {
    paddingRight: 8,
  },
  content: {
    lineHeight: 22,
    paddingBottom: 10,
    paddingHorizontal: feedSpacing.cardPadding,
  },
  displayName: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  dot: {
    marginHorizontal: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: feedSpacing.cardPadding,
    paddingBottom: 8,
  },
  headerMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 2,
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
    paddingBottom: 10,
    paddingHorizontal: feedSpacing.cardPadding,
  },
  mediaPlaceholder: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: feedRadii.media,
    height: MEDIA_WIDTH * 0.65,
    width: '100%',
  },
  mediaSingle: {
    borderRadius: feedRadii.media,
    overflow: 'hidden',
  },
  mediaSingleImage: {
    borderRadius: feedRadii.media,
    borderWidth: 1,
    borderColor: clayColors.border,
    height: MEDIA_WIDTH * 0.65,
    width: '100%',
  },
  moreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  timestamp: {
    fontSize: 12,
  },
  username: {
    fontSize: 12,
  },
});
