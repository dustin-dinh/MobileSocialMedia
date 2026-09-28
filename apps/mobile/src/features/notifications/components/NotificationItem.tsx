import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { notificationsColors, notificationsRadii } from '../notificationsTheme';
import type { AppNotification, NotificationType } from '../types';

const AVATAR_SIZE = 44;

// ---------------------------------------------------------------------------
// Type Badge
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: NotificationType }) {
  let badgeBg: string = notificationsColors.likeBadge;
  let icon = '♥';

  if (type === 'COMMENT') {
    badgeBg = notificationsColors.commentBadge;
    icon = '💬';
  } else if (type === 'FOLLOW') {
    badgeBg = notificationsColors.followBadge;
    icon = '👤';
  }

  return (
    <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
      <Text style={styles.typeBadgeIcon}>{icon}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Actor Avatar with Badge
// ---------------------------------------------------------------------------

function ActorAvatar({
  avatarUrl,
  displayName,
  type,
  username,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  type: NotificationType;
  username: string;
}) {
  const name = displayName?.trim() || username;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarWrapper}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitials}>{initials || '?'}</Text>
        </View>
      )}

      <TypeBadge type={type} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// NotificationItem Component
// ---------------------------------------------------------------------------

export type NotificationItemProps = {
  isFollowPending?: boolean;
  notification: AppNotification;
  onPressItem: (notification: AppNotification) => void;
  onToggleFollowBack: (notification: AppNotification) => void;
};

export function NotificationItem({
  isFollowPending = false,
  notification,
  onPressItem,
  onToggleFollowBack,
}: NotificationItemProps) {
  const followScale = useRef(new Animated.Value(1)).current;

  const handleFollowPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(followScale, {
        duration: 90,
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.spring(followScale, {
        friction: 4,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleFollowBack(notification);
  }, [followScale, notification, onToggleFollowBack]);

  const actorName = notification.actor.displayName?.trim() || notification.actor.username;
  const isRead = notification.isRead;

  return (
    <Pressable
      onPress={() => onPressItem(notification)}
      style={({ pressed }) => [
        styles.container,
        !isRead && styles.containerUnread,
        pressed && styles.containerPressed,
      ]}
    >
      {/* ── Left: Avatar + Badge ─────────────────────────────── */}
      <ActorAvatar
        avatarUrl={notification.actor.avatarUrl}
        displayName={notification.actor.displayName}
        type={notification.type}
        username={notification.actor.username}
      />

      {/* ── Center: Notification Description & Time ─────────── */}
      <View style={styles.contentWrap}>
        <Text style={styles.descriptionText} numberOfLines={3}>
          <Text style={styles.actorName}>{actorName} </Text>
          {notification.type === 'LIKE' && 'đã thích bài viết của bạn.'}
          {notification.type === 'COMMENT' && (
            <>
              đã bình luận: &quot;
              <Text style={styles.commentSnippet}>{notification.commentText}</Text>
              &quot;
            </>
          )}
          {notification.type === 'FOLLOW' && 'đã bắt đầu theo dõi bạn.'}
        </Text>

        <Text style={styles.timeAgo}>{formatTimeAgo(notification.createdAt)}</Text>
      </View>

      {/* ── Right: Post Thumbnail or Follow Back Button ─────── */}
      <View style={styles.rightActionWrap}>
        {notification.type === 'FOLLOW' ? (
          <Animated.View style={{ transform: [{ scale: followScale }] }}>
            <Pressable
              disabled={isFollowPending}
              hitSlop={6}
              onPress={handleFollowPress}
              style={({ pressed }) => [
                styles.followButton,
                notification.isFollowingBack
                  ? styles.followingButton
                  : styles.followBackButton,
                pressed &&
                  (notification.isFollowingBack
                    ? styles.followingButtonPressed
                    : styles.followBackButtonPressed),
              ]}
            >
              {isFollowPending ? (
                <ActivityIndicator
                  color={
                    notification.isFollowingBack
                      ? notificationsColors.text
                      : '#FFFFFF'
                  }
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    notification.isFollowingBack
                      ? styles.followingButtonText
                      : styles.followBackButtonText,
                  ]}
                >
                  {notification.isFollowingBack ? 'Đang theo dõi' : 'Theo dõi lại'}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        ) : notification.postImageUrl ? (
          <Image
            source={{ uri: notification.postImageUrl }}
            style={styles.postThumbnail}
          />
        ) : notification.postPreview ? (
          <View style={styles.postSnippetBox}>
            <Text style={styles.postSnippetText} numberOfLines={2}>
              {notification.postPreview}
            </Text>
          </View>
        ) : null}

        {/* ── Unread Dot ───────────────────────────────────── */}
        {!isRead ? <View style={styles.unreadDot} /> : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  actorName: {
    color: notificationsColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
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
    fontSize: 15,
    fontWeight: '700',
  },
  avatarWrapper: {
    height: AVATAR_SIZE,
    position: 'relative',
    width: AVATAR_SIZE,
  },
  commentSnippet: {
    color: notificationsColors.textSecondary,
    fontStyle: 'italic',
  },
  container: {
    alignItems: 'center',
    backgroundColor: notificationsColors.surface,
    borderBottomColor: notificationsColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  containerPressed: {
    backgroundColor: '#F8FAFC',
  },
  containerUnread: {
    backgroundColor: notificationsColors.surfaceUnread,
  },
  contentWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  descriptionText: {
    color: notificationsColors.text,
    fontSize: 14,
    lineHeight: 19,
  },
  followBackButton: {
    backgroundColor: notificationsColors.primary,
  },
  followBackButtonPressed: {
    backgroundColor: notificationsColors.primaryPressed,
  },
  followBackButtonText: {
    color: '#FFFFFF',
  },
  followButton: {
    alignItems: 'center',
    borderRadius: notificationsRadii.button,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  followingButton: {
    backgroundColor: notificationsColors.surface,
    borderColor: notificationsColors.border,
    borderWidth: 1,
  },
  followingButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  followingButtonText: {
    color: notificationsColors.text,
  },
  postSnippetBox: {
    backgroundColor: '#F1F5F9',
    borderColor: notificationsColors.postThumbBorder,
    borderRadius: notificationsRadii.postThumb,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    padding: 4,
    width: 44,
  },
  postSnippetText: {
    color: notificationsColors.caption,
    fontSize: 9,
    lineHeight: 12,
  },
  postThumbnail: {
    borderColor: notificationsColors.postThumbBorder,
    borderRadius: notificationsRadii.postThumb,
    borderWidth: 1,
    height: 44,
    width: 44,
  },
  rightActionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  timeAgo: {
    color: notificationsColors.caption,
    fontSize: 12,
    marginTop: 4,
  },
  typeBadge: {
    alignItems: 'center',
    borderColor: notificationsColors.surface,
    borderRadius: notificationsRadii.badge,
    borderWidth: 1.5,
    bottom: -2,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 18,
  },
  typeBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  unreadDot: {
    backgroundColor: notificationsColors.unreadDot,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
