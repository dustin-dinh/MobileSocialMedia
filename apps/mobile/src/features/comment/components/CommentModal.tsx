import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '../../auth/authSession';
import { feedEvents } from '../../feed/feedEvents';
import type { Post } from '../../feed/types';
import { commentColors, commentRadii } from '../commentTheme';
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

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.inputAvatar} />;
  }

  return (
    <View style={[styles.inputAvatar, styles.inputAvatarFallback]}>
      <Text style={styles.inputAvatarInitials}>{initials || '?'}</Text>
    </View>
  );
}

function CommentEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>💬</Text>
      <Text style={styles.emptyTitle}>Chưa có bình luận nào</Text>
      <Text style={styles.emptySubtitle}>Hãy là người đầu tiên bình luận về bài viết này!</Text>
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
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* ── Handle Bar ───────────────────────────────── */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* ── Header ───────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle}>Bình luận</Text>
                {currentCount > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{currentCount}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable hitSlop={12} onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* ── Comment List ─────────────────────────────── */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={commentColors.primary} />
                <Text style={styles.loadingText}>Đang tải bình luận...</Text>
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
                refreshControl={
                  <RefreshControl
                    colors={[commentColors.primary]}
                    onRefresh={handleRefresh}
                    refreshing={isRefreshing}
                    tintColor={commentColors.primary}
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
                  placeholderTextColor={commentColors.placeholder}
                  style={styles.input}
                  value={inputText}
                />

                <Pressable
                  disabled={!canSend}
                  hitSlop={6}
                  onPress={handleSendComment}
                  style={({ pressed }) => [
                    styles.sendButton,
                    canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
                    pressed && canSend ? styles.sendButtonPressed : undefined,
                  ]}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonIcon}>↑</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdropPressable: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  closeButtonText: {
    color: commentColors.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#EEF2F6',
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: commentColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptySubtitle: {
    color: commentColors.caption,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyTitle: {
    color: commentColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  handle: {
    backgroundColor: commentColors.handle,
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
    borderBottomColor: commentColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: commentColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    color: commentColors.text,
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
    backgroundColor: commentColors.primary,
    justifyContent: 'center',
  },
  inputAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    alignItems: 'flex-end',
    backgroundColor: commentColors.surface,
    borderTopColor: commentColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: commentColors.inputBg,
    borderRadius: commentRadii.input,
    flex: 1,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 2,
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
    color: commentColors.caption,
    fontSize: 13,
    marginTop: 8,
  },
  overlay: {
    backgroundColor: commentColors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginLeft: 6,
    width: 28,
  },
  sendButtonActive: {
    backgroundColor: commentColors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: commentColors.primaryDisabled,
  },
  sendButtonIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sendButtonPressed: {
    backgroundColor: commentColors.primaryPressed,
  },
  sheet: {
    backgroundColor: commentColors.surface,
    borderTopLeftRadius: commentRadii.modal,
    borderTopRightRadius: commentRadii.modal,
    height: '75%',
    maxHeight: '85%',
  },
});
