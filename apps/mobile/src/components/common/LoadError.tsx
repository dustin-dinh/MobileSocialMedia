import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../theme/colors';
import { claySpacing } from '../../theme/spacing';
import { ClayButton } from '../ui/ClayButton';
import { ClayText } from '../ui/ClayText';

type LoadErrorProps = {
  message?: string;
  onRetry?: () => void;
  title?: string;
};

/** Full-area error state for a screen whose first load failed, or whose target is gone. */
export function LoadError({
  message = 'Kiểm tra kết nối mạng rồi thử lại.',
  onRetry,
  title = 'Không tải được nội dung',
}: LoadErrorProps) {
  return (
    <View style={styles.container}>
      <ClayText style={styles.title} variant="heading">
        {title}
      </ClayText>
      <ClayText style={styles.message} variant="body">
        {message}
      </ClayText>
      {onRetry ? (
        <ClayButton
          accessibilityLabel="Thử tải lại"
          onPress={onRetry}
          size="sm"
          style={styles.button}
          title="Thử lại"
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: claySpacing.base,
  },
  // The error sits where the content would have started, on the page margin.
  container: {
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: claySpacing.base,
    paddingTop: claySpacing.xl,
  },
  message: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.xs,
  },
  title: {
    color: clayColors.text,
  },
});
