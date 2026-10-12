import { useCallback, useEffect, useRef, useState } from 'react';

import { showToast } from '../../../components/common/toast';
import { useAuthSession } from '../../auth/authSession';
import { feedEvents } from '../feedEvents';
import { feedService } from '../services/feedService';
import { postKey } from '../services/postMapper';
import type { FeedResponse, Post } from '../types';

type UsePostListOptions = {
  /** Decide whether a post created elsewhere in the app belongs at the top of this list. */
  acceptCreated?: (post: Post) => boolean;
};

/** Appends a page, skipping rows already present (pages shift when new posts arrive). */
function appendPage(current: Post[], page: Post[]): Post[] {
  const seen = new Set(current.map(postKey));

  return [...current, ...page.filter((post) => !seen.has(postKey(post)))];
}

/**
 * State for any paginated list of posts: first load, pull-to-refresh, load
 * more, like/save with optimistic updates, and syncing with changes made on
 * other screens through `feedEvents`.
 *
 * `fetchPage` must be stable (wrap it in `useCallback`); changing it reloads the list.
 */
export function usePostList(
  fetchPage: (page: number) => Promise<FeedResponse>,
  { acceptCreated }: UsePostListOptions = {},
) {
  const { user } = useAuthSession();
  const currentUserId = user?.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const pageRef = useRef(1);
  const busyRef = useRef(false);
  // Bumped on every reload so a slow response for an old list is ignored.
  const generationRef = useRef(0);
  const acceptCreatedRef = useRef(acceptCreated);
  acceptCreatedRef.current = acceptCreated;

  const loadFirstPage = useCallback(async () => {
    const generation = ++generationRef.current;

    try {
      const response = await fetchPage(1);

      if (generation !== generationRef.current) {
        return;
      }

      pageRef.current = 1;
      setPosts(response.data);
      setHasMore(response.meta.hasMore);
      setLoadFailed(false);
      setLoadMoreFailed(false);
    } catch (error) {
      console.error('Failed to load posts:', error);

      if (generation === generationRef.current) {
        setLoadFailed(true);
      }
    }
  }, [fetchPage]);

  useEffect(() => {
    setIsLoading(true);
    void loadFirstPage().finally(() => setIsLoading(false));

    return () => {
      generationRef.current++;
    };
  }, [loadFirstPage]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFirstPage();
    setIsRefreshing(false);
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMore || isLoading || isRefreshing) {
      return;
    }

    busyRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreFailed(false);

    const generation = generationRef.current;

    try {
      const response = await fetchPage(pageRef.current + 1);

      if (generation === generationRef.current) {
        pageRef.current += 1;
        setPosts((current) => appendPage(current, response.data));
        setHasMore(response.meta.hasMore);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);

      if (generation === generationRef.current) {
        setLoadMoreFailed(true);
      }
    } finally {
      busyRef.current = false;
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoading, isRefreshing]);

  // ── Changes made elsewhere in the app ─────────────────────────────────
  useEffect(() => {
    const unsubscribers = [
      feedEvents.on('postCreated', (post) => {
        if (acceptCreatedRef.current?.(post)) {
          setPosts((current) => [post, ...current]);
        }
      }),
      feedEvents.on('commentAdded', ({ commentsCount, postId }) => {
        setPosts((current) =>
          current.map((post) => (post.id === postId ? { ...post, commentsCount } : post)),
        );
      }),
      feedEvents.on('postDeleted', ({ postId }) => {
        setPosts((current) => current.filter((post) => post.id !== postId));
      }),
      feedEvents.on('postHidden', ({ authorId, postId }) => {
        setPosts((current) =>
          current.filter(
            (post) =>
              post.id !== postId &&
              post.author.id !== authorId &&
              post.repost?.by.id !== authorId,
          ),
        );
      }),
      feedEvents.on('postUpdated', (updated) => {
        setPosts((current) =>
          current
            // Undoing a repost removes the viewer's own repost row.
            .filter(
              (post) =>
                !(
                  post.id === updated.id &&
                  updated.isReposted === false &&
                  post.repost?.by.id === currentUserId
                ),
            )
            // A repost row keeps its own "reposted by" banner.
            .map((post) => (post.id === updated.id ? { ...updated, repost: post.repost } : post)),
        );
      }),
      feedEvents.on('profileUpdated', (author) => {
        setPosts((current) =>
          current.map((post) => (post.author.id === author.id ? { ...post, author } : post)),
        );
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [currentUserId]);

  // ── Like / save: optimistic, shared with every other list via `postUpdated` ──
  const toggle = useCallback(
    async (post: Post, optimistic: Post, request: (post: Post) => Promise<Post>) => {
      feedEvents.emitPostUpdated(optimistic);

      try {
        await request(post);
      } catch {
        feedEvents.emitPostUpdated(post);
        showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
      }
    },
    [],
  );

  const toggleLike = useCallback(
    (post: Post) =>
      toggle(
        post,
        {
          ...post,
          isLiked: !post.isLiked,
          likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
        },
        feedService.toggleLike,
      ),
    [toggle],
  );

  const toggleSave = useCallback(
    (post: Post) => toggle(post, { ...post, isSaved: !post.isSaved }, feedService.toggleSave),
    [toggle],
  );

  return {
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    loadFailed,
    loadMore,
    loadMoreFailed,
    posts,
    refresh,
    toggleLike,
    toggleSave,
  };
}
