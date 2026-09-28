import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { feedColors, feedRadii, feedSpacing } from '../feedTheme';
import type { Post, PostMedia } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HORIZONTAL_MARGIN = feedSpacing.cardPadding;
const MEDIA_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const AVATAR_SIZE = 42;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Renders the author's avatar – falls back to initials when no image. */
function Avatar({ author }: { author: Post['author'] }) {
  const initials = (author.displayName ?? author.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (author.avatarUrl) {
    return <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{initials}</Text>
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
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
}

function MediaGrid({ items }: { items: PostMedia[] }) {
  if (items.length === 1) {
    return <SingleImage media={items[0]} />;
  }

  // Horizontal scrollable carousel for 2+ images
  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) => item.id}
      pagingEnabled
      renderItem={({ item }) => (
        <View style={styles.carouselItem}>
          <Image source={{ uri: item.url }} style={styles.carouselImage} resizeMode="cover" />
        </View>
      )}
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    />
  );
}

// ---------------------------------------------------------------------------
// Icon components (pure RN, no library dependency)
// ---------------------------------------------------------------------------

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <Text style={[styles.iconText, filled && { color: feedColors.liked }]}>
      {filled ? '♥' : '♡'}
    </Text>
  );
}

function CommentIcon() {
  return <Text style={styles.iconText}>💬</Text>;
}

function ShareIcon() {
  return <Text style={styles.iconText}>↗</Text>;
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <Text style={[styles.iconText, filled && { color: feedColors.saved }]}>
      {filled ? '★' : '☆'}
    </Text>
  );
}

function MoreIcon() {
  return <Text style={styles.moreIcon}>•••</Text>;
}

// ---------------------------------------------------------------------------
// Main PostCard
// ---------------------------------------------------------------------------

type PostCardProps = {
  onPressComment?: (post: Post) => void;
  onToggleLike?: (post: Post) => void;
  onToggleSave?: (post: Post) => void;
  post: Post;
};

export function PostCard({
  onPressComment,
  onToggleLike,
  onToggleSave,
  post,
}: PostCardProps) {
  const likeScale = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    // Springy micro-animation on like tap
    Animated.sequence([
      Animated.timing(likeScale, {
        duration: 100,
        toValue: 1.3,
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

  return (
    <View style={styles.card}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <Avatar author={post.author} />
        <View style={styles.headerText}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={styles.username}>@{post.author.username}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <Pressable hitSlop={12} style={styles.moreButton}>
          <MoreIcon />
        </Pressable>
      </View>

      {/* ── Content ────────────────────────────────────────── */}
      {post.content.trim().length > 0 && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* ── Media ──────────────────────────────────────────── */}
      {post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <MediaGrid items={post.media} />
        </View>
      )}

      {/* ── Action Bar ─────────────────────────────────────── */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLike} style={styles.actionButton} hitSlop={8}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <HeartIcon filled={post.isLiked} />
            </Animated.View>
            {post.likesCount > 0 && (
              <Text style={[styles.actionCount, post.isLiked && styles.actionCountLiked]}>
                {formatCount(post.likesCount)}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => onPressComment?.(post)}
            style={styles.actionButton}
            hitSlop={8}
          >
            <CommentIcon />
            {post.commentsCount > 0 && (
              <Text style={styles.actionCount}>{formatCount(post.commentsCount)}</Text>
            )}
          </Pressable>

          <Pressable style={styles.actionButton} hitSlop={8}>
            <ShareIcon />
          </Pressable>
        </View>

        <Pressable onPress={handleSave} style={styles.actionButton} hitSlop={8}>
          <BookmarkIcon filled={post.isSaved} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  actionCount: {
    color: feedColors.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  actionCountLiked: {
    color: feedColors.liked,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: feedSpacing.cardPadding,
    paddingBottom: 12,
    paddingTop: 4,
  },
  actionsLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: feedColors.primary,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: feedColors.surface,
    borderRadius: feedRadii.card,
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginVertical: feedSpacing.cardGap / 2,
    // Subtle shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  carousel: {
    width: MEDIA_WIDTH,
  },
  carouselImage: {
    borderRadius: feedRadii.media,
    height: MEDIA_WIDTH * 0.65,
    width: MEDIA_WIDTH - feedSpacing.cardPadding * 2 - 8,
  },
  carouselItem: {
    paddingRight: 8,
  },
  content: {
    color: feedColors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: feedSpacing.cardPadding,
    paddingBottom: 8,
  },
  displayName: {
    color: feedColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dot: {
    color: feedColors.caption,
    fontSize: 12,
    marginHorizontal: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: feedSpacing.cardPadding,
    paddingBottom: 10,
  },
  headerMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 1,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
  },
  iconText: {
    color: feedColors.caption,
    fontSize: 20,
  },
  mediaContainer: {
    paddingBottom: 8,
    paddingHorizontal: feedSpacing.cardPadding,
  },
  mediaPlaceholder: {
    backgroundColor: feedColors.border,
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
    height: MEDIA_WIDTH * 0.65,
    width: '100%',
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    color: feedColors.caption,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timestamp: {
    color: feedColors.caption,
    fontSize: 13,
  },
  username: {
    color: feedColors.caption,
    fontSize: 13,
  },
});
