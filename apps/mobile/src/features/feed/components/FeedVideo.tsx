import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayRadii } from '../../../theme/spacing';
import type { PostMedia } from '../types';

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);

  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

/**
 * A video inside a post card: a poster with a play badge and no player, so a
 * long feed holds no video decoders. Tapping it opens the full-screen reel
 * viewer on this video (`onPress`).
 */
export function FeedVideo({ media, onPress }: { media: PostMedia; onPress?: () => void }) {
  return (
    <View style={styles.container}>
        <Pressable
          accessibilityLabel="Phát video"
          accessibilityRole="button"
          onPress={onPress}
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
    borderRadius: clayRadii.media,
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
