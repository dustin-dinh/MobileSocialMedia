import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadError } from '../../../components/common/LoadError';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useIsScreenFocused } from '../../../navigation/useIsScreenFocused';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { useAuthSession } from '../../auth/authSession';
import { notificationSocket } from '../../notifications/services/notificationSocket';
import { PeerAvatar } from '../components/PeerAvatar';
import { messageService, type Conversation } from '../services/messageService';
import { unreadMessages } from '../unreadMessages';

type Folder = 'inbox' | 'requests';

function preview(conversation: Conversation, currentUserId?: string): string {
  const message = conversation.lastMessage;

  if (!message) {
    return '';
  }

  const text = message.content ?? 'Đã gửi một ảnh';

  // Message requests never show their text before you open them: it may be a scam.
  if (conversation.isRequest) {
    return 'Muốn gửi tin nhắn cho bạn';
  }

  return message.senderId === currentUserId ? `Bạn: ${text}` : text;
}

/**
 * The Messages tab: conversations newest first, with message requests
 * (strangers, anonymous senders) in their own folder.
 */
export function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { user } = useAuthSession();
  const isFocused = useIsScreenFocused();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [folder, setFolder] = useState<Folder>('inbox');

  const load = useCallback(async () => {
    try {
      setConversations(await messageService.list());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Coming back from a chat: its last message and unread count have changed.
  useEffect(() => {
    if (isFocused) {
      void load();
      void unreadMessages.refresh();
    }
  }, [isFocused, load]);

  useEffect(() => {
    const unsubscribers = [
      notificationSocket.on('message:new', () => void load()),
      notificationSocket.onReconnect(() => void load()),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const requests = conversations.filter((conversation) => conversation.isRequest);
  const shown = folder === 'requests' ? requests : conversations.filter((conversation) => !conversation.isRequest);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const name = item.peer.displayName?.trim() || item.peer.username;
      const hasUnread = item.unreadCount > 0;
      const isHiddenSender = item.anonymous?.role === 'SENDER' && !item.anonymous.revealed;

      return (
        <Pressable
          accessibilityLabel={`Trò chuyện với ${name}${hasUnread ? `, ${item.unreadCount} tin chưa đọc` : ''}`}
          accessibilityRole="button"
          onPress={() => navigation.open('Chat', { conversationId: item.id, peer: item.peer })}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <PeerAvatar peer={item.peer} size={52} />
          <View style={styles.rowText}>
            <ClayText numberOfLines={1} style={hasUnread ? styles.nameUnread : styles.name} variant="body">
              {name}
            </ClayText>
            {isHiddenSender ? (
              <View style={styles.tag}>
                <ClayIcon color={clayColors.textSecondary} name="Mask" size={12} />
                <ClayText style={styles.tagText} variant="meta">
                  Bạn đang nhắn ẩn danh
                </ClayText>
              </View>
            ) : null}
            <ClayText
              numberOfLines={1}
              style={hasUnread ? styles.previewUnread : styles.preview}
              variant="caption"
            >
              {preview(item, user?.id)}
            </ClayText>
          </View>
          <View style={styles.rowMeta}>
            <ClayText style={styles.time} variant="meta">
              {formatTimeAgo(item.lastMessageAt)}
            </ClayText>
            {hasUnread ? (
              <View style={styles.badge}>
                <ClayText style={styles.badgeText} variant="meta">
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </ClayText>
              </View>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [navigation, user?.id],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ClayText variant="title">Tin nhắn</ClayText>
        <Pressable
          accessibilityLabel="Soạn tin nhắn mới"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.open('NewMessage')}
          style={styles.headerButton}
        >
          <ClayIcon color={clayColors.text} name="PencilSimple" size={22} />
        </Pressable>
      </View>

      <View accessibilityRole="tablist" style={styles.folders}>
        {(['inbox', 'requests'] as const).map((key) => {
          const isActive = folder === key;
          const label = key === 'inbox' ? 'Tin nhắn' : `Tin nhắn chờ${requests.length ? ` (${requests.length})` : ''}`;

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={key}
              onPress={() => setFolder(key)}
              style={[styles.folder, isActive && styles.folderActive]}
            >
              <ClayText style={isActive ? styles.folderTextActive : styles.folderText} variant="caption">
                {label}
              </ClayText>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator color={clayColors.primary} style={styles.loading} />
      ) : loadFailed && conversations.length === 0 ? (
        <LoadError onRetry={load} />
      ) : (
        <FlatList
          data={shown}
          initialNumToRender={12}
          windowSize={9}
          contentContainerStyle={shown.length === 0 ? styles.emptyContainer : undefined}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            folder === 'requests' ? (
              <View style={styles.empty}>
                <ClayIcon color={clayColors.caption} name="Inbox" size={44} />
                <ClayText style={styles.emptyTitle} variant="heading">
                  Không có tin nhắn chờ
                </ClayText>
                <ClayText style={styles.emptyText} variant="body">
                  Tin nhắn từ người bạn chưa theo dõi và tin nhắn ẩn danh sẽ nằm ở đây cho tới khi bạn
                  chấp nhận.
                </ClayText>
              </View>
            ) : (
              <View style={styles.empty}>
                <ClayIcon color={clayColors.caption} name="ChatCircle" size={44} />
                <ClayText style={styles.emptyTitle} variant="heading">
                  Chưa có tin nhắn
                </ClayText>
                <ClayText style={styles.emptyText} variant="body">
                  Nhắn tin riêng với bạn bè và những người bạn theo dõi.
                </ClayText>
                <ClayButton
                  accessibilityLabel="Bắt đầu trò chuyện"
                  onPress={() => navigation.open('NewMessage')}
                  style={styles.emptyButton}
                  title="Bắt đầu trò chuyện"
                  variant="primary"
                />
              </View>
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
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: clayColors.primary,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.bold,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyButton: {
    marginTop: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: clayColors.caption,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 12,
  },
  folder: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: claySpacing.md,
  },
  folderActive: {
    backgroundColor: clayColors.text,
  },
  folderText: {
    color: clayColors.textSecondary,
    fontFamily: fontFamilies.semiBold,
  },
  folderTextActive: {
    color: clayColors.canvas,
    fontFamily: fontFamilies.bold,
  },
  folders: {
    flexDirection: 'row',
    gap: claySpacing.sm,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.sm,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  loading: {
    marginTop: 40,
  },
  name: {
    color: clayColors.text,
    fontFamily: fontFamilies.semiBold,
  },
  nameUnread: {
    color: clayColors.text,
    fontFamily: fontFamilies.bold,
  },
  preview: {
    color: clayColors.caption,
    marginTop: 2,
  },
  previewUnread: {
    color: clayColors.text,
    fontFamily: fontFamilies.bold,
    marginTop: 2,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.md,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  rowPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  rowText: {
    flex: 1,
  },
  tag: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  tagText: {
    color: clayColors.textSecondary,
  },
  time: {
    color: clayColors.caption,
  },
});
