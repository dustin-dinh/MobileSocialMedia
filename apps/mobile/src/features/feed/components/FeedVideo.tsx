import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { feedRadii } from '../feedTheme';
import type { PostMedia } from '../types';

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);

  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function InlinePlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.play();
  });

  return <VideoView contentFit="contain" nativeControls player={player} style={styles.fill} />;
}

/**
 * A video inside a post card. The feed never auto-plays: it shows a poster
 * with a play badge, and the player is only created once the poster is tapped,
 * so a long feed does not hold one decoder per video.
 */
export function FeedVideo({ media }: { media: PostMedia }) {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <View style={styles.container}>
      {isStarted ? (
        <InlinePlayer url={media.url} />
      ) : (
        <Pressable
          accessibilityLabel="Phát video"
          accessibilityRole="button"
          onPress={() => setIsStarted(true)}
          style={styles.fill}
        >
          {media.thumbnailUrl ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: media.thumbnailUrl }}
              style={styles.fill}
            />
          ) : null}
          <View style={styles.badgeLayer}>
            <View style={styles.playBadge}>
              <ClayIcon color={clayColors.onPrimary} name="Play" size={28} weight="fill" />
            </View>
          </View>
          {media.durationMs ? (
            <View style={styles.duration}>
              <ClayText style={styles.durationText} variant="meta">
                {formatDuration(media.durationMs)}
              </ClayText>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeLayer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    aspectRatio: 4 / 5,
    backgroundColor: clayColors.text,
    borderRadius: feedRadii.media,
    overflow: 'hidden',
    width: '100%',
  },
  duration: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    position: 'absolute',
    right: 10,
  },
  durationText: {
    color: clayColors.onPrimary,
  },
  fill: {
    flex: 1,
  },
  playBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
});
