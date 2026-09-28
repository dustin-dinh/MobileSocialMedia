/**
 * Notification service — data-access layer for user notifications.
 *
 * Provides realistic mock notifications across LIKE, COMMENT, and FOLLOW types,
 * and seamlessly switches to REST API endpoints (`GET /notifications`,
 * `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`) when ready.
 */
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import type { AppNotification, NotificationsResponse } from '../types';

const USE_MOCK = true;
const MOCK_DELAY_MS = 350;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Mock Store
// ---------------------------------------------------------------------------

let mockNotifications: AppNotification[] = [
  {
    actor: {
      avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=100&h=100&fit=crop&crop=face',
      displayName: 'Alex Rivera',
      id: 'user-002',
      username: 'alexrivera',
    },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
    id: 'notif-001',
    isRead: false,
    postId: 'post-1',
    postImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
    postPreview: 'Chuyến đi biển cuối tuần cùng những người bạn tuyệt vời...',
    type: 'LIKE',
  },
  {
    actor: {
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      displayName: 'Minh Trần',
      id: 'user-003',
      username: 'minhtran',
    },
    commentText: 'App chạy mượt thật sự! UI/UX clean ghê 🚀',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25m ago
    id: 'notif-002',
    isRead: false,
    postId: 'post-1',
    postImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
    postPreview: 'Chuyến đi biển cuối tuần cùng những người bạn tuyệt vời...',
    type: 'COMMENT',
  },
  {
    actor: {
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      displayName: 'Linh Phạm',
      id: 'user-006',
      username: 'linhpham',
    },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
    id: 'notif-003',
    isFollowingBack: false,
    isRead: false,
    type: 'FOLLOW',
  },
  {
    actor: {
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      displayName: 'Đức Hoàng',
      id: 'user-007',
      username: 'duchoang',
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
    id: 'notif-004',
    isRead: true,
    postId: 'post-2',
    postPreview: 'Mẹo tối ưu hiệu năng ứng dụng React Native với Hermes engine...',
    type: 'LIKE',
  },
  {
    actor: {
      avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=100&h=100&fit=crop&crop=face',
      displayName: 'Alex Rivera',
      id: 'user-002',
      username: 'alexrivera',
    },
    commentText: 'Bộ ảnh chụp góc đẹp quá bạn ơi! Tone màu nghệ thực sự 👏📸',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
    id: 'notif-005',
    isRead: true,
    postId: 'post-1',
    postImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
    type: 'COMMENT',
  },
  {
    actor: {
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      displayName: 'Thanh Nguyễn',
      id: 'user-005',
      username: 'thanhnguyen',
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
    id: 'notif-006',
    isFollowingBack: true,
    isRead: true,
    type: 'FOLLOW',
  },
  {
    actor: {
      avatarUrl: null,
      displayName: null,
      id: 'user-004',
      username: 'devlife_vn',
    },
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2d ago
    id: 'notif-007',
    isRead: true,
    postId: 'post-2',
    postPreview: 'Mẹo tối ưu hiệu năng ứng dụng React Native với Hermes engine...',
    type: 'LIKE',
  },
];

// ---------------------------------------------------------------------------
// Service Implementation
// ---------------------------------------------------------------------------

export const notificationService = {
  /**
   * Fetch all notifications for current user.
   */
  async getNotifications(): Promise<AppNotification[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return [...mockNotifications];
    }

    try {
      const response = await httpClient.requestJson<NotificationsResponse>({
        method: 'GET',
        path: 'notifications',
      });

      return response.data;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        console.warn('⚠️ Notifications endpoint unavailable – using mock data.');
        return [...mockNotifications];
      }

      throw error;
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (USE_MOCK) {
      await delay(150);
      mockNotifications = mockNotifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n,
      );
      return;
    }

    try {
      await httpClient.requestVoid({
        method: 'PATCH',
        path: `notifications/${notificationId}/read`,
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        mockNotifications = mockNotifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        );
        return;
      }

      throw error;
    }
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    if (USE_MOCK) {
      await delay(250);
      mockNotifications = mockNotifications.map((n) => ({ ...n, isRead: true }));
      return;
    }

    try {
      await httpClient.requestVoid({
        method: 'PATCH',
        path: 'notifications/read-all',
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        mockNotifications = mockNotifications.map((n) => ({ ...n, isRead: true }));
        return;
      }

      throw error;
    }
  },

  /**
   * Toggle follow back directly from notification.
   */
  async toggleFollowBack(
    actorId: string,
    currentlyFollowing: boolean,
  ): Promise<boolean> {
    if (USE_MOCK) {
      await delay(250);
      const next = !currentlyFollowing;
      mockNotifications = mockNotifications.map((n) =>
        n.actor.id === actorId ? { ...n, isFollowingBack: next } : n,
      );
      return next;
    }

    const method = currentlyFollowing ? 'DELETE' : 'POST';

    try {
      await httpClient.requestVoid({
        method,
        path: `users/${actorId}/follow`,
      });

      return !currentlyFollowing;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        return !currentlyFollowing;
      }

      throw error;
    }
  },
} as const;
