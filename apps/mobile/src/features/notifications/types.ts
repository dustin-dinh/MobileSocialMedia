/**
 * Data models for the Notifications feature.
 */

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'REPLY'
  | 'REPOST'
  | 'MENTION'
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_ACCEPT';

export type NotificationActor = {
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  username: string;
};

export type AppNotification = {
  actor: NotificationActor;
  /** The comment to scroll to when the notification is opened. */
  commentId?: string;
  commentText?: string;
  createdAt: string;
  id: string;
  isFollowingBack?: boolean;
  isRead: boolean;
  postId?: string;
  postImageUrl?: string;
  postPreview?: string;
  type: NotificationType;
};

export type NotificationsResponse = {
  data: AppNotification[];
  unreadCount: number;
};
