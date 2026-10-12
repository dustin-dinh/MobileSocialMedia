import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ActionSheet, type ActionSheetOption } from '../../../components/common/ActionSheet';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import type { Post } from '../../feed/types';
import { ReportModal } from '../../report/ReportModal';
import type { ReportTarget } from '../../report/reportService';
import { commentRadii } from '../commentTheme';
import { useCommentThread, type CommentRow } from '../hooks/useCommentThread';
import type { PostComment } from '../types';
import { CommentItem } from './CommentItem';

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

export type CommentThreadProps = {
  /** Extra bottom padding for the input bar (safe area of the host). */
  bottomInset?: number;
  /** Scroll to this comment once the list has loaded (opened from a notification). */
  focusCommentId?: string;
  /** Rendered above the comments and scrolls with them (the post, on the detail screen). */
  header?: ReactElement | null;
  /** Called before leaving the thread for another screen (e.g. to close the sheet). */
  onBeforeNavigate?: () => void;
  onCountChange?: (count: number) => void;
  post: Post;
};

/**
 * The comments of one post: list with replies, the input bar, and the menus
 * for editing, deleting and reporting. Hosted by the comment sheet and by the
 * Post detail screen.
 */
export function CommentThread({
  bottomInset = 0,
  focusCommentId,
  header = null,
  onBeforeNavigate,
  onCountChange,
  post,
}: CommentThreadProps) {
  const { user } = useAuthSession();
  const navigation = useAppNavigation();
  const thread = useCommentThread(post, true);
  const listRef = useRef<FlatList<CommentRow>>(null);
  const inputRef = useRef<TextInput>(null);
  const [menuComment, setMenuComment] = useState<PostComment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostComment | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  useEffect(() => {
    onCountChange?.(thread.commentsCount);
  }, [onCountChange, thread.commentsCount]);

  // Bring the comment a notification pointed at into view.
  useEffect(() => {
    if (!focusCommentId || thread.isLoading) {
      return;
    }

    const index = thread.rows.findIndex((row) => row.id === focusCommentId);

    if (index >= 0) {
      listRef.current?.scrollToIndex({ animated: true, index, viewPosition: 0.2 });
    }
    // Only when the first page arrives; later row changes must not re-scroll.
  }, [focusCommentId, thread.isLoading]);

  const leaveFor = useCallback(
    (go: () => void) => {
      onBeforeNavigate?.();
      go();
    },
    [onBeforeNavigate],
  );

  const handlePressAuthor = useCallback(
    (userId: string) => leaveFor(() => navigation.openProfile(userId)),
    [leaveFor, navigation],
  );
  const handlePressHashtag = useCallback(
    (tag: string) => leaveFor(() => navigation.openHashtag(tag)),
    [leaveFor, navigation],
  );
  const handlePressMention = useCallback(
    (username: string) => leaveFor(() => navigation.openMention(username)),
    [leaveFor, navigation],
  );

  const handleReply = useCallback(
    (comment: PostComment) => {
      thread.startReply(comment);
      inputRef.current?.focus();
    },
    [thread.startReply],
  );

  const menuOptions = useMemo<ActionSheetOption[]>(() => {
    if (!menuComment) {
      return [];
    }

    const isMine = menuComment.author.id === user?.id;
    const options: ActionSheetOption[] = [];

    if (isMine) {
      options.push({
        icon: 'PencilSimple',
        key: 'edit',
        label: 'Sửa bình luận',
        onPress: () => {
          thread.startEdit(menuComment);
          inputRef.current?.focus();
        },
      });
    }

    // The post's author moderates the comments under their own post.
    if (isMine || post.author.id === user?.id) {
      options.push({
        destructive: true,
        icon: 'Trash',
        key: 'delete',
        label: 'Xoá bình luận',
        onPress: () => setDeleteTarget(menuComment),
      });
    }

    if (!isMine) {
      options.push({
        destructive: true,
        icon: 'Flag',
        key: 'report',
        label: 'Báo cáo bình luận',
        onPress: () => setReportTarget({ id: menuComment.id, type: 'COMMENT' }),
      });
    }

    return options;
  }, [menuComment, post.author.id, thread.startEdit, user?.id]);

  const renderItem = useCallback(
    ({ item }: { item: CommentRow }) => (
      <CommentItem
        comment={item}
        isReply={item.isReply}
        onOpenActions={setMenuComment}
        onPressAuthor={handlePressAuthor}
        onPressHashtag={handlePressHashtag}
        onPressMention={handlePressMention}
        onReply={handleReply}
        onToggleLike={thread.toggleLike}
        onToggleReplies={thread.toggleReplies}
        repliesExpanded={thread.expandedIds.has(item.id)}
      />
    ),
    [
      handlePressAuthor,
      handlePressHashtag,
      handlePressMention,
      handleReply,
      thread.expandedIds,
      thread.toggleLike,
      thread.toggleReplies,
    ],
  );

  const isEditing = thread.editing !== null;
  const unchangedEdit = isEditing && thread.inputText.trim() === thread.editing?.content;
  const canSend = thread.inputText.trim().length > 0 && !thread.isSending && !unchangedEdit;
  const composeTarget = thread.replyTo
    ? `Đang trả lời @${thread.replyTo.author.username}`
    : isEditing
      ? 'Đang sửa bình luận'
      : null;

  return (
    <>
      {/* ── Comment List ─────────────────────────────── */}
      {thread.isLoading && !header ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={clayColors.primary} />
          <ClayText variant="caption" style={styles.loadingText}>
            Đang tải bình luận...
          </ClayText>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          contentContainerStyle={
            thread.rows.length === 0 && !header ? styles.emptyListContent : styles.listContent
          }
          data={thread.rows}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            thread.isLoading ? (
              <ActivityIndicator color={clayColors.primary} style={styles.inlineLoading} />
            ) : (
              CommentEmptyState
            )
          }
          ListFooterComponent={
            thread.isLoadingMore ? (
              <ActivityIndicator color={clayColors.primary} style={styles.inlineLoading} />
            ) : null
          }
          ListHeaderComponent={header}
          onEndReached={thread.loadMore}
          onEndReachedThreshold={0.5}
          // A row's height varies, so a failed jump is retried once it is measured.
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => listRef.current?.scrollToIndex({ animated: true, index }), 250);
          }}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              colors={[clayColors.primary]}
              onRefresh={thread.refresh}
              refreshing={thread.isRefreshing}
              tintColor={clayColors.primary}
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}

      {/* ── Reply / edit banner ──────────────────────── */}
      {composeTarget ? (
        <View style={styles.composeBanner}>
          <ClayText numberOfLines={1} style={styles.composeBannerText} variant="meta">
            {composeTarget}
          </ClayText>
          <Pressable
            accessibilityLabel={isEditing ? 'Huỷ sửa bình luận' : 'Huỷ trả lời'}
            accessibilityRole="button"
            hitSlop={12}
            onPress={thread.cancelCompose}
            style={styles.composeBannerClose}
          >
            <ClayIcon name="X" size={14} weight="bold" color={clayColors.caption} />
          </Pressable>
        </View>
      ) : null}

      {/* ── Bottom Input Bar ─────────────────────────── */}
      <View style={[styles.inputContainer, { paddingBottom: bottomInset }]}>
        <UserAvatar
          avatarUrl={user?.avatarUrl ?? null}
          name={user?.displayName?.trim() || user?.username || '?'}
          size={34}
        />

        <View style={styles.inputWrap}>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect
            maxLength={1000}
            multiline
            onChangeText={thread.setInputText}
            placeholder={thread.replyTo ? 'Viết trả lời...' : 'Thêm bình luận...'}
            placeholderTextColor={clayColors.caption}
            ref={inputRef}
            style={styles.input}
            value={thread.inputText}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Save comment' : 'Send comment'}
            disabled={!canSend}
            hitSlop={8}
            onPress={thread.submit}
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
            ]}
          >
            {thread.isSending ? (
              <ActivityIndicator size="small" color={clayColors.onPrimary} />
            ) : (
              <ClayIcon
                name={isEditing ? 'Check' : 'ArrowUp'}
                size={16}
                weight="bold"
                color={canSend ? clayColors.onPrimary : clayColors.caption}
              />
            )}
          </Pressable>
        </View>
      </View>

      <ActionSheet
        onClose={() => setMenuComment(null)}
        options={menuOptions}
        title="Tuỳ chọn bình luận"
        visible={menuComment !== null}
      />

      <ConfirmModal
        confirmLabel="Xoá"
        destructive
        icon="Trash"
        message={
          (deleteTarget?.repliesCount ?? 0) > 0
            ? 'Bình luận này và các trả lời của nó sẽ bị xoá vĩnh viễn.'
            : 'Bình luận này sẽ bị xoá vĩnh viễn.'
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;

          setDeleteTarget(null);

          if (target) {
            void thread.remove(target);
          }
        }}
        title="Xoá bình luận này?"
        visible={deleteTarget !== null}
      />

      <ReportModal onClose={() => setReportTarget(null)} target={reportTarget} />
    </>
  );
}

const styles = StyleSheet.create({
  composeBanner: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderTopColor: clayColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 4,
  },
  composeBannerClose: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  composeBannerText: {
    color: clayColors.textSecondary,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
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
  inlineLoading: {
    paddingVertical: 24,
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
    borderColor: clayColors.border,
    borderWidth: 1,
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
});
