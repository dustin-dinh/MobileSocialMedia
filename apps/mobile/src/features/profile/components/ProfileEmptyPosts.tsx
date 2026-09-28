import { Pressable, StyleSheet, Text, View } from 'react-native';

import { profileColors, profileRadii } from '../profileTheme';

type ProfileEmptyPostsProps = {
  onCreatePost: () => void;
};

export function ProfileEmptyPosts({ onCreatePost }: ProfileEmptyPostsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✍️</Text>
      <Text style={styles.title}>No posts yet</Text>
      <Text style={styles.subtitle}>
        Share your first thought with the community!
      </Text>
      <Pressable
        onPress={onCreatePost}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Create your first post</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: profileColors.primary,
    borderRadius: profileRadii.button,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonPressed: {
    backgroundColor: profileColors.primaryPressed,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  subtitle: {
    color: profileColors.caption,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    color: profileColors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
