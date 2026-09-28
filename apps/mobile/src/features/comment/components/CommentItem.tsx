import { useCallback, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { commentColors, commentRadii } from '../commentTheme';
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

  if (author.avatarUrl) {
    return <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{initials || '?'}</Text>
    </View>
  );
}

export type CommentItemProps = {
  comment: PostComment;
  onToggleLike: (comment: PostComment) => void;
};

export function CommentItem({ comment, onToggleLike }: CommentItemProps) {
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
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{comment.author.username}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>

        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      {/* ── Right: Like button ──────────────────────────────── */}
      <Pressable
        hitSlop={10}
        onPress={handleLikePress}
        style={styles.likeButton}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Text
            style={[
              styles.heartIcon,
              comment.isLiked ? styles.heartLiked : styles.heartUnliked,
            ]}
          >
            {comment.isLiked ? '♥' : '♡'}
          </Text>
        </Animated.View>

        {comment.likesCount > 0 ? (
          <Text
            style={[
              styles.likesCount,
              comment.isLiked ? styles.likesCountLiked : undefined,
            ]}
          >
            {comment.likesCount}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  commentText: {
    color: commentColors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  contentWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  displayName: {
    color: commentColors.text,
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 120,
  },
  dot: {
    color: commentColors.caption,
    fontSize: 13,
    marginHorizontal: 3,
  },
  heartIcon: {
    fontSize: 16,
  },
  heartLiked: {
    color: commentColors.liked,
  },
  heartUnliked: {
    color: commentColors.unliked,
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    paddingTop: 2,
  },
  likesCount: {
    color: commentColors.caption,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  likesCountLiked: {
    color: commentColors.liked,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  timeAgo: {
    color: commentColors.caption,
    fontSize: 12,
  },
  username: {
    color: commentColors.caption,
    fontSize: 13,
    marginLeft: 4,
    maxWidth: 90,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: commentColors.surface,
    borderBottomColor: commentColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
