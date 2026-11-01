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

import { ActionSheet, type ActionSheetOption } from '../../../components/common/ActionSheet';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { LoadError } from '../../../components/common/LoadError';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useIsScreenFocused } from '../../../navigation/useIsScreenFocused';
import { ApiError } from '../../../services/apiError';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import type { PostAuthor } from '../../feed/types';
import { notificationSocket } from '../../notifications/services/notificationSocket';
import { profileService } from '../../profile/services/profileService';
import { ReportModal } from '../../report/ReportModal';
import { PeerAvatar } from '../components/PeerAvatar';
import {
  ANONYMOUS_USER_ID,
  messageService,
  type Conversation,
  type Message,
  type OutgoingMessage,
} from '../services/messageService';
import { unreadMessages } from '../unreadMessages';

type ChatScreenProps = NativeStackScreenProps<MainStackParamList, 'Chat'>;

const MAX_LENGTH = 2000;
/** A time label is shown when two neighbouring messages are further apart than this. */
const TIME_GAP_MS = 15 * 60 * 1000;

/** Vietnamese text for the codes the API uses to refuse a message. */
const SEND_ERRORS: Record<string, string> = {
  ANONYMOUS_SUSPENDED: 'Bạn đã bị tạm dừng quyền gửi tin ẩn danh.',
  CONTACT_INFO_BLOCKED:
    'Cuộc trò chuyện này không cho gửi đường link, số điện thoại hay số tài khoản ngân hàng.',
  CONVERSATION_CLOSED: 'Cuộc trò chuyện đã đóng.',
  IMAGES_NOT_ALLOWED: 'Cuộc trò chuyện này chỉ gửi được chữ.',
  REQUEST_LIMIT: 'Hãy chờ người này trả lời trước khi gửi thêm.',
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  return date.toDateString() === new Date().toDateString()
    ? time
    : `${time}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/**
 * A one-to-one conversation: live messages, images, "seen", retry on failure.
 * Also carries the safety states: message requests, anonymous conversations,
 * closed conversations, blurred sensitive images and scam warnings.
 */
export function ChatScreen({ route }: ChatScreenProps) {
  const { conversationId } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { user } = useAuthSession();
  const isFocused = useIsScreenFocused();
  const currentUserId = user?.id ?? '';

  // Newest first: the list is inverted, so index 0 sits at the bottom.
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [peerReadAt, setPeerReadAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [text, setText] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [confirm, setConfirm] = useState<'block' | 'reveal' | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // Sensitive images the user chose to see.
  const [shownImages, setShownImages] = useState<ReadonlySet<string>>(new Set());
  const isLoadingMoreRef = useRef(false);
  const outgoingRef = useRef(new Map<string, OutgoingMessage>());

  // The peer from the server wins: after an anonymous sender reveals themselves it changes.
  const peer: PostAuthor = conversation?.peer ?? route.params.peer;
  const peerName = peer.displayName?.trim() || peer.username;
  const isAnonymousPeer = peer.id === ANONYMOUS_USER_ID;
  const anonymity = conversation?.anonymous ?? null;
  const isHiddenSender = anonymity?.role === 'SENDER' && !anonymity.revealed;
  const isRequest = conversation?.isRequest ?? false;
  const isWaitingForAnswer = conversation?.status === 'PENDING' && !isRequest;
  const isClosed = conversation?.closed ?? false;
  const canSendImages = conversation?.canSendImages ?? true;

  const load = useCallback(async () => {
    try {
      const page = await messageService.getMessages(conversationId);

      // Keep what is still being sent: the server does not know it yet.
      setMessages((current) => [
        ...current.filter((message) => message.pending || message.failed),
        ...page.messages,
      ]);
      setConversation(page.conversation);
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
      notificationSocket.on<{ conversation?: Conversation; conversationId: string; message: Message }>(
        'message:new',
        (event) => {
          if (event.conversationId !== conversationId) {
            return;
          }

          // The sender gets its own message back too: replace the local copy.
          setMessages((current) => [
            event.message,
            ...current.filter((message) => message.id !== event.message.id),
          ]);

          // A reply turns a request into a normal conversation.
          if (event.conversation) {
            setConversation(event.conversation);
          }

          if (event.message.senderId !== currentUserId && isFocused) {
            markRead();
          }
        },
      ),
      notificationSocket.on<{ conversationId: string; readAt: string }>('message:read', (event) => {
        if (event.conversationId === conversationId) {
          setPeerReadAt(event.readAt);
        }
      }),
      // The anonymous sender revealed themselves: messages now carry their real id.
      notificationSocket.on<{ conversationId: string }>('conversation:updated', (event) => {
        if (event.conversationId === conversationId) {
          void load();
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
        const refused = error instanceof ApiError && error.code ? SEND_ERRORS[error.code] : undefined;

        if (refused) {
          // Refused by a rule, not a network failure: retrying would fail again.
          outgoingRef.current.delete(outgoing.clientId);
          setMessages((current) => current.filter((message) => message.id !== outgoing.clientId));
          showToast(refused, 'error');

          if (error instanceof ApiError && error.code === 'CONVERSATION_CLOSED') {
            void load();
          }

          return;
        }

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
    [conversationId, currentUserId, load],
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

  // ── Requests, anonymity, safety ────────────────────────────────────────
  const runAction = async (action: () => Promise<unknown>, done: string, leave: boolean) => {
    setIsBusy(true);

    try {
      await action();
      showToast(done);
      void unreadMessages.refresh();

      if (leave) {
        navigation.back();
      } else {
        await load();
      }
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Không thực hiện được. Vui lòng thử lại.', 'error');
    } finally {
      setIsBusy(false);
      setConfirm(null);
    }
  };

  const handleAccept = () =>
    void runAction(() => messageService.accept(conversationId), 'Đã chấp nhận tin nhắn.', false);

  const handleDecline = () =>
    void runAction(() => messageService.decline(conversationId), 'Đã xoá tin nhắn chờ.', true);

  // Anonymous: close this conversation for good (the hidden sender is not named to you).
  // Otherwise: block the person.
  const handleBlock = () =>
    void runAction(
      () =>
        anonymity?.role === 'RECIPIENT' && !anonymity.revealed
          ? messageService.closeAnonymous(conversationId)
          : profileService.setBlocked(peer.id, true),
      'Đã chặn.',
      true,
    );

  const handleReveal = () =>
    void runAction(() => messageService.reveal(conversationId), 'Người kia đã biết bạn là ai.', false);

  const menuOptions: ActionSheetOption[] = [
    ...(isHiddenSender
      ? [{ icon: 'Mask', key: 'reveal', label: 'Tiết lộ danh tính', onPress: () => setConfirm('reveal') }]
      : []),
    {
      destructive: true,
      icon: 'Flag',
      key: 'report',
      label: 'Báo cáo cuộc trò chuyện',
      onPress: () => setIsReportVisible(true),
    },
    ...(anonymity?.role === 'SENDER'
      ? []
      : [{ destructive: true, icon: 'Prohibit', key: 'block', label: 'Chặn', onPress: () => setConfirm('block') }]),
  ];

  // ── Rendering ──────────────────────────────────────────────────────────
  // "Seen" belongs under the newest message of mine that the other person has read.
  const lastOwn = messages.find((message) => message.senderId === currentUserId && !message.failed);

  const renderItem = ({ index, item }: { index: number; item: Message }) => {
    const isMine = item.senderId === currentUserId;
    const older = messages[index + 1];
    const showTime =
      !older || new Date(item.createdAt).getTime() - new Date(older.createdAt).getTime() > TIME_GAP_MS;
    const isBlurred = Boolean(item.sensitive) && !isMine && !shownImages.has(item.id);
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
        {item.storyId ? (
          <View style={[styles.storyLabel, isMine ? styles.storyLabelMine : styles.storyLabelTheirs]}>
            <ClayIcon color={clayColors.caption} name="Reply" size={14} />
            <ClayText style={styles.storyLabelText} variant="meta">
              {isMine ? 'Bạn đã trả lời story' : 'Đã trả lời story của bạn'}
            </ClayText>
          </View>
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
            ]}
          >
            {item.imageUrl ? (
              <View>
                <Image
                  accessibilityLabel={isBlurred ? 'Ảnh có thể nhạy cảm, đang bị làm mờ' : 'Ảnh trong tin nhắn'}
                  // Same strength on Android and iOS; the picture underneath is not recognisable.
                  blurRadius={isBlurred ? 60 : 0}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  // The API signs each chat image URL for a limited time, so the URL
                  // differs on every load; cache by message instead of by URL.
                  source={{ cacheKey: `message-image-${item.id}`, uri: item.imageUrl }}
                  style={styles.image}
                />
                {isBlurred ? (
                  <Pressable
                    accessibilityHint="Ảnh có thể chứa nội dung nhạy cảm"
                    accessibilityLabel="Xem ảnh"
                    accessibilityRole="button"
                    onPress={() => setShownImages((current) => new Set(current).add(item.id))}
                    style={styles.blurCover}
                  >
                    <ClayIcon color={clayColors.onPrimary} name="EyeSlash" size={22} />
                    <ClayText style={styles.blurText} variant="caption">
                      Ảnh nhạy cảm · Chạm để xem
                    </ClayText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {item.content ? (
              <ClayText style={isMine ? styles.textMine : styles.textTheirs} variant="body">
                {item.content}
              </ClayText>
            ) : null}
          </View>
        </Pressable>
        {isMine && item.sensitive ? (
          <ClayText style={styles.status} variant="meta">
            Ảnh này được làm mờ với người nhận
          </ClayText>
        ) : null}
        {!isMine && item.warning ? (
          <View style={styles.warning}>
            <ClayIcon color={clayColors.warningInk} name="TriangleWarning" size={16} />
            <ClayText style={styles.warningText} variant="caption">
              Tin nhắn có dấu hiệu lừa đảo. Đừng chuyển tiền hay gửi mã OTP.
            </ClayText>
          </View>
        ) : null}
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

  // One notice above the composer, most important first.
  const notice = isClosed
    ? null
    : anonymity?.role === 'RECIPIENT' && !anonymity.revealed
      ? 'Tin nhắn ẩn danh: bạn không biết người này là ai. Đừng chuyển tiền, gửi mã OTP hay thông tin cá nhân.'
      : isHiddenSender
        ? 'Bạn đang nhắn ẩn danh: người nhận không biết bạn là ai, cho tới khi bạn tự tiết lộ. Chỉ gửi được chữ.'
        : isWaitingForAnswer
          ? 'Tin nhắn chờ: người này chưa chấp nhận. Bạn gửi được tối đa 3 tin, chỉ chữ, và không biết họ đã xem chưa.'
          : null;

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
          accessibilityLabel={isAnonymousPeer ? 'Người ẩn danh' : `Xem trang cá nhân của ${peerName}`}
          accessibilityRole={isAnonymousPeer ? 'text' : 'button'}
          disabled={isAnonymousPeer}
          onPress={() => navigation.openProfile(peer.id)}
          style={styles.headerPeer}
        >
          <PeerAvatar peer={peer} size={40} />
          <View style={styles.headerText}>
            <ClayText level={1} numberOfLines={1} style={styles.headerName} variant="heading">
              {peerName}
            </ClayText>
            <ClayText numberOfLines={1} style={styles.headerUsername} variant="meta">
              {isAnonymousPeer ? 'Danh tính được ẩn' : `@${peer.username}`}
            </ClayText>
          </View>
        </Pressable>
        {conversation ? (
          <Pressable
            accessibilityLabel="Tuỳ chọn cuộc trò chuyện"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsMenuVisible(true)}
            style={styles.headerButton}
          >
            <ClayIcon color={clayColors.text} name="DotsThree" size={22} weight="bold" />
          </Pressable>
        ) : null}
      </View>

      {isRequest && !isClosed ? (
        <View style={styles.requestBar}>
          <ClayText style={styles.requestText} variant="caption">
            {isAnonymousPeer
              ? 'Một người ẩn danh muốn nhắn tin với bạn. Trả lời hoặc chấp nhận thì cuộc trò chuyện chuyển vào hộp thư chính.'
              : `${peerName} muốn nhắn tin với bạn. Họ không biết bạn đã xem tin cho tới khi bạn trả lời hoặc chấp nhận.`}
          </ClayText>
          <View style={styles.requestActions}>
            <ClayButton
              accessibilityLabel="Báo cáo cuộc trò chuyện"
              disabled={isBusy}
              onPress={() => setIsReportVisible(true)}
              size="sm"
              title="Báo cáo"
              variant="destructive"
            />
            <View style={styles.fill} />
            <ClayButton
              accessibilityLabel="Xoá tin nhắn chờ"
              disabled={isBusy}
              onPress={handleDecline}
              size="sm"
              title="Xoá"
              variant="secondary"
            />
            <ClayButton
              accessibilityLabel="Chấp nhận tin nhắn"
              disabled={isBusy}
              onPress={handleAccept}
              size="sm"
              title="Chấp nhận"
              variant="primary"
            />
          </View>
        </View>
      ) : null}

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
              <PeerAvatar peer={peer} size={48} />
              <ClayText style={styles.emptyName} variant="heading">
                {peerName}
              </ClayText>
              <ClayText style={styles.emptyText} variant="caption">
                {isHiddenSender
                  ? 'Gửi tin đầu tiên. Người nhận sẽ thấy bạn là "Người ẩn danh".'
                  : 'Hãy gửi lời chào để bắt đầu cuộc trò chuyện.'}
              </ClayText>
            </View>
          }
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          renderItem={renderItem}
          style={styles.fill}
        />
      )}

      {notice ? (
        <View style={styles.notice}>
          <ClayIcon
            color={clayColors.textSecondary}
            name={anonymity ? 'Mask' : 'ShieldWarning'}
            size={16}
          />
          <ClayText style={styles.noticeText} variant="caption">
            {notice}
          </ClayText>
        </View>
      ) : null}

      {isClosed ? (
        <View style={[styles.closed, { paddingBottom: Math.max(insets.bottom, claySpacing.md) }]}>
          <ClayText style={styles.closedText} variant="caption">
            Cuộc trò chuyện đã đóng. Không ai gửi thêm tin được nữa.
          </ClayText>
        </View>
      ) : (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, claySpacing.sm) }]}>
          {canSendImages ? (
            <Pressable
              accessibilityLabel="Gửi ảnh"
              accessibilityRole="button"
              hitSlop={6}
              onPress={handlePickImage}
              style={styles.composerButton}
            >
              <ClayIcon color={clayColors.textSecondary} name="Image" size={24} />
            </Pressable>
          ) : null}
          <TextInput
            accessibilityLabel="Nội dung tin nhắn"
            maxLength={MAX_LENGTH}
            multiline
            onChangeText={setText}
            placeholder={isHiddenSender ? 'Nhắn ẩn danh…' : 'Nhắn tin…'}
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
            <ClayIcon
              color={canSend ? clayColors.onPrimary : clayColors.caption}
              name="ArrowUp"
              size={20}
              weight="bold"
            />
          </Pressable>
        </View>
      )}

      <ActionSheet
        onClose={() => setIsMenuVisible(false)}
        options={menuOptions}
        title={isAnonymousPeer ? 'Người ẩn danh' : peerName}
        visible={isMenuVisible}
      />
      <ReportModal
        onClose={() => setIsReportVisible(false)}
        onReported={() => {
          // Reporting an anonymous conversation closes it; leave and let the inbox refresh.
          if (anonymity?.role === 'RECIPIENT') {
            navigation.back();
          }
        }}
        target={isReportVisible ? { id: conversationId, type: 'CONVERSATION' } : null}
      />
      <ConfirmModal
        confirmLabel={confirm === 'reveal' ? 'Tiết lộ' : 'Chặn'}
        destructive={confirm === 'block'}
        icon={confirm === 'reveal' ? 'Mask' : 'Prohibit'}
        isBusy={isBusy}
        message={
          confirm === 'reveal'
            ? 'Người nhận sẽ thấy tên và ảnh đại diện của bạn trong cuộc trò chuyện này. Không thể ẩn danh lại.'
            : anonymity?.role === 'RECIPIENT' && !anonymity.revealed
              ? 'Người này sẽ không nhắn ẩn danh cho bạn được nữa. Bạn vẫn không biết họ là ai.'
              : `${peerName} sẽ không nhắn tin và không thấy nội dung của bạn được nữa.`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={confirm === 'reveal' ? handleReveal : handleBlock}
        title={confirm === 'reveal' ? 'Tiết lộ danh tính?' : 'Chặn người này?'}
        visible={confirm !== null}
      />
    </KeyboardAvoidingView>
  );
}

/** Bubble corners: soft, with the corner nearest the speaker drawn in tight. */
const BUBBLE_RADIUS = clayRadii.dialog;
const BUBBLE_TAIL = 4;

const styles = StyleSheet.create({
  // A neutral dark scrim over the blurred picture: the same mark wherever an image is held back.
  blurCover: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.55)',
    borderRadius: clayRadii.media,
    bottom: 0,
    gap: claySpacing.sm,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: claySpacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blurText: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
  },
  bubble: {
    borderRadius: BUBBLE_RADIUS,
    borderWidth: 1,
    maxWidth: '78%',
    overflow: 'hidden',
    paddingHorizontal: claySpacing.md,
    paddingVertical: claySpacing.sm,
  },
  bubbleImageOnly: {
    borderBottomLeftRadius: clayRadii.media,
    borderBottomRightRadius: clayRadii.media,
    borderRadius: clayRadii.media,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // Mine on the brand's palest tint with its dark ink: the hue marks whose words these are
  // without turning half the screen raspberry.
  bubbleMine: {
    backgroundColor: clayColors.primarySoft,
    borderBottomRightRadius: BUBBLE_TAIL,
    borderColor: clayColors.primaryTrack,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: clayDimensions.gutter,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubbleTheirs: {
    backgroundColor: clayColors.surface,
    borderBottomLeftRadius: BUBBLE_TAIL,
    borderColor: clayColors.border,
  },
  closed: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderTopColor: clayColors.border,
    borderTopWidth: 1,
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.md,
  },
  closedText: {
    color: clayColors.textSecondary,
    textAlign: 'center',
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: clayColors.surface,
    borderTopColor: clayColors.border,
    borderTopWidth: 1,
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
    paddingHorizontal: claySpacing.xl,
    paddingVertical: claySpacing.xxl,
    // The list is inverted, so its content is flipped back for reading.
    transform: [{ scaleY: -1 }],
  },
  emptyName: {
    marginTop: claySpacing.md,
  },
  emptyText: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.xs,
    textAlign: 'center',
  },
  fill: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: clayColors.canvas,
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: claySpacing.sm,
    paddingHorizontal: claySpacing.sm,
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
    gap: claySpacing.md,
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
    backgroundColor: clayColors.surface,
    borderColor: clayColors.control,
    borderRadius: clayDimensions.minTouchTarget / 2,
    borderWidth: 1,
    color: clayColors.text,
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    maxHeight: 120,
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: claySpacing.base,
    paddingVertical: 10,
  },
  listContent: {
    paddingVertical: claySpacing.md,
  },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: clayColors.surfaceWell,
    flexDirection: 'row',
    gap: claySpacing.sm,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.md,
  },
  noticeText: {
    color: clayColors.textSecondary,
    flex: 1,
  },
  requestActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.sm,
    marginTop: claySpacing.md,
  },
  requestBar: {
    backgroundColor: clayColors.primarySoft,
    borderBottomColor: clayColors.primaryTrack,
    borderBottomWidth: 1,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.md,
  },
  requestText: {
    color: clayColors.primaryInk,
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
    backgroundColor: clayColors.surfaceWell,
  },
  status: {
    alignSelf: 'flex-end',
    color: clayColors.caption,
    marginRight: clayDimensions.gutter,
    marginTop: 2,
  },
  statusFailed: {
    color: clayColors.error,
  },
  storyLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.xs,
    marginTop: claySpacing.xs,
    paddingHorizontal: clayDimensions.gutter,
  },
  storyLabelMine: {
    justifyContent: 'flex-end',
  },
  storyLabelText: {
    color: clayColors.caption,
  },
  storyLabelTheirs: {
    justifyContent: 'flex-start',
  },
  textMine: {
    color: clayColors.primaryInk,
  },
  textTheirs: {
    color: clayColors.text,
  },
  timeLabel: {
    ...tabularNums,
    alignSelf: 'center',
    color: clayColors.caption,
    marginVertical: claySpacing.md,
  },
  // The scam warning: the warning pale pair, attached to the message it is about.
  warning: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    backgroundColor: clayColors.warningBg,
    borderColor: clayColors.warningBorder,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: claySpacing.sm,
    marginHorizontal: clayDimensions.gutter,
    marginTop: claySpacing.xs,
    maxWidth: '78%',
    paddingHorizontal: claySpacing.md,
    paddingVertical: claySpacing.sm,
  },
  warningText: {
    color: clayColors.warningInk,
    flexShrink: 1,
  },
});
