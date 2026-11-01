import { StyleSheet, View } from 'react-native';

import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { profileColors } from '../profileTheme';

type ProfileEmptyPostsProps = {
  onCreatePost: () => void;
};

/** Own profile with no posts yet: one sentence and the one action that fills the list. */
export function ProfileEmptyPosts({ onCreatePost }: ProfileEmptyPostsProps) {
  return (
    <View style={styles.container}>
      <ClayText style={styles.text} variant="body">
        Bạn chưa đăng bài nào. Bài viết đầu tiên sẽ hiện ở đây.
      </ClayText>
      <ClayButton
        accessibilityLabel="Tạo bài viết đầu tiên của bạn"
        onPress={onCreatePost}
        style={styles.button}
        title="Viết bài đầu tiên"
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    marginTop: claySpacing.base,
  },
  container: {
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.xxl,
  },
  text: {
    color: profileColors.textSecondary,
  },
});
