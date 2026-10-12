import { StyleSheet, View } from 'react-native';

import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';

/**
 * Shown when the home feed has nothing: the feed only holds posts from the
 * viewer and the people they follow, so the way forward is to follow someone.
 */
export function FeedEmptyState({ onFindPeople }: { onFindPeople?: () => void }) {
  return (
    <View style={styles.container}>
      <ClayEmoji name="sparkles" size={68} />
      <ClayText variant="heading" style={styles.title}>
        Bảng tin của bạn đang trống
      </ClayText>
      <ClayText variant="body" style={styles.subtitle}>
        Bảng tin hiện bài viết của bạn và của những người bạn theo dõi. Hãy theo dõi vài người
        để bắt đầu.
      </ClayText>
      {onFindPeople ? (
        <ClayButton
          accessibilityLabel="Tìm người để theo dõi"
          onPress={onFindPeople}
          style={styles.button}
          title="Tìm người để theo dõi"
          variant="primary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  subtitle: {
    color: clayColors.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: clayColors.text,
    marginTop: 16,
    textAlign: 'center',
  },
});
