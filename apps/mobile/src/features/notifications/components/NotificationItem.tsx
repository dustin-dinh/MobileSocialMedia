import { memo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { notificationsColors, notificationsRadii } from '../notificationsTheme';
import type { AppNotification, NotificationType } from '../types';

const AVATAR_SIZE = 44;

// ---------------------------------------------------------------------------
// Type Badge
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: NotificationType }) {
  let badgeBg: string = notificationsColors.likeBadge;
  let iconName: 'Heart' | 'ChatCircle' | 'User' = 'Heart';

  if (type === 'COMMENT') {
    badgeBg = notificationsColors.commentBadge;
    iconName = 'ChatCircle';
  } else if (type === 'FOLLOW') {
    badgeBg = notificationsColors.followBadge;
    iconName = 'User';
  }

  return (
    <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
      <ClayIcon name={iconName} size={10} color={notificationsColors.onPrimary} weight="fill" />
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
        <Image
          source={{ uri: avatarUrl }}
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

      <TypeBadge type={type} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// NotificationItem Component (memoized)
// ---------------------------------------------------------------------------

export type NotificationItemProps = {
  isFollowPending?: boolean;
  notification: AppNotification;
  onPressItem: (notification: AppNotification) => void;
  onToggleFollowBack: (notification: AppNotification) => void;
};

/**
 * NotificationItem component (memoized, lite clay tier)
 * Uses lightweight row layout with subtle border and elevation 2 on badge (<= 2 layers).
 */
export const NotificationItem = memo(function NotificationItem({
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
      accessibilityLabel={`Thông báo từ ${actorName}`}
      accessibilityRole="button"
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
        <ClayText variant="body" style={styles.descriptionText} numberOfLines={3}>
          <ClayText variant="heading" style={styles.actorName}>
            {actorName}{' '}
          </ClayText>
          {notification.type === 'LIKE' && 'đã thích bài viết của bạn.'}
          {notification.type === 'COMMENT' && (
            <>
              đã bình luận: &quot;
              <ClayText variant="caption" style={styles.commentSnippet}>
                {notification.commentText}
              </ClayText>
              &quot;
            </>
          )}
          {notification.type === 'FOLLOW' && 'đã bắt đầu theo dõi bạn.'}
        </ClayText>

        <ClayText variant="meta" style={styles.timeAgo}>
          {formatTimeAgo(notification.createdAt)}
        </ClayText>
      </View>

      {/* ── Right: Post Thumbnail or Follow Back Button ─────── */}
      <View style={styles.rightActionWrap}>
        {notification.type === 'FOLLOW' ? (
          <Animated.View style={{ transform: [{ scale: followScale }] }}>
            <Pressable
              accessibilityLabel={
                notification.isFollowingBack
                  ? `Đang theo dõi ${actorName}`
                  : `Theo dõi lại ${actorName}`
              }
              accessibilityRole="button"
              disabled={isFollowPending}
              hitSlop={8}
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
                      : notificationsColors.onPrimary
                  }
                  size="small"
                />
              ) : (
                <ClayText
                  variant="caption"
                  style={[
                    styles.followButtonText,
                    notification.isFollowingBack
                      ? styles.followingButtonText
                      : styles.followBackButtonText,
                  ]}
                >
                  {notification.isFollowingBack ? 'Đang theo dõi' : 'Theo dõi lại'}
                </ClayText>
              )}
            </Pressable>
          </Animated.View>
        ) : notification.postImageUrl ? (
          <Image
            source={{ uri: notification.postImageUrl }}
            style={styles.postThumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : notification.postPreview ? (
          <View style={styles.postSnippetBox}>
            <ClayText variant="meta" style={styles.postSnippetText} numberOfLines={2}>
              {notification.postPreview}
            </ClayText>
          </View>
        ) : null}

        {/* ── Unread Dot ───────────────────────────────────── */}
        {!isRead ? <View style={styles.unreadDot} /> : null}
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  actorName: {
    color: notificationsColors.text,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: notificationsColors.surfaceWell,
    borderColor: notificationsColors.border,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: notificationsColors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
  },
  avatarWrapper: {
    height: AVATAR_SIZE,
    position: 'relative',
    width: AVATAR_SIZE,
  },
  commentSnippet: {
    color: notificationsColors.textSecondary,
    fontFamily: 'Nunito_600SemiBold_Italic',
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
    backgroundColor: notificationsColors.surfaceWell,
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
    fontFamily: 'Nunito_400Regular',
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
    color: notificationsColors.onPrimary,
    fontFamily: 'Nunito_700Bold',
  },
  followButton: {
    alignItems: 'center',
    borderRadius: notificationsRadii.button,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  followButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
  followingButton: {
    backgroundColor: notificationsColors.surfaceWell,
    borderColor: notificationsColors.border,
    borderWidth: 1.5,
  },
  followingButtonPressed: {
    backgroundColor: notificationsColors.surface,
  },
  followingButtonText: {
    color: notificationsColors.text,
    fontFamily: 'Nunito_700Bold',
  },
  postSnippetBox: {
    backgroundColor: notificationsColors.surfaceWell,
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
    fontFamily: 'Nunito_500Medium',
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
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  typeBadge: {
    alignItems: 'center',
    borderColor: notificationsColors.surface,
    borderRadius: notificationsRadii.badge,
    borderWidth: 1.5,
    bottom: -2,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 20,
  },
  typeBadgeIcon: {
    color: notificationsColors.onPrimary,
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
  },
  unreadDot: {
    backgroundColor: notificationsColors.unreadDot,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
