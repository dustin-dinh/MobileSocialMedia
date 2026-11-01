import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import type { AppNotification, NotificationType } from '../types';

const AVATAR_SIZE = 40;
const GLYPH_SIZE = 18;

const ACTION_TEXT: Record<NotificationType, string> = {
  COMMENT: 'đã bình luận về bài viết của bạn.',
  FOLLOW: 'đã bắt đầu theo dõi bạn.',
  FOLLOW_ACCEPT: 'đã chấp nhận yêu cầu theo dõi của bạn.',
  FOLLOW_REQUEST: 'muốn theo dõi bạn.',
  LIKE: 'đã thích bài viết của bạn.',
  MENTION: 'đã nhắc đến bạn.',
  REPLY: 'đã trả lời bình luận của bạn.',
  REPOST: 'đã đăng lại bài viết của bạn.',
};

/**
 * The small glyph on the actor's avatar says what happened. A like carries the
 * brand hue (a like is one of its small marks); every other kind is ink.
 */
function TypeGlyph({ type }: { type: NotificationType }) {
  const icon =
    type === 'LIKE'
      ? 'Heart'
      : type === 'REPOST'
        ? 'Repeat'
        : type === 'FOLLOW' || type === 'FOLLOW_REQUEST' || type === 'FOLLOW_ACCEPT'
          ? 'User'
          : 'ChatCircle';

  return (
    <View style={[styles.glyph, { backgroundColor: type === 'LIKE' ? clayColors.liked : clayColors.text }]}>
      {/* Filled shapes read at 10px; a filled speech bubble or arrows do not, so those stay outlined. */}
      <ClayIcon
        color={clayColors.onPrimary}
        name={icon}
        size={10}
        weight={icon === 'Heart' || icon === 'User' ? 'fill' : 'bold'}
      />
    </View>
  );
}

export type NotificationItemProps = {
  isFollowPending?: boolean;
  notification: AppNotification;
  onPressItem: (notification: AppNotification) => void;
  onToggleFollowBack: (notification: AppNotification) => void;
};

/**
 * One notification: the actor's avatar with a type glyph, what they did and
 * when, then the post it is about or a follow-back button. Unread rows are
 * marked by weight and a small brand-hue dot, never by a coloured fill.
 */
export const NotificationItem = memo(function NotificationItem({
  isFollowPending = false,
  notification,
  onPressItem,
  onToggleFollowBack,
}: NotificationItemProps) {
  const actorName = notification.actor.displayName?.trim() || notification.actor.username;
  const isUnread = !notification.isRead;
  const hasCommentText = notification.type === 'COMMENT' && Boolean(notification.commentText);

  return (
    <Pressable
      accessibilityLabel={`Thông báo từ ${actorName}`}
      accessibilityRole="button"
      onPress={() => onPressItem(notification)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.avatar}>
        <UserAvatar avatarUrl={notification.actor.avatarUrl} name={actorName} size={AVATAR_SIZE} />
        <TypeGlyph type={notification.type} />
      </View>

      {/* The rule starts at the text column, so the avatars keep one clean edge. */}
      <View style={styles.body}>
        <View style={styles.content}>
          <ClayText numberOfLines={3} style={[styles.description, isUnread && styles.descriptionUnread]}>
            <ClayText style={[styles.actorName, isUnread && styles.actorNameUnread]}>{actorName}</ClayText>{' '}
            {hasCommentText ? 'đã bình luận:' : ACTION_TEXT[notification.type]}
          </ClayText>
          {hasCommentText ? (
            <ClayText numberOfLines={2} style={styles.quote} variant="caption">
              “{notification.commentText}”
            </ClayText>
          ) : !notification.postImageUrl && notification.postPreview && notification.type !== 'FOLLOW' ? (
            <ClayText numberOfLines={1} style={styles.quote} variant="caption">
              “{notification.postPreview}”
            </ClayText>
          ) : null}
          <ClayText style={styles.time} variant="meta">
            {formatTimeAgo(notification.createdAt)}
          </ClayText>
        </View>

        {notification.type === 'FOLLOW' ? (
          <ClayButton
            accessibilityLabel={
              notification.isFollowingBack ? `Đang theo dõi ${actorName}` : `Theo dõi lại ${actorName}`
            }
            disabled={isFollowPending}
            isLoading={isFollowPending}
            onPress={() => onToggleFollowBack(notification)}
            size="sm"
            title={notification.isFollowingBack ? 'Đang theo dõi' : 'Theo dõi lại'}
            variant={notification.isFollowingBack ? 'secondary' : 'tonal'}
          />
        ) : notification.postImageUrl ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: notification.postImageUrl }}
            style={styles.thumbnail}
          />
        ) : null}

        {/* A fixed slot, so the follow buttons and thumbnails end on one right edge. */}
        <View style={styles.dotSlot}>{isUnread ? <View style={styles.dot} /> : null}</View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  actorName: {
    color: clayColors.text,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  actorNameUnread: {
    fontFamily: fontFamilies.bold,
  },
  avatar: {
    height: AVATAR_SIZE,
    marginTop: claySpacing.md,
    width: AVATAR_SIZE,
  },
  body: {
    alignItems: 'center',
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: claySpacing.md,
    paddingRight: clayDimensions.gutter,
    paddingVertical: claySpacing.md,
  },
  content: {
    flex: 1,
  },
  description: {
    color: clayColors.textSecondary,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionUnread: {
    color: clayColors.text,
  },
  dot: {
    backgroundColor: clayColors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotSlot: {
    alignItems: 'center',
    width: 8,
  },
  glyph: {
    alignItems: 'center',
    borderColor: clayColors.surface,
    borderRadius: GLYPH_SIZE / 2,
    borderWidth: 2,
    bottom: -3,
    height: GLYPH_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    width: GLYPH_SIZE,
  },
  quote: {
    color: clayColors.textSecondary,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  row: {
    alignItems: 'flex-start',
    backgroundColor: clayColors.surface,
    flexDirection: 'row',
    gap: claySpacing.md,
    paddingLeft: clayDimensions.gutter,
  },
  rowPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  thumbnail: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.media,
    height: 44,
    width: 44,
  },
  time: {
    ...tabularNums,
    color: clayColors.caption,
    marginTop: claySpacing.xs,
  },
});
