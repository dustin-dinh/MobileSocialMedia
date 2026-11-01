import { StyleSheet, View } from 'react-native';

import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { searchColors } from '../searchTheme';

type SearchEmptyStateProps = {
  onClear?: () => void;
  query: string;
};

/** Nothing typed, or nothing found: one sentence and, after a search, one way out. */
export function SearchEmptyState({ onClear, query }: SearchEmptyStateProps) {
  if (!query.trim()) {
    return (
      <View style={styles.container}>
        <ClayText style={styles.text} variant="body">
          Nhập tên, @username hoặc #hashtag để tìm.
        </ClayText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ClayText style={styles.text} variant="body">
        Không có kết quả cho &quot;{query}&quot;. Thử một từ khoá khác.
      </ClayText>
      {onClear ? (
        <ClayButton
          accessibilityLabel="Xóa tìm kiếm"
          onPress={onClear}
          style={styles.button}
          title="Xóa tìm kiếm"
          variant="secondary"
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
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.xl,
  },
  text: {
    color: searchColors.textSecondary,
  },
});
