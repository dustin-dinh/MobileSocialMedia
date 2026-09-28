import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationEmptyState } from '../components/NotificationEmptyState';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationSkeleton } from '../components/NotificationSkeleton';
import { notificationsColors, notificationsRadii } from '../notificationsTheme';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../types';

type FilterTab = 'all' | 'unread';

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  // ── Load Notifications ────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

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
    [],
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          disabled={!hasUnread || isMarkingAll}
          hitSlop={8}
          onPress={handleMarkAllAsRead}
          style={({ pressed }) => [
            styles.markAllButton,
            pressed && hasUnread ? styles.markAllButtonPressed : undefined,
          ]}
        >
          {isMarkingAll ? (
            <ActivityIndicator size="small" color={notificationsColors.primary} />
          ) : (
            <Text
              style={[
                styles.markAllText,
                !hasUnread && styles.markAllTextDisabled,
              ]}
            >
              Đọc tất cả
            </Text>
          )}
        </Pressable>
      </View>

      {/* ── Filter Pills ──────────────────────────────────── */}
      <View style={styles.pillsContainer}>
        <Pressable
          onPress={() => setActiveTab('all')}
          style={[
            styles.pill,
            activeTab === 'all' ? styles.pillActive : styles.pillInactive,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              activeTab === 'all' ? styles.pillTextActive : styles.pillTextInactive,
            ]}
          >
            Tất cả ({notifications.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('unread')}
          style={[
            styles.pill,
            activeTab === 'unread' ? styles.pillActive : styles.pillInactive,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              activeTab === 'unread' ? styles.pillTextActive : styles.pillTextInactive,
            ]}
          >
            Chưa đọc ({unreadCount})
          </Text>
        </Pressable>
      </View>

      {/* ── Notifications List ────────────────────────────── */}
      <FlatList
        contentContainerStyle={
          displayedNotifications.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        data={isLoading ? [] : displayedNotifications}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <NotificationSkeleton />
          ) : (
            <NotificationEmptyState activeTab={activeTab} />
          )
        }
        refreshControl={
          <RefreshControl
            colors={[notificationsColors.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={notificationsColors.primary}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: notificationsColors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: notificationsColors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  list: {
    backgroundColor: notificationsColors.surface,
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllButtonPressed: {
    opacity: 0.7,
  },
  markAllText: {
    color: notificationsColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  markAllTextDisabled: {
    color: notificationsColors.caption,
    opacity: 0.5,
  },
  pill: {
    borderRadius: notificationsRadii.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pillActive: {
    backgroundColor: notificationsColors.pillActiveBg,
  },
  pillInactive: {
    backgroundColor: notificationsColors.pillInactiveBg,
    borderColor: notificationsColors.pillInactiveBorder,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: notificationsColors.pillActiveText,
  },
  pillTextInactive: {
    color: notificationsColors.pillInactiveText,
  },
  pillsContainer: {
    backgroundColor: notificationsColors.surface,
    borderBottomColor: notificationsColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  screen: {
    backgroundColor: notificationsColors.surface,
    flex: 1,
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  unreadBadge: {
    backgroundColor: notificationsColors.primary,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
});
