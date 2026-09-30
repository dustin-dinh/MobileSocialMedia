import { StyleSheet, View } from 'react-native';

import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayText } from '../../../components/ui/ClayText';
import { profileColors } from '../profileTheme';

type ProfileEmptyPostsProps = {
  onCreatePost: () => void;
};

export function ProfileEmptyPosts({ onCreatePost }: ProfileEmptyPostsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.emojiWrap}>
        <ClayEmoji name="memo" size={56} />
      </View>
      <ClayText variant="heading" style={styles.title}>
        Chưa có bài viết nào
      </ClayText>
      <ClayText variant="body" style={styles.subtitle}>
        Hãy chia sẻ suy nghĩ và khoảnh khắc đầu tiên của bạn cùng cộng đồng nhé!
      </ClayText>
      <ClayButton
        accessibilityLabel="Tạo bài viết đầu tiên của bạn"
        onPress={onCreatePost}
        size="md"
        style={styles.button}
        title="Tạo bài viết đầu tiên"
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emojiWrap: {
    alignItems: 'center',
    backgroundColor: profileColors.surfaceWell,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    marginBottom: 16,
    width: 88,
  },
  subtitle: {
    color: profileColors.caption,
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    color: profileColors.text,
    textAlign: 'center',
  },
});

