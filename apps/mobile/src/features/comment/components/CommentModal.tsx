import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';

import { useAuthSession } from '../../auth/authSession';
import { feedEvents } from '../../feed/feedEvents';
import type { Post } from '../../feed/types';
import { commentColors, commentRadii } from '../commentTheme';
import { clayColors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { clayDimensions } from '../../../theme/spacing';
import { getClayBoxShadow } from '../../../theme/clay';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { commentService } from '../services/commentService';
import type { CommentAuthor, PostComment } from '../types';
import { CommentItem } from './CommentItem';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserMiniAvatar({
  avatarUrl,
  displayName,
  username,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  username: string;
}) {
  const name = displayName?.trim() || username;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarHalo}>
      {avatarUrl ? (
        <ExpoImage
          source={{ uri: avatarUrl }}
          style={styles.inputAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.inputAvatar, styles.inputAvatarFallback]}>
          <ClayText variant="caption" style={styles.inputAvatarInitials}>
            {initials || '?'}
          </ClayText>
        </View>
      )}
    </View>
  );
}

function CommentEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <ClayEmoji name="speech_balloon" size={56} />
      <ClayText variant="heading" style={styles.emptyTitle}>
        Chưa có bình luận nào
      </ClayText>
      <ClayText variant="caption" style={styles.emptySubtitle}>
        Hãy là người đầu tiên bình luận về bài viết này!
      </ClayText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CommentModal Component
// ---------------------------------------------------------------------------

export type CommentModalProps = {
  onClose: () => void;
  post: Post | null;
  visible: boolean;
};

