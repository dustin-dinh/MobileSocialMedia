import { StyleSheet, View } from 'react-native';

import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayText } from '../../../components/ui/ClayText';
import { searchColors } from '../searchTheme';

type SearchEmptyStateProps = {
  onClear?: () => void;
  query: string;
};

export function SearchEmptyState({ onClear, query }: SearchEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <ClayEmoji name="magnifying_glass" size={54} />
      </View>

      <ClayText variant="heading" style={styles.title}>
        Không tìm thấy người dùng phù hợp
      </ClayText>
      <ClayText variant="body" style={styles.description}>
        Không có kết quả nào cho &quot;{query}&quot;. Vui lòng thử tìm kiếm bằng username hoặc tên hiển thị khác.
      </ClayText>

      {onClear ? (
        <ClayButton
          accessibilityLabel="Xóa tìm kiếm"
          onPress={onClear}
          title="Xóa tìm kiếm"
          variant="secondary"
          size="sm"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  description: {
    color: searchColors.caption,
    marginBottom: 24,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: searchColors.surfaceWell,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    marginBottom: 20,
    width: 88,
  },
  title: {
    color: searchColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
});

