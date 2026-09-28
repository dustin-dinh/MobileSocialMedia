import { Pressable, StyleSheet, Text, View } from 'react-native';

import { searchColors, searchRadii } from '../searchTheme';

type SearchEmptyStateProps = {
  onClear?: () => void;
  query: string;
};

export function SearchEmptyState({ onClear, query }: SearchEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>🔍</Text>
      </View>

      <Text style={styles.title}>Không tìm thấy người dùng phù hợp</Text>
      <Text style={styles.description}>
        Không có kết quả nào cho &quot;{query}&quot;. Vui lòng thử tìm kiếm bằng username hoặc tên hiển thị khác.
      </Text>

      {onClear ? (
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearButtonPressed,
          ]}
        >
          <Text style={styles.clearButtonText}>Xóa tìm kiếm</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: '#EEF2F6',
    borderRadius: searchRadii.button,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearButtonPressed: {
    backgroundColor: '#E2E8F0',
  },
  clearButtonText: {
    color: searchColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  description: {
    color: searchColors.caption,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  iconEmoji: {
    fontSize: 34,
  },
  title: {
    color: searchColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
