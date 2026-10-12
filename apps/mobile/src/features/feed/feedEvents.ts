/**
 * Lightweight event bus for cross-feature communication.
 *
 * Used primarily so the CreateScreen can tell HomeScreen to prepend a newly
 * created post without tight coupling between the two features.
 *
 * Usage:
 *   // Emitter side
 *   feedEvents.emit('postCreated', newPost);
 *
 *   // Listener side (in useEffect)
 *   const unsub = feedEvents.on('postCreated', (post) => { … });
 *   return unsub;
 */
import type { Post, PostAuthor } from './types';

type FeedEventMap = {
  /** Fired whenever a post's comment total changes (added or deleted). */
  commentAdded: { commentsCount: number; postId: string };
  followChanged: { isFollowing: boolean; userId: string };
  postCreated: Post;
  postDeleted: { postId: string };
  /** The viewer hid the post, or blocked its author (`authorId`). */
  postHidden: { authorId?: string; postId?: string };
  postUpdated: Post;
  profileUpdated: PostAuthor;
};

type Listener<T> = (payload: T) => void;

type Unsubscribe = () => void;

const listeners = new Map<keyof FeedEventMap, Set<Listener<never>>>();

function on<K extends keyof FeedEventMap>(
  event: K,
  listener: Listener<FeedEventMap[K]>,
): Unsubscribe {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  const set = listeners.get(event)!;

  set.add(listener as Listener<never>);

  return () => {
    set.delete(listener as Listener<never>);
  };
}

function emit<K extends keyof FeedEventMap>(event: K, payload: FeedEventMap[K]): void {
  const set = listeners.get(event);

  if (!set) {
    return;
  }

  for (const listener of set) {
    try {
      (listener as Listener<FeedEventMap[K]>)(payload);
    } catch (error) {
      console.error(`[feedEvents] Listener error on "${event}":`, error);
    }
  }
}

export const feedEvents = {
  emit,
  emitCommentAdded: (postId: string, commentsCount: number) =>
    emit('commentAdded', { commentsCount, postId }),
  emitPostCreated: (post: Post) => emit('postCreated', post),
  emitFollowChanged: (userId: string, isFollowing: boolean) =>
    emit('followChanged', { isFollowing, userId }),
  emitPostDeleted: (postId: string) => emit('postDeleted', { postId }),
  emitPostHidden: (payload: { authorId?: string; postId?: string }) =>
    emit('postHidden', payload),
  emitProfileUpdated: (author: PostAuthor) => emit('profileUpdated', author),
  emitPostUpdated: (post: Post) => emit('postUpdated', post),
  on,
} as const;

