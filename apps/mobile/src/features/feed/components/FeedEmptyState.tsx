import { StyleSheet, View } from 'react-native';

import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';

/**
 * Shown when the home feed has nothing: the feed only holds posts from the
 * viewer and the people they follow, so the way forward is to follow someone.
 */
export function FeedEmptyState({ onFindPeople }: { onFindPeople?: () => void }) {
  return (
    <View style={styles.container}>
      <ClayText variant="heading">Chưa có bài viết nào</ClayText>
      <ClayText variant="body" style={styles.subtitle}>
        Bảng tin hiện bài viết của bạn và của những người bạn theo dõi.
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
    alignSelf: 'flex-start',
    marginTop: claySpacing.base,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: clayColors.surface,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.xl,
  },
  subtitle: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.xs,
  },
});
