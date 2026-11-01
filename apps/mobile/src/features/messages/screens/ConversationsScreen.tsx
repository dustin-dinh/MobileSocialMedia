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
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { useAuthSession } from '../../auth/authSession';
import { notificationSocket } from '../../notifications/services/notificationSocket';
import { FolderTabs } from '../../../components/ui/FolderTabs';
import { PeerAvatar } from '../components/PeerAvatar';
import { messageService, type Conversation } from '../services/messageService';
import { unreadMessages } from '../unreadMessages';

type Folder = 'inbox' | 'requests';

const AVATAR_SIZE = 40;

function preview(conversation: Conversation, currentUserId?: string): string {
  const message = conversation.lastMessage;

  // Message requests never show their text before you open them: it may be a scam.
  if (conversation.isRequest) {
    return 'Muốn gửi tin nhắn cho bạn';
  }

  if (!message) {
    return '';
  }

  const text = message.content ?? 'Đã gửi một ảnh';

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
  const inbox = conversations.filter((conversation) => !conversation.isRequest);
  const shown = folder === 'requests' ? requests : inbox;
  const unreadInbox = inbox.filter((conversation) => conversation.unreadCount > 0).length;

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
          <PeerAvatar peer={item.peer} size={AVATAR_SIZE} />
          {/* The rule starts at the text column, so the avatars keep one clean edge. */}
          <View style={styles.rowBody}>
            <View style={styles.line}>
              <ClayText numberOfLines={1} style={[styles.name, hasUnread && styles.nameUnread]} variant="body">
                {name}
              </ClayText>
              <ClayText style={[styles.time, hasUnread && styles.timeUnread]} variant="meta">
                {formatTimeAgo(item.lastMessageAt)}
              </ClayText>
            </View>
            {isHiddenSender ? (
              <View style={styles.tag}>
                <ClayIcon color={clayColors.textSecondary} name="Mask" size={14} />
                <ClayText style={styles.tagText} variant="meta">
                  Bạn đang nhắn ẩn danh
                </ClayText>
              </View>
            ) : null}
            <View style={styles.line}>
              <ClayText
                numberOfLines={1}
                style={[styles.preview, hasUnread && styles.previewUnread]}
                variant="caption"
              >
                {preview(item, user?.id)}
              </ClayText>
              {hasUnread ? <View style={styles.unreadDot} /> : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation, user?.id],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ClayText level={1} variant="title">
          Tin nhắn
        </ClayText>
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

      <View style={styles.folders}>
        <FolderTabs
          onChange={setFolder}
          selected={folder}
          tabs={[
            {
              accessibilityLabel: `Tin nhắn, ${unreadInbox} cuộc trò chuyện chưa đọc`,
              count: unreadInbox,
              key: 'inbox',
              label: 'Tin nhắn',
            },
            {
              accessibilityLabel: `Tin nhắn chờ, ${requests.length} tin`,
              count: requests.length,
              key: 'requests',
              label: 'Tin nhắn chờ',
            },
          ]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={clayColors.primary} style={styles.loading} />
      ) : loadFailed && conversations.length === 0 ? (
        <LoadError message="Không tải được tin nhắn. Kiểm tra kết nối rồi thử lại." onRetry={load} />
      ) : (
        <FlatList
          data={shown}
          initialNumToRender={12}
          windowSize={9}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            folder === 'requests' ? (
              <ClayText style={styles.emptyText} variant="body">
                Không có tin nhắn chờ. Tin từ người bạn chưa theo dõi và tin ẩn danh sẽ chờ ở đây cho tới khi bạn
                chấp nhận.
              </ClayText>
            ) : (
              <View style={styles.empty}>
                <ClayText style={styles.emptyMessage} variant="body">
                  Chưa có cuộc trò chuyện nào. Nhắn riêng cho người bạn đang theo dõi.
                </ClayText>
                <ClayButton
                  accessibilityLabel="Bắt đầu trò chuyện"
                  onPress={() => navigation.open('NewMessage')}
                  size="sm"
                  title="Bắt đầu trò chuyện"
                  variant="primary"
                />
              </View>
            )
          }
          // Strangers and anonymous senders never land here unannounced: say where they wait.
          ListFooterComponent={
            folder === 'inbox' && shown.length > 0 ? (
              <ClayText style={styles.footnote} variant="caption">
                Tin từ người bạn chưa theo dõi và tin ẩn danh nằm trong Tin nhắn chờ.
              </ClayText>
            ) : null
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
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  empty: {
    alignItems: 'flex-start',
    gap: claySpacing.base,
    padding: clayDimensions.gutter,
  },
  emptyMessage: {
    color: clayColors.textSecondary,
  },
  emptyText: {
    color: clayColors.textSecondary,
    padding: clayDimensions.gutter,
  },
  folders: {
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    paddingBottom: claySpacing.md,
    paddingHorizontal: clayDimensions.gutter,
  },
  footnote: {
    color: clayColors.caption,
    padding: clayDimensions.gutter,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: clayDimensions.gutter,
    paddingRight: claySpacing.xs,
    paddingVertical: claySpacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.sm,
  },
  loading: {
    marginTop: claySpacing.xxl,
  },
  name: {
    color: clayColors.text,
    flex: 1,
    fontFamily: fontFamilies.medium,
  },
  nameUnread: {
    fontFamily: fontFamilies.bold,
  },
  preview: {
    color: clayColors.caption,
    flex: 1,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  previewUnread: {
    color: clayColors.text,
    fontFamily: fontFamilies.medium,
  },
  row: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    flexDirection: 'row',
    gap: claySpacing.md,
    paddingLeft: clayDimensions.gutter,
  },
  rowBody: {
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flex: 1,
    paddingRight: clayDimensions.gutter,
    paddingVertical: claySpacing.md,
  },
  rowPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  tag: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.xs,
    marginTop: 2,
  },
  tagText: {
    color: clayColors.textSecondary,
  },
  time: {
    ...tabularNums,
    color: clayColors.caption,
  },
  timeUnread: {
    color: clayColors.text,
  },
  unreadDot: {
    backgroundColor: clayColors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
