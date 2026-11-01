import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationEmptyState } from '../components/NotificationEmptyState';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationSkeleton } from '../components/NotificationSkeleton';
import { notificationService } from '../services/notificationService';
import { notificationSocket } from '../services/notificationSocket';
import { unreadStore } from '../unreadStore';
import { FolderTabs } from '../../../components/ui/FolderTabs';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import type { AppNotification } from '../types';

type FilterTab = 'all' | 'unread';

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  // ── Load Notifications ────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setLoadFailed(false);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Reload when the realtime channel reports a new notification.
  useEffect(() => notificationSocket.subscribe(() => void loadNotifications()), [loadNotifications]);

  // ── Pull-to-refresh ───────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Refresh notifications failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Mark single item as read (Optimistic) ─────────────────────────────
  const handlePressItem = useCallback(
    async (item: AppNotification) => {
      // Open what the notification is about: the follower's profile, or the post
      // (scrolled to the comment when there is one).
      if (item.type === 'FOLLOW_REQUEST') {
        navigation.open('FollowRequests');
      } else if (item.type === 'FOLLOW' || item.type === 'FOLLOW_ACCEPT') {
        navigation.openProfile(item.actor.id);
      } else if (item.postId) {
        navigation.open('PostDetail', { commentId: item.commentId, postId: item.postId });
      }

      if (item.isRead) {
        return;
      }

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );

      try {
        await notificationService.markAsRead(item.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Rollback
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: false } : n)),
        );
      }
    },
    [navigation],
  );

  // ── Mark all as read (Optimistic) ─────────────────────────────────────
  const handleMarkAllAsRead = useCallback(async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    if (unreadItems.length === 0 || isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => {
          const wasUnread = unreadItems.some((u) => u.id === n.id);
          return wasUnread ? { ...n, isRead: false } : n;
        }),
      );
    } finally {
      setIsMarkingAll(false);
    }
  }, [isMarkingAll, notifications]);

  // ── Toggle follow back directly from notification ────────────────────
  const handleToggleFollowBack = useCallback(async (item: AppNotification) => {
    const actorId = item.actor.id;
    const previousState = !!item.isFollowingBack;
    const nextState = !previousState;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.actor.id === actorId ? { ...n, isFollowingBack: nextState } : n,
      ),
    );

    setPendingFollowIds((prev) => new Set(prev).add(actorId));

    try {
      const updated = await notificationService.toggleFollowBack(actorId, previousState);
      setNotifications((prev) =>
        prev.map((n) =>
          n.actor.id === actorId ? { ...n, isFollowingBack: updated } : n,
        ),
      );
    } catch (error) {
      console.error('Failed to toggle follow back:', error);
      // Rollback
      setNotifications((prev) =>
        prev.map((n) =>
          n.actor.id === actorId ? { ...n, isFollowingBack: previousState } : n,
        ),
      );
    } finally {
      setPendingFollowIds((prev) => {
        const next = new Set(prev);
        next.delete(actorId);
        return next;
      });
    }
  }, []);

  // ── Computed data ─────────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const displayedNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [activeTab, notifications]);

  const hasUnread = unreadCount > 0;

  // The tab bar badge shows the same number as this screen.
  useEffect(() => {
    if (!isLoading) {
      unreadStore.set(unreadCount);
    }
  }, [isLoading, unreadCount]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          hitSlop={8}
          onPress={navigation.back}
          style={styles.backButton}
        >
          <ClayIcon color={clayColors.text} name="CaretLeft" size={22} weight="bold" />
        </Pressable>
        <ClayText level={1} numberOfLines={1} style={styles.headerTitle} variant="heading">
          Thông báo
        </ClayText>
        <Pressable
          accessibilityLabel="Đọc tất cả thông báo"
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasUnread || isMarkingAll }}
          disabled={!hasUnread || isMarkingAll}
          hitSlop={8}
          onPress={handleMarkAllAsRead}
          style={({ pressed }) => [styles.markAllButton, pressed && styles.markAllButtonPressed]}
        >
          {isMarkingAll ? (
            <ActivityIndicator color={clayColors.text} size="small" />
          ) : (
            <ClayText style={[styles.markAllText, !hasUnread && styles.markAllTextDisabled]} variant="button">
              Đọc tất cả
            </ClayText>
          )}
        </Pressable>
      </View>

      <View style={styles.filters}>
        <FolderTabs
          onChange={setActiveTab}
          selected={activeTab}
          tabs={[
            {
              accessibilityLabel: `Tất cả thông báo, ${notifications.length} mục`,
              count: notifications.length,
              key: 'all',
              label: 'Tất cả',
            },
            {
              accessibilityLabel: `Thông báo chưa đọc, ${unreadCount} mục`,
              count: unreadCount,
              key: 'unread',
              label: 'Chưa đọc',
            },
          ]}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={isLoading ? [] : displayedNotifications}
        keyExtractor={(item) => item.id}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          isLoading ? (
            <NotificationSkeleton />
          ) : loadFailed ? (
            <View style={styles.error}>
              <ClayText style={styles.errorText} variant="body">
                Không tải được thông báo. Kiểm tra kết nối rồi thử lại.
              </ClayText>
              <ClayButton
                accessibilityLabel="Thử tải lại thông báo"
                onPress={() => void loadNotifications()}
                size="sm"
                title="Thử lại"
                variant="secondary"
              />
            </View>
          ) : (
            <NotificationEmptyState activeTab={activeTab} />
          )
        }
        refreshControl={
          <RefreshControl
            colors={[clayColors.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={clayColors.primary}
          />
        }
        renderItem={({ item }) => (
          <NotificationItem
            isFollowPending={pendingFollowIds.has(item.actor.id)}
            notification={item}
            onPressItem={handlePressItem}
            onToggleFollowBack={handleToggleFollowBack}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  error: {
    alignItems: 'flex-start',
    gap: claySpacing.md,
    padding: clayDimensions.gutter,
  },
  errorText: {
    color: clayColors.textSecondary,
  },
  filters: {
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    paddingBottom: claySpacing.md,
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.xs,
  },
  // Same bar as ScreenHeader, with a text action on the right instead of an icon.
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: claySpacing.sm,
    paddingVertical: claySpacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: claySpacing.xl,
  },
  markAllButton: {
    alignItems: 'center',
    borderRadius: clayRadii.control,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: claySpacing.sm,
  },
  markAllButtonPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  // Ink, not the brand hue: a header action is chrome, and ink reads at full contrast.
  markAllText: {
    color: clayColors.text,
  },
  markAllTextDisabled: {
    color: clayColors.caption,
  },
  screen: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
});
