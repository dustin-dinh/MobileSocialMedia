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
import { notificationsColors, notificationsRadii } from '../notificationsTheme';
import { notificationService } from '../services/notificationService';
import { ClayText } from '../../../components/ui/ClayText';
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
          <ClayText variant="title" style={styles.headerTitle}>Thông báo</ClayText>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <ClayText variant="meta" style={styles.unreadBadgeText}>{unreadCount}</ClayText>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Đọc tất cả thông báo"
          accessibilityRole="button"
          disabled={!hasUnread || isMarkingAll}
          hitSlop={12}
          onPress={handleMarkAllAsRead}
          style={({ pressed }) => [
            styles.markAllButton,
            pressed && hasUnread ? styles.markAllButtonPressed : undefined,
          ]}
        >
          {isMarkingAll ? (
            <ActivityIndicator size="small" color={notificationsColors.primary} />
          ) : (
            <ClayText
              variant="caption"
              style={[
                styles.markAllText,
                !hasUnread && styles.markAllTextDisabled,
              ]}
            >
              Đọc tất cả
            </ClayText>
          )}
        </Pressable>
      </View>

      {/* ── Filter Pills ──────────────────────────────────── */}
      <View style={styles.pillsContainer}>
        <Pressable
          accessibilityLabel={`Tất cả thông báo, ${notifications.length} mục`}
          accessibilityRole="button"
          onPress={() => setActiveTab('all')}
          style={[
            styles.pill,
            activeTab === 'all' ? styles.pillActive : styles.pillInactive,
          ]}
        >
          <ClayText
            variant="caption"
            style={[
              styles.pillText,
              activeTab === 'all' ? styles.pillTextActive : styles.pillTextInactive,
            ]}
          >
            Tất cả ({notifications.length})
          </ClayText>
        </Pressable>

        <Pressable
          accessibilityLabel={`Thông báo chưa đọc, ${unreadCount} mục`}
          accessibilityRole="button"
          onPress={() => setActiveTab('unread')}
          style={[
            styles.pill,
            activeTab === 'unread' ? styles.pillActive : styles.pillInactive,
          ]}
        >
          <ClayText
            variant="caption"
            style={[
              styles.pillText,
              activeTab === 'unread' ? styles.pillTextActive : styles.pillTextInactive,
            ]}
          >
            Chưa đọc ({unreadCount})
          </ClayText>
        </Pressable>
      </View>

      {/* ── Notifications List ────────────────────────────── */}
      <FlatList
        contentContainerStyle={[
          displayedNotifications.length === 0
            ? styles.emptyListContent
            : styles.listContent,
          { paddingBottom: 100 },
        ]}
        data={isLoading ? [] : displayedNotifications}
        keyExtractor={(item) => item.id}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
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
    backgroundColor: notificationsColors.canvas,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    color: notificationsColors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    letterSpacing: -0.4,
  },
  list: {
    backgroundColor: notificationsColors.canvas,
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  markAllButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  markAllButtonPressed: {
    opacity: 0.7,
  },
  markAllText: {
    color: notificationsColors.primary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  markAllTextDisabled: {
    color: notificationsColors.caption,
    opacity: 0.5,
  },
  pill: {
    borderRadius: notificationsRadii.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pillActive: {
    backgroundColor: notificationsColors.primary,
  },
  pillInactive: {
    backgroundColor: notificationsColors.surface,
    borderColor: notificationsColors.border,
    borderWidth: 1.5,
  },
  pillText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  pillTextActive: {
    color: notificationsColors.onPrimary,
  },
  pillTextInactive: {
    color: notificationsColors.textSecondary,
  },
  pillsContainer: {
    backgroundColor: notificationsColors.canvas,
    borderBottomColor: notificationsColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  screen: {
    backgroundColor: notificationsColors.canvas,
    flex: 1,
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: notificationsColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: notificationsColors.onPrimary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 11,
    textAlign: 'center',
  },
});