export function CommentModal({ onClose, post, visible }: CommentModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const [comments, setComments] = useState<PostComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList<PostComment>>(null);

  // ── Load comments when modal opens for a post ──────────────────────────
  const loadComments = useCallback(async (targetPostId: string) => {
    setIsLoading(true);
    try {
      const data = await commentService.getComments(targetPostId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && post) {
      setInputText('');
      void loadComments(post.id);
    } else {
      setComments([]);
    }
  }, [loadComments, post, visible]);

  // ── Pull-to-refresh ───────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (!post) {
      return;
    }
    setIsRefreshing(true);
    try {
      const data = await commentService.getComments(post.id);
      setComments(data);
    } catch (error) {
      console.error('Refresh comments failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [post]);

  // ── Toggle Like Comment ────────────────────────────────────────────────
  const handleToggleLikeComment = useCallback(
    async (targetComment: PostComment) => {
      const previousLiked = targetComment.isLiked;
      const nextLiked = !previousLiked;

      // Optimistic update
      setComments((prev) =>
        prev.map((c) =>
          c.id === targetComment.id
            ? {
                ...c,
                isLiked: nextLiked,
                likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
              }
            : c,
        ),
      );

      try {
        await commentService.toggleLikeComment(targetComment.id, previousLiked);
      } catch (error) {
        console.error('Toggle like comment failed:', error);
        // Rollback
        setComments((prev) =>
          prev.map((c) => (c.id === targetComment.id ? targetComment : c)),
        );
      }
    },
    [],
  );

  // ── Send Comment ───────────────────────────────────────────────────────
  const handleSendComment = useCallback(async () => {
    if (!post || !user || !inputText.trim() || isSending) {
      return;
    }

    const trimmedContent = inputText.trim();
    const tempId = `temp-cmt-${Date.now()}`;

    const author: CommentAuthor = {
      avatarUrl: user.avatarUrl ?? null,
      displayName: user.displayName ?? user.username,
      id: user.id,
      username: user.username,
    };

    const optimisticComment: PostComment = {
      author,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      id: tempId,
      isLiked: false,
      likesCount: 0,
      postId: post.id,
    };

    // 1. Optimistically prepend new comment & reset input
    setComments((prev) => [optimisticComment, ...prev]);
    setInputText('');
    setIsSending(true);

    // 2. Notify post & feed of new comment count
    const updatedCommentsCount = (post.commentsCount ?? 0) + 1;
    feedEvents.emit('commentAdded', {
      commentsCount: updatedCommentsCount,
      postId: post.id,
    });

    // Scroll to top of list
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });

    try {
      const realComment = await commentService.addComment(post.id, trimmedContent, author);

      // 3. Replace temporary optimistic comment with verified server comment
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? realComment : c)),
      );
    } catch (error) {
      console.error('Failed to send comment:', error);

      // 4. Rollback on failure
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      feedEvents.emit('commentAdded', {
        commentsCount: post.commentsCount,
        postId: post.id,
      });

      Alert.alert('Lỗi', 'Không thể gửi bình luận lúc này. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, post, user]);

  if (!visible || !post) {
    return null;
  }

  const canSend = inputText.trim().length > 0 && !isSending;
  const currentCount = comments.length > 0 ? comments.length : post.commentsCount;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        {/* Backdrop dismiss */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss comments sheet"
          style={styles.backdropPressable}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ClaySurface
            variant="modal"
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
          >
            {/* ── Handle Bar ───────────────────────────────── */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* ── Header ───────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <ClayText variant="heading" style={styles.headerTitle}>
                  Bình luận
                </ClayText>
                {currentCount > 0 ? (
                  <View style={styles.countBadge}>
                    <ClayText variant="caption" style={styles.countBadgeText}>
                      {currentCount}
                    </ClayText>
                  </View>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                hitSlop={12}
                onPress={onClose}
                style={styles.closeButton}
              >
                <ClayIcon name="X" size={16} weight="bold" color={clayColors.caption} />
              </Pressable>
            </View>

            {/* ── Comment List ─────────────────────────────── */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={clayColors.primary} />
                <ClayText variant="caption" style={styles.loadingText}>
                  Đang tải bình luận...
                </ClayText>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                contentContainerStyle={
                  comments.length === 0 ? styles.emptyListContent : styles.listContent
                }
                data={comments}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => item.id}
                ListEmptyComponent={CommentEmptyState}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={7}
                removeClippedSubviews={Platform.OS === 'android'}
                refreshControl={
                  <RefreshControl
                    colors={[clayColors.primary]}
                    onRefresh={handleRefresh}
                    refreshing={isRefreshing}
                    tintColor={clayColors.primary}
                  />
                }
                renderItem={({ item }) => (
                  <CommentItem comment={item} onToggleLike={handleToggleLikeComment} />
                )}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            )}

            {/* ── Bottom Input Bar ─────────────────────────── */}
            <View style={styles.inputContainer}>
              <UserMiniAvatar
                avatarUrl={user?.avatarUrl ?? null}
                displayName={user?.displayName ?? null}
                username={user?.username ?? 'user'}
              />

              <View style={styles.inputWrap}>
                <TextInput
                  autoCapitalize="sentences"
                  autoCorrect
                  maxLength={500}
                  multiline
                  onChangeText={setInputText}
                  placeholder="Thêm bình luận..."
                  placeholderTextColor={clayColors.caption}
                  style={styles.input}
                  value={inputText}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send comment"
                  disabled={!canSend}
                  hitSlop={8}
                  onPress={handleSendComment}
                  style={[
                    styles.sendButton,
                    canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
                  ]}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={clayColors.onPrimary} />
                  ) : (
                    <ClayIcon
                      name="ArrowUp"
                      size={16}
                      weight="bold"
                      color={canSend ? clayColors.onPrimary : clayColors.caption}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </ClaySurface>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  avatarHalo: {
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: clayColors.surfaceHigh,
  },
  backdropPressable: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    width: 28,
  },
  countBadge: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: clayColors.border,
  },
  countBadgeText: {
    color: clayColors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamilies.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptySubtitle: {
    color: clayColors.caption,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  handle: {
    backgroundColor: clayColors.border,
    borderRadius: 3,
    height: 5,
    width: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    color: clayColors.text,
    fontFamily: fontFamilies.regular,
    flex: 1,
    fontSize: 14,
    maxHeight: 90,
    minHeight: 36,
    paddingRight: 8,
    paddingVertical: 4,
  },
  inputAvatar: {
    borderRadius: 17,
    height: 34,
    width: 34,
  },
  inputAvatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  inputAvatarInitials: {
    color: clayColors.primary,
    fontSize: 12,
    fontFamily: fontFamilies.extraBold,
  },
  inputContainer: {
    alignItems: 'flex-end',
    backgroundColor: clayColors.surface,
    borderTopColor: clayColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: commentRadii.input,
    flex: 1,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1,
    borderTopColor: clayColors.border,
    borderLeftColor: clayColors.border,
    borderRightColor: clayColors.shadowLight,
    borderBottomColor: clayColors.shadowLight,
    boxShadow: getClayBoxShadow('inset'),
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 8,
  },
  overlay: {
    backgroundColor: commentColors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    marginLeft: 6,
    width: 30,
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  sendButtonActive: {
    backgroundColor: clayColors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: clayColors.surfaceWell,
  },
  sheet: {
    backgroundColor: clayColors.surface,
    borderTopLeftRadius: commentRadii.modal,
    borderTopRightRadius: commentRadii.modal,
    height: '75%',
    maxHeight: '85%',
    padding: 0,
  },
});
