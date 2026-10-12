import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadError } from '../../../components/common/LoadError';
import { showToast } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useIsScreenFocused } from '../../../navigation/useIsScreenFocused';
import { ApiError } from '../../../services/apiError';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import { notificationSocket } from '../../notifications/services/notificationSocket';
import { messageService, type Message, type OutgoingMessage } from '../services/messageService';
import { unreadMessages } from '../unreadMessages';

type ChatScreenProps = NativeStackScreenProps<MainStackParamList, 'Chat'>;

const MAX_LENGTH = 2000;
/** A time label is shown when two neighbouring messages are further apart than this. */
const TIME_GAP_MS = 15 * 60 * 1000;

function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  return date.toDateString() === new Date().toDateString()
    ? time
    : `${time}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** A one-to-one conversation: live messages, images, "seen", retry on failure. */
export function ChatScreen({ route }: ChatScreenProps) {
  const { conversationId, peer } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { user } = useAuthSession();
  const isFocused = useIsScreenFocused();
  const currentUserId = user?.id ?? '';
  const peerName = peer.displayName?.trim() || peer.username;

  // Newest first: the list is inverted, so index 0 sits at the bottom.
  const [messages, setMessages] = useState<Message[]>([]);
  const [peerReadAt, setPeerReadAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [text, setText] = useState('');
  const isLoadingMoreRef = useRef(false);
  const outgoingRef = useRef(new Map<string, OutgoingMessage>());

  const load = useCallback(async () => {
    try {
      const page = await messageService.getMessages(conversationId);

      // Keep what is still being sent: the server does not know it yet.
      setMessages((current) => [
        ...current.filter((message) => message.pending || message.failed),
        ...page.messages,
      ]);
      setHasMore(page.hasMore);
      setPeerReadAt(page.peerReadAt);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const markRead = useCallback(() => {
    messageService
      .markRead(conversationId)
      .then(() => unreadMessages.refresh())
      .catch(() => undefined);
  }, [conversationId]);

  useEffect(() => {
    void load().then(markRead);
  }, [load, markRead]);

  useEffect(() => {
    const unsubscribers = [
      notificationSocket.on<{ conversationId: string; message: Message }>('message:new', (event) => {
        if (event.conversationId !== conversationId) {
          return;
        }

        // The sender gets its own message back too: replace the local copy.
        setMessages((current) => [
          event.message,
          ...current.filter((message) => message.id !== event.message.id),
        ]);

        if (event.message.senderId !== currentUserId && isFocused) {
          markRead();
        }
      }),
      notificationSocket.on<{ conversationId: string; readAt: string }>('message:read', (event) => {
        if (event.conversationId === conversationId) {
          setPeerReadAt(event.readAt);
        }
      }),
      notificationSocket.onReconnect(() => void load()),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [conversationId, currentUserId, isFocused, load, markRead]);

  const loadOlder = useCallback(async () => {
    const oldest = messages[messages.length - 1];

    if (!hasMore || isLoadingMoreRef.current || !oldest) {
      return;
    }

    isLoadingMoreRef.current = true;

    try {
      const page = await messageService.getMessages(conversationId, oldest.createdAt);

      setMessages((current) => {
        const known = new Set(current.map((message) => message.id));

        return [...current, ...page.messages.filter((message) => !known.has(message.id))];
      });
      setHasMore(page.hasMore);
    } catch {
      // Scrolling up again retries.
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [conversationId, hasMore, messages]);

  // ── Sending ────────────────────────────────────────────────────────────
  const deliver = useCallback(
    async (outgoing: OutgoingMessage) => {
      try {
        const sent = await messageService.send(conversationId, currentUserId, outgoing);

        outgoingRef.current.delete(outgoing.clientId);
        setMessages((current) => [
          sent,
          ...current.filter((message) => message.id !== outgoing.clientId && message.id !== sent.id),
        ]);
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === outgoing.clientId ? { ...message, failed: true, pending: false } : message,
          ),
        );

        if (error instanceof ApiError && error.status === 403) {
          showToast('Bạn không thể nhắn tin cho người này.', 'error');
        }
      }
    },
    [conversationId, currentUserId],
  );

  const send = useCallback(
    (content: string | undefined, image?: OutgoingMessage['image']) => {
      const outgoing: OutgoingMessage = {
        clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        content,
        image,
      };

      outgoingRef.current.set(outgoing.clientId, outgoing);
      setMessages((current) => [
        {
          content: content ?? null,
          conversationId,
          createdAt: new Date().toISOString(),
          id: outgoing.clientId,
          imageUrl: image?.uri ?? null,
          pending: true,
          senderId: currentUserId,
        },
        ...current,
      ]);
      void deliver(outgoing);
    },
    [conversationId, currentUserId, deliver],
  );

  const handleSendText = () => {
    const content = text.trim();

    if (content) {
      setText('');
      send(content);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showToast('Hãy cho phép ứng dụng truy cập thư viện ảnh để gửi ảnh.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.canceled ? null : result.assets[0];

    if (asset) {
      send(undefined, { fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  };

  const handleRetry = (message: Message) => {
    const outgoing = outgoingRef.current.get(message.id);

    if (!outgoing) {
      return;
    }

    setMessages((current) =>
      current.map((item) => (item.id === message.id ? { ...item, failed: false, pending: true } : item)),
    );
    void deliver(outgoing);
  };

  // ── Rendering ──────────────────────────────────────────────────────────
  // "Seen" belongs under the newest message of mine that the other person has read.
  const lastOwn = messages.find((message) => message.senderId === currentUserId && !message.failed);

  const renderItem = ({ index, item }: { index: number; item: Message }) => {
    const isMine = item.senderId === currentUserId;
    const older = messages[index + 1];
    const showTime =
      !older || new Date(item.createdAt).getTime() - new Date(older.createdAt).getTime() > TIME_GAP_MS;
    const status =
      item.id !== lastOwn?.id
        ? null
        : item.pending
          ? 'Đang gửi…'
          : peerReadAt && peerReadAt >= item.createdAt
            ? 'Đã xem'
            : 'Đã gửi';

    return (
      <View>
        {showTime ? (
          <ClayText style={styles.timeLabel} variant="meta">
            {formatTime(item.createdAt)}
          </ClayText>
        ) : null}
        <Pressable
          accessibilityLabel={
            item.failed
              ? 'Tin nhắn chưa gửi được. Chạm để gửi lại'
              : `${isMine ? 'Bạn' : peerName}: ${item.content ?? 'ảnh'}`
          }
          accessibilityRole={item.failed ? 'button' : 'text'}
          disabled={!item.failed}
          onPress={() => handleRetry(item)}
          style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
        >
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
              item.imageUrl && !item.content ? styles.bubbleImageOnly : null,
              item.pending && styles.bubblePending,
            ]}
          >
            {item.imageUrl ? (
              <Image
                accessibilityLabel="Ảnh trong tin nhắn"
                cachePolicy="memory-disk"
                contentFit="cover"
                source={{ uri: item.imageUrl }}
                style={styles.image}
              />
            ) : null}
            {item.content ? (
              <ClayText style={isMine ? styles.textMine : styles.textTheirs} variant="body">
                {item.content}
              </ClayText>
            ) : null}
          </View>
        </Pressable>
        {item.failed ? (
          <ClayText style={[styles.status, styles.statusFailed]} variant="meta">
            Không gửi được. Chạm vào tin nhắn để thử lại.
          </ClayText>
        ) : status ? (
          <ClayText style={styles.status} variant="meta">
            {status}
          </ClayText>
        ) : null}
      </View>
    );
  };

  const canSend = text.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + claySpacing.sm }]}>
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          hitSlop={8}
          onPress={navigation.back}
          style={styles.headerButton}
        >
          <ClayIcon color={clayColors.text} name="CaretLeft" size={22} weight="bold" />
        </Pressable>
        <Pressable
          accessibilityLabel={`Xem trang cá nhân của ${peerName}`}
          accessibilityRole="button"
          onPress={() => navigation.openProfile(peer.id)}
          style={styles.headerPeer}
        >
          <UserAvatar avatarUrl={peer.avatarUrl} name={peerName} size={36} />
          <View style={styles.headerText}>
            <ClayText numberOfLines={1} style={styles.headerName} variant="body">
              {peerName}
            </ClayText>
            <ClayText numberOfLines={1} style={styles.headerUsername} variant="meta">
              @{peer.username}
            </ClayText>
          </View>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={clayColors.primary} style={styles.fill} />
      ) : loadFailed && messages.length === 0 ? (
        <View style={styles.fill}>
          <LoadError onRetry={load} />
        </View>
      ) : (
        <FlatList
          data={messages}
          initialNumToRender={20}
          windowSize={11}
          contentContainerStyle={styles.listContent}
          inverted
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          // Inverted list: this sits at the visual centre when there is nothing yet.
          ListEmptyComponent={
            <View style={styles.empty}>
              <UserAvatar avatarUrl={peer.avatarUrl} name={peerName} size={72} />
              <ClayText style={styles.emptyName} variant="heading">
                {peerName}
              </ClayText>
              <ClayText style={styles.emptyText} variant="caption">
                Hãy gửi lời chào để bắt đầu cuộc trò chuyện.
              </ClayText>
            </View>
          }
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          renderItem={renderItem}
          style={styles.fill}
        />
      )}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, claySpacing.sm) }]}>
        <Pressable
          accessibilityLabel="Gửi ảnh"
          accessibilityRole="button"
          hitSlop={6}
          onPress={handlePickImage}
          style={styles.composerButton}
        >
          <ClayIcon color={clayColors.primary} name="Image" size={24} />
        </Pressable>
        <TextInput
          accessibilityLabel="Nội dung tin nhắn"
          maxLength={MAX_LENGTH}
          multiline
          onChangeText={setText}
          placeholder="Nhắn tin…"
          placeholderTextColor={clayColors.caption}
          style={styles.input}
          value={text}
        />
        <Pressable
          accessibilityLabel="Gửi tin nhắn"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          hitSlop={6}
          onPress={handleSendText}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        >
          <ClayIcon color={clayColors.onPrimary} name="ArrowUp" size={20} weight="bold" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 18,
    maxWidth: '78%',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleImageOnly: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bubbleMine: {
    backgroundColor: clayColors.primary,
    borderBottomRightRadius: 6,
  },
  bubblePending: {
    opacity: 0.6,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: claySpacing.md,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubbleTheirs: {
    backgroundColor: clayColors.surfaceHigh,
    borderBottomLeftRadius: 6,
    borderColor: clayColors.border,
    borderWidth: 1,
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: clayColors.surface,
    borderTopColor: clayColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: claySpacing.sm,
    paddingHorizontal: claySpacing.sm,
    paddingTop: claySpacing.sm,
  },
  composerButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    // The list is inverted, so its content is flipped back for reading.
    transform: [{ scaleY: -1 }],
  },
  emptyName: {
    marginTop: 12,
  },
  emptyText: {
    color: clayColors.caption,
    marginTop: 4,
  },
  fill: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: clayColors.canvas,
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: claySpacing.sm,
    paddingHorizontal: claySpacing.xs,
  },
  headerButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  headerName: {
    fontFamily: fontFamilies.bold,
  },
  headerPeer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget,
  },
  headerText: {
    flex: 1,
  },
  headerUsername: {
    color: clayColors.caption,
  },
  image: {
    borderRadius: clayRadii.media,
    height: 220,
    width: 220,
  },
  input: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 22,
    color: clayColors.text,
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    maxHeight: 120,
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  listContent: {
    paddingVertical: claySpacing.md,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: clayColors.primary,
    borderRadius: clayDimensions.minTouchTarget / 2,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  status: {
    alignSelf: 'flex-end',
    color: clayColors.caption,
    marginRight: claySpacing.base,
    marginTop: 2,
  },
  statusFailed: {
    color: clayColors.error,
  },
  textMine: {
    color: clayColors.onPrimary,
  },
  textTheirs: {
    color: clayColors.text,
  },
  timeLabel: {
    alignSelf: 'center',
    color: clayColors.caption,
    marginVertical: claySpacing.sm,
  },
});
