import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { clayColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { ClayText } from '../ui/ClayText';

type UserAvatarProps = {
  avatarUrl: string | null;
  /** Used for the initials shown when there is no picture. */
  name: string;
  size?: number;
};

/** Round avatar with initials fallback, for lists outside the post card. */
export const UserAvatar = memo(function UserAvatar({ avatarUrl, name, size = 44 }: UserAvatarProps) {
  const shape = { borderRadius: size / 2, height: size, width: size };
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: avatarUrl }}
        style={[styles.image, shape]}
      />
    );
  }

  return (
    <View style={[styles.fallback, shape]}>
      <ClayText style={[styles.initials, { fontSize: size * 0.36 }]} variant="caption">
        {initials}
      </ClayText>
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  image: {
    backgroundColor: clayColors.surfaceWell,
  },
  initials: {
    color: clayColors.primary,
    fontFamily: fontFamilies.bold,
  },
});
