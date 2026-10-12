import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import type { Post } from '../../feed/types';
import { reelService } from '../services/reelService';
import type { ReelEvent, ReelEventType, ReelViewStats } from '../types';

const SKIP_THRESHOLD_MS = 2_000;
const COMPLETE_RATIO = 0.9;
const FLUSH_SIZE = 10;
const FLUSH_INTERVAL_MS = 10_000;
/** Cap on events kept while offline, so a long outage cannot grow memory without bound. */
const MAX_QUEUE = 200;

/**
 * Which log events one viewing of a reel produces. A view is always logged
 * (the recommender needs the reels people did not engage with too); on top of
 * it: SKIP when swiped away within 2s, COMPLETE when ≥ 90% was watched or the
 * video looped, REPLAY when it looped.
 */
export function summarizeView(stats: ReelViewStats): ReelEventType[] {
  const types: ReelEventType[] = ['VIEW'];
  const watchedAll =
    stats.loops > 0 ||
    (stats.durationMs > 0 && stats.watchMs >= stats.durationMs * COMPLETE_RATIO);

  if (watchedAll) {
    types.push('COMPLETE');
  } else if (stats.watchMs < SKIP_THRESHOLD_MS) {
    types.push('SKIP');
  }

  if (stats.loops > 0) {
    types.push('REPLAY');
  }

  return types;
}

function newEventId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Collects reel view and interaction events and sends them in batches: when
 * 10 have piled up, every 10 seconds, and when the app goes to the background.
 * A failed batch stays queued and goes out with the next one.
 */
export function useReelViewTracker() {
  const queueRef = useRef<ReelEvent[]>([]);
  const isFlushingRef = useRef(false);

  const flush = useCallback(async () => {
    if (isFlushingRef.current || queueRef.current.length === 0) {
      return;
    }

    isFlushingRef.current = true;

    const batch = queueRef.current;

    queueRef.current = [];

    try {
      await reelService.sendInteractions(batch);
    } catch {
      // `eventId` lets the server drop duplicates if part of the batch did arrive.
      queueRef.current = [...batch, ...queueRef.current].slice(-MAX_QUEUE);
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        void flush();
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
      void flush();
    };
  }, [flush]);

  const track = useCallback(
    (
      eventType: ReelEventType,
      context: { position: number; post: Post; requestId: string },
      stats?: ReelViewStats,
    ) => {
      // Sample reels are not real content: nothing about them is logged.
      if (context.post.isSample) {
        return;
      }

      queueRef.current.push({
        createdAt: new Date().toISOString(),
        durationMs: stats?.durationMs ?? null,
        eventId: newEventId(),
        eventType,
        mediaId: context.post.media[0]?.id ?? null,
        position: context.position,
        postId: context.post.id,
        requestId: context.requestId,
        surface: 'reels',
        watchMs: stats?.watchMs ?? null,
      });

      if (queueRef.current.length >= FLUSH_SIZE) {
        void flush();
      }
    },
    [flush],
  );

  /** Call when a reel leaves the screen, with what the player measured. */
  const trackView = useCallback(
    (context: { position: number; post: Post; requestId: string }, stats: ReelViewStats) => {
      for (const eventType of summarizeView(stats)) {
        track(eventType, context, stats);
      }
    },
    [track],
  );

  return { track, trackView };
}
