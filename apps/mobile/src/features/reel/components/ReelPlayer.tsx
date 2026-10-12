import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import type { PostMedia } from '../../feed/types';
import type { ReelViewStats } from '../types';

/** How long a load may take before the spinner shows (avoids a flash on fast networks). */
const SPINNER_DELAY_MS = 300;
/** A forward jump larger than this between two ticks is a seek, not playback. */
const MAX_TICK_SECONDS = 1;

type ReelPlayerProps = {
  /** The reel is the one on screen: it plays; every other reel stays paused. */
  isActive: boolean;
  isMuted: boolean;
  media: PostMedia;
  onDoubleTap?: () => void;
  /** Called when the reel stops being active, with what was watched. */
  onViewEnd?: (stats: ReelViewStats) => void;
};

/**
 * Full-bleed looping video for one reel. Tap toggles pause, double tap likes.
 * Measures real watch time (pauses and buffering excluded) for the view log.
 */
export const ReelPlayer = memo(function ReelPlayer({
  isActive,
  isMuted,
  media,
  onDoubleTap,
  onViewEnd,
}: ReelPlayerProps) {
  const player = useVideoPlayer(media.url, (instance) => {
    instance.loop = true;
    instance.muted = isMuted;
    instance.timeUpdateEventInterval = 0.25;
  });
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const statsRef = useRef({ lastTime: 0, loops: 0, watchMs: 0 });
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onViewEndRef = useRef(onViewEnd);
  onViewEndRef.current = onViewEnd;

  // ── Play only while active ────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      return;
    }

    statsRef.current = { lastTime: 0, loops: 0, watchMs: 0 };
    setIsUserPaused(false);
    player.currentTime = 0;
    player.play();

    return () => {
      const { loops, watchMs } = statsRef.current;

      // The player may already be released when the row unmounts.
      try {
        const durationMs = Math.round((player.duration || 0) * 1000);

        player.pause();
        onViewEndRef.current?.({ durationMs, loops, watchMs: Math.round(watchMs) });
      } catch {
        onViewEndRef.current?.({ durationMs: 0, loops, watchMs: Math.round(watchMs) });
      }
    };
  }, [isActive, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // ── Watch time and progress ───────────────────────────────────────────
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const stats = statsRef.current;
    const delta = currentTime - stats.lastTime;

    if (delta > 0 && delta <= MAX_TICK_SECONDS) {
      stats.watchMs += delta * 1000;
    } else if (delta < -MAX_TICK_SECONDS) {
      // Time went back to the start: the video looped.
      stats.loops += 1;
    }

    stats.lastTime = currentTime;
    setProgress(player.duration > 0 ? Math.min(1, currentTime / player.duration) : 0);
  });

  // ── Loading and errors ────────────────────────────────────────────────
  useEventListener(player, 'statusChange', ({ status }) => {
    setHasError(status === 'error');

    if (status !== 'loading') {
      setShowSpinner(false);
    }
  });

  const isWaiting = isActive && !hasFirstFrame && !hasError;

  useEffect(() => {
    if (!isWaiting) {
      setShowSpinner(false);
      return;
    }

    const timer = setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isWaiting]);

  useEffect(
    () => () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    },
    [],
  );

  // ── Gestures ──────────────────────────────────────────────────────────
  const handlePress = () => {
    const now = Date.now();

    if (now - lastTapRef.current < 280) {
      // Second tap: it is a like, so cancel the pending pause toggle.
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      lastTapRef.current = 0;
      onDoubleTap?.();
      return;
    }

    lastTapRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      setIsUserPaused((paused) => {
        if (paused) {
          player.play();
        } else {
          player.pause();
        }

        return !paused;
      });
    }, 280);
  };

  const handleRetry = () => {
    setHasError(false);
    setHasFirstFrame(false);
    player.replace(media.url);
    player.play();
  };

  // A landscape video would lose most of its picture if it filled a tall screen.
  const contentFit =
    media.width && media.height && media.width > media.height ? 'contain' : 'cover';

  return (
    <View style={styles.container}>
      <VideoView
        contentFit={contentFit}
        nativeControls={false}
        onFirstFrameRender={() => setHasFirstFrame(true)}
        player={player}
        style={StyleSheet.absoluteFill}
      />

      {/* Poster until the first frame is drawn, so the reel is never a black box. */}
      {!hasFirstFrame && media.thumbnailUrl ? (
        <Image
          contentFit={contentFit}
          source={{ uri: media.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <Pressable
        accessibilityLabel={isUserPaused ? 'Phát video' : 'Tạm dừng video'}
        accessibilityRole="button"
        onPress={handlePress}
        style={styles.touchLayer}
      >
        {hasError ? (
          <View style={styles.center}>
            <ClayText style={styles.overlayText} variant="body">
              Không phát được video
            </ClayText>
            <ClayButton
              accessibilityLabel="Thử phát lại video"
              onPress={handleRetry}
              size="sm"
              title="Thử lại"
              variant="secondary"
            />
          </View>
        ) : showSpinner ? (
          <ActivityIndicator color={clayColors.onPrimary} size="large" />
        ) : isUserPaused ? (
          <View style={styles.pauseBadge}>
            <ClayIcon color={clayColors.onPrimary} name="Play" size={40} weight="fill" />
          </View>
        ) : null}
      </Pressable>

      <View pointerEvents="none" style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 12,
  },
  container: {
    backgroundColor: clayColors.text,
    flex: 1,
    overflow: 'hidden',
  },
  overlayText: {
    color: clayColors.onPrimary,
  },
  pauseBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  progressFill: {
    backgroundColor: clayColors.onPrimary,
    height: 2,
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    bottom: 0,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  touchLayer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
