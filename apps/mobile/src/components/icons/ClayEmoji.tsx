import React from 'react';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';

export type ClayEmojiName =
  | 'sparkles'
  | 'magnifying_glass'
  | 'magnifyingGlass'
  | 'bell'
  | 'memo'
  | 'camera'
  | 'red_heart'
  | 'heart'
  | 'speech_balloon'
  | 'speechBalloon'
  | 'bust_in_silhouette'
  | 'user';

const EMOJI_MAP: Record<string, ReturnType<typeof require>> = {
  sparkles: require('../../assets/emoji/sparkles_3d.png'),
  magnifying_glass: require('../../assets/emoji/magnifying_glass_3d.png'),
  magnifyingGlass: require('../../assets/emoji/magnifying_glass_3d.png'),
  bell: require('../../assets/emoji/bell_3d.png'),
  memo: require('../../assets/emoji/memo_3d.png'),
  camera: require('../../assets/emoji/camera_3d.png'),
  red_heart: require('../../assets/emoji/red_heart_3d.png'),
  heart: require('../../assets/emoji/red_heart_3d.png'),
  speech_balloon: require('../../assets/emoji/speech_balloon_3d.png'),
  speechBalloon: require('../../assets/emoji/speech_balloon_3d.png'),
  bust_in_silhouette: require('../../assets/emoji/bust_in_silhouette_3d.png'),
  user: require('../../assets/emoji/bust_in_silhouette_3d.png'),
};

export type ClayEmojiProps = {
  name: ClayEmojiName | string;
  size?: number;
  style?: ImageStyle;
};

export function ClayEmoji({ name, size = 48, style }: ClayEmojiProps) {
  const source = EMOJI_MAP[name] ?? EMOJI_MAP.sparkles;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={source}
        style={[{ width: size, height: size }, style]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
