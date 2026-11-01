import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { clayColors } from '../../theme/colors';
import { claySpacing } from '../../theme/spacing';
import { ClayButton } from '../ui/ClayButton';
import { ClayText } from '../ui/ClayText';

type ListFooterProps = {
  /** Shown once every page has been loaded. Omit to show nothing at the end. */
  endMessage?: string;
  hasItems: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreFailed: boolean;
  onRetry: () => void;
};

/** Footer of a paginated list: spinner, retry after a failed page, or the end note. */
export function ListFooter({
  endMessage,
  hasItems,
  hasMore,
  isLoadingMore,
  loadMoreFailed,
  onRetry,
}: ListFooterProps) {
  if (!hasItems) {
    return null;
  }

  if (loadMoreFailed) {
    return (
      <View style={styles.container}>
        <ClayText style={styles.text} variant="caption">
          Không tải thêm được. Kiểm tra kết nối rồi thử lại.
        </ClayText>
        <ClayButton
          accessibilityLabel="Thử tải thêm lần nữa"
          onPress={onRetry}
          size="sm"
          title="Thử lại"
          variant="secondary"
        />
      </View>
    );
  }

  if (isLoadingMore) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={clayColors.primary} />
      </View>
    );
  }

  if (!hasMore && endMessage) {
    return (
      <View style={styles.container}>
        <ClayText style={styles.text} variant="caption">
          {endMessage}
        </ClayText>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: claySpacing.sm,
    paddingHorizontal: claySpacing.xl,
    paddingVertical: claySpacing.xl,
  },
  text: {
    color: clayColors.caption,
    textAlign: 'center',
  },
});
