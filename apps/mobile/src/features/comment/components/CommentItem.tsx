import { memo, useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import type { PostComment } from '../types';

const AVATAR_SIZE = 36;

function CommentAuthorAvatar({ author }: { author: PostComment['author'] }) {
  const name = author.displayName?.trim() || author.username;
  const initials = name
    .split(' ')
    .filter(Boolean)
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
            {initials || '?'}
          </ClayText>
        </View>
      )}
    </View>
  );
}

export type CommentItemProps = {
  comment: PostComment;
  onToggleLike: (comment: PostComment) => void;
};

/**
 * CommentItem component (memoized, lite clay tier)
 * Uses lightweight flat row with subtle border divider (zero extra shadow layers).
 */
export const CommentItem = memo(function CommentItem({
  comment,
  onToggleLike,
}: CommentItemProps) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLikePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartScale, {
        duration: 90,
        toValue: 1.35,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        friction: 4,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleLike(comment);
  }, [comment, heartScale, onToggleLike]);

  const displayName = comment.author.displayName?.trim() || comment.author.username;

  return (
    <View style={styles.container}>
      {/* ── Left: Author Avatar ─────────────────────────────── */}
      <CommentAuthorAvatar author={comment.author} />

      {/* ── Center: Author Meta & Content ───────────────────── */}
      <View style={styles.contentWrap}>
        <View style={styles.metaRow}>
          <ClayText variant="caption" style={styles.displayName} numberOfLines={1}>
            {displayName}
          </ClayText>
          <ClayText variant="meta" style={styles.username} numberOfLines={1}>
            @{comment.author.username}
          </ClayText>
          <ClayText variant="meta" style={styles.dot}>
            ·
          </ClayText>
          <ClayText variant="meta" style={styles.timeAgo}>
            {formatTimeAgo(comment.createdAt)}
          </ClayText>
        </View>

        <ClayText variant="body" style={styles.commentText}>
          {comment.content}
        </ClayText>
      </View>

      {/* ── Right: Like button ──────────────────────────────── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={comment.isLiked ? 'Unlike comment' : 'Like comment'}
        hitSlop={10}
        onPress={handleLikePress}
        style={styles.likeButton}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <ClayIcon
            name="Heart"
            size={18}
            weight={comment.isLiked ? 'fill' : 'duotone'}
            color={comment.isLiked ? clayColors.liked : clayColors.caption}
          />
        </Animated.View>

        {comment.likesCount > 0 ? (
          <ClayText
            variant="meta"
            style={[
              styles.likesCount,
              comment.isLiked ? styles.likesCountLiked : undefined,
            ]}
          >
            {comment.likesCount}
          </ClayText>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
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
    borderRadius: (AVATAR_SIZE + 2) / 2,
    borderWidth: 1.5,
    borderColor: clayColors.surfaceHigh,
  },
  avatarInitials: {
    color: clayColors.primary,
    fontSize: 12,
    fontFamily: fontFamilies.extraBold,
  },
  commentText: {
    color: clayColors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: clayColors.surface,
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contentWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  displayName: {
    color: clayColors.text,
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    maxWidth: 120,
  },
  dot: {
    color: clayColors.caption,
    marginHorizontal: 3,
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    paddingTop: 2,
  },
  likesCount: {
    color: clayColors.caption,
    marginTop: 2,
  },
  likesCountLiked: {
    color: clayColors.liked,
    fontFamily: fontFamilies.bold,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  timeAgo: {
    color: clayColors.caption,
  },
  username: {
    color: clayColors.caption,
    marginLeft: 4,
    maxWidth: 90,
  },
});
