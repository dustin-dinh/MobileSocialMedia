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
import type { Post } from './types';

type FeedEventMap = {
  commentAdded: { commentsCount: number; postId: string };
  postCreated: Post;
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

export const feedEvents = { emit, on } as const;
