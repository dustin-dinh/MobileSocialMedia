import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { showToast } from '../../../components/common/toast';
import { ApiError } from '../../../services/apiError';
import { useAuthSession } from '../../auth/authSession';
import { feedEvents } from '../../feed/feedEvents';
import type { Post } from '../../feed/types';
import { commentService } from '../services/commentService';
import type { CommentAuthor, PostComment } from '../types';

export type CommentRow = PostComment & { isReply: boolean };

/**
 * State and actions for the comment thread of one post: paging, replies,
 * like, send/reply/edit and delete — all optimistic with rollback.
 *
 * Shared by the comment sheet and the Post detail screen.
 */
export function useCommentThread(post: Post | null, active: boolean) {
  const { user } = useAuthSession();
  const postId = post?.id ?? null;

  const [comments, setComments] = useState<PostComment[]>([]);
  const [repliesByParent, setRepliesByParent] = useState<Record<string, PostComment[]>>({});
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const [commentsCount, setCommentsCount] = useState(post?.commentsCount ?? 0);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [editing, setEditing] = useState<PostComment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // The first page could not be loaded: the thread shows an error with a retry.
  const [loadFailed, setLoadFailed] = useState(false);
  const pageRef = useRef(1);

  /** Publishes a new comment total to every post card showing this post. */
  const publishCount = useCallback(
    (count: number) => {
      const next = Math.max(0, count);

      setCommentsCount(next);

      if (postId) {
        feedEvents.emitCommentAdded(postId, next);
      }
    },
    [postId],
  );

  const loadFirstPage = useCallback(async (targetPostId: string) => {
    const data = await commentService.getComments(targetPostId);

    pageRef.current = 1;
    setLoadFailed(false);
    setComments(data);
    setRepliesByParent({});
    setExpandedIds(new Set());
    setHasMore(data.length >= commentService.PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (!active || !postId) {
      setComments([]);
      return;
    }

    setInputText('');
    setReplyTo(null);
    setEditing(null);
    setCommentsCount(post?.commentsCount ?? 0);
    setIsLoading(true);

    loadFirstPage(postId)
      .catch((error) => {
        console.error('Failed to load comments:', error);
        setLoadFailed(true);
      })
      .finally(() => setIsLoading(false));
    // `post.commentsCount` is only the starting value; later changes come from this hook.
  }, [active, loadFirstPage, postId]);

  const refresh = useCallback(async () => {
    if (!postId) {
      return;
    }

    setIsRefreshing(true);

    try {
      await loadFirstPage(postId);
    } catch (error) {
      console.error('Refresh comments failed:', error);
      setLoadFailed(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadFirstPage, postId]);

  const loadMore = useCallback(async () => {
    if (!postId || !hasMore || isLoadingMore || isLoading) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const data = await commentService.getComments(postId, pageRef.current + 1);

      pageRef.current += 1;
      setHasMore(data.length >= commentService.PAGE_SIZE);
      setComments((current) => {
        const seen = new Set(current.map((comment) => comment.id));

        return [...current, ...data.filter((comment) => !seen.has(comment.id))];
      });
    } catch (error) {
      console.error('Load more comments failed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isLoadingMore, postId]);

  /** Applies `change` to a comment wherever it lives (top level or a reply list). */
  const patchComment = useCallback(
    (commentId: string, change: (comment: PostComment) => PostComment) => {
      const apply = (list: PostComment[]) =>
        list.map((comment) => (comment.id === commentId ? change(comment) : comment));

      setComments(apply);
      setRepliesByParent((current) =>
        Object.fromEntries(Object.entries(current).map(([key, list]) => [key, apply(list)])),
      );
    },
    [],
  );

  const toggleLike = useCallback(
    async (target: PostComment) => {
      const nextLiked = !target.isLiked;

      patchComment(target.id, (comment) => ({
        ...comment,
        isLiked: nextLiked,
        likesCount: Math.max(0, comment.likesCount + (nextLiked ? 1 : -1)),
      }));

      try {
        await commentService.toggleLikeComment(target.id, target.isLiked);
      } catch (error) {
        console.error('Toggle like comment failed:', error);
        patchComment(target.id, () => target);
      }
    },
    [patchComment],
  );

  const toggleReplies = useCallback(
    async (parent: PostComment) => {
      if (expandedIds.has(parent.id)) {
        setExpandedIds((current) => new Set([...current].filter((id) => id !== parent.id)));
        return;
      }

      setExpandedIds((current) => new Set(current).add(parent.id));

      if (repliesByParent[parent.id]) {
        return;
      }

      try {
        const replies = await commentService.getReplies(parent.id, parent.postId);

        setRepliesByParent((current) => ({ ...current, [parent.id]: replies }));
      } catch (error) {
        console.error('Failed to load replies:', error);
        showToast('Không tải được trả lời.', 'error');
      }
    },
    [expandedIds, repliesByParent],
  );

  const startReply = useCallback((comment: PostComment) => {
    setEditing(null);
    setReplyTo(comment);
    setInputText('');
  }, []);

  const startEdit = useCallback((comment: PostComment) => {
    setReplyTo(null);
    setEditing(comment);
    setInputText(comment.content);
  }, []);

  const cancelCompose = useCallback(() => {
    setReplyTo(null);
    setEditing(null);
    setInputText('');
  }, []);

  const submit = useCallback(async () => {
    const content = inputText.trim();

    if (!postId || !user || !content || isSending) {
      return;
    }

    setIsSending(true);

    // ── Save an edit ────────────────────────────────────────────────────
    if (editing) {
      const original = editing;

      patchComment(original.id, (comment) => ({
        ...comment,
        content,
        editedAt: new Date().toISOString(),
      }));
      cancelCompose();

      try {
        const saved = await commentService.updateComment(original, content);

        patchComment(original.id, (comment) => ({ ...comment, ...saved }));
      } catch (error) {
        console.error('Failed to edit comment:', error);
        patchComment(original.id, () => original);
        showToast('Không lưu được chỉnh sửa. Vui lòng thử lại.', 'error');
      } finally {
        setIsSending(false);
      }

      return;
    }

    // ── Send a new comment or reply ─────────────────────────────────────
    const author: CommentAuthor = {
      avatarUrl: user.avatarUrl ?? null,
      displayName: user.displayName ?? user.username,
      id: user.id,
      username: user.username,
    };
    // Threads are two levels deep: replying to a reply targets its parent.
    const parentId = replyTo ? (replyTo.parentId ?? replyTo.id) : null;
    const tempId = `temp-cmt-${Date.now()}`;
    const optimistic: PostComment = {
      author,
      content,
      createdAt: new Date().toISOString(),
      id: tempId,
      isLiked: false,
      likesCount: 0,
      parentId,
      postId,
      repliesCount: 0,
    };
    const previousCount = commentsCount;

    const replaceTemp = (replacement: PostComment | null) => {
      const apply = (list: PostComment[]) =>
        replacement
          ? list.map((comment) => (comment.id === tempId ? replacement : comment))
          : list.filter((comment) => comment.id !== tempId);

      if (parentId) {
        setRepliesByParent((current) => ({
          ...current,
          [parentId]: apply(current[parentId] ?? []),
        }));
      } else {
        setComments(apply);
      }
    };

    if (parentId) {
      setRepliesByParent((current) => ({
        ...current,
        [parentId]: [...(current[parentId] ?? []), optimistic],
      }));
      setExpandedIds((current) => new Set(current).add(parentId));
      patchComment(parentId, (comment) => ({
        ...comment,
        repliesCount: (comment.repliesCount ?? 0) + 1,
      }));
    } else {
      setComments((current) => [optimistic, ...current]);
    }

    cancelCompose();
    publishCount(previousCount + 1);

    try {
      const saved = await commentService.addComment(postId, content, author, parentId);

      replaceTemp(saved);
    } catch (error) {
      console.error('Failed to send comment:', error);
      replaceTemp(null);

      if (parentId) {
        patchComment(parentId, (comment) => ({
          ...comment,
          repliesCount: Math.max(0, (comment.repliesCount ?? 1) - 1),
        }));
      }

      publishCount(previousCount);
      showToast('Không thể gửi bình luận lúc này. Vui lòng thử lại.', 'error');
    } finally {
      setIsSending(false);
    }
  }, [
    cancelCompose,
    commentsCount,
    editing,
    inputText,
    isSending,
    patchComment,
    postId,
    publishCount,
    replyTo,
    user,
  ]);

  const remove = useCallback(
    async (target: PostComment) => {
      const previousComments = comments;
      const previousReplies = repliesByParent;
      const previousCount = commentsCount;
      const removedCount = 1 + (target.parentId ? 0 : (target.repliesCount ?? 0));

      setComments((current) => current.filter((comment) => comment.id !== target.id));
      setRepliesByParent((current) =>
        Object.fromEntries(
          Object.entries(current)
            .filter(([parentId]) => parentId !== target.id)
            .map(([parentId, list]) => [
              parentId,
              list.filter((comment) => comment.id !== target.id),
            ]),
        ),
      );

      if (target.parentId) {
        patchComment(target.parentId, (comment) => ({
          ...comment,
          repliesCount: Math.max(0, (comment.repliesCount ?? 1) - 1),
        }));
      }

      if (editing?.id === target.id || replyTo?.id === target.id) {
        cancelCompose();
      }

      publishCount(previousCount - removedCount);

      try {
        publishCount(await commentService.deleteComment(target));
        showToast('Đã xoá bình luận.');
      } catch (error) {
        // Already deleted elsewhere: the optimistic removal is the truth.
        if (error instanceof ApiError && error.status === 404) {
          return;
        }

        console.error('Failed to delete comment:', error);
        setComments(previousComments);
        setRepliesByParent(previousReplies);
        publishCount(previousCount);
        showToast(
          error instanceof ApiError && error.status === 403
            ? 'Bạn không có quyền xoá bình luận này.'
            : 'Không xoá được bình luận. Vui lòng thử lại.',
          'error',
        );
      }
    },
    [
      cancelCompose,
      comments,
      commentsCount,
      editing,
      patchComment,
      publishCount,
      replyTo,
      repliesByParent,
    ],
  );

  /** Top-level comments with the replies of expanded ones spliced in below them. */
  const rows = useMemo<CommentRow[]>(
    () =>
      comments.flatMap((comment) => [
        { ...comment, isReply: false },
        ...(expandedIds.has(comment.id)
          ? (repliesByParent[comment.id] ?? []).map((reply) => ({ ...reply, isReply: true }))
          : []),
      ]),
    [comments, expandedIds, repliesByParent],
  );

  return {
    cancelCompose,
    commentsCount,
    editing,
    expandedIds,
    hasMore,
    inputText,
    isLoading,
    loadFailed,
    isLoadingMore,
    isRefreshing,
    isSending,
    loadMore,
    refresh,
    remove,
    replyTo,
    rows,
    setInputText,
    startEdit,
    startReply,
    submit,
    toggleLike,
    toggleReplies,
  };
}
