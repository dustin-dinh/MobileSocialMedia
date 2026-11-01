import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';

const SKELETON_ITEMS = [1, 2, 3, 4, 5, 6];

/** Loading: the rows' own layout as flat grey blocks, at the real row pitch. No shimmer. */
export function NotificationSkeleton() {
  return (
    <View accessibilityLabel="Đang tải thông báo">
      {SKELETON_ITEMS.map((item) => (
        <View key={item} style={styles.row}>
          <View style={styles.avatar} />
          <View style={styles.body}>
            <View style={styles.lines}>
              <View style={styles.line1} />
              <View style={styles.line2} />
            </View>
            <View style={styles.thumbnail} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 20,
    height: 40,
    marginTop: claySpacing.md,
    width: 40,
  },
  body: {
    alignItems: 'center',
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: claySpacing.md,
    // The rows' paddingRight plus their 8px unread-dot slot and its gap.
    paddingRight: clayDimensions.gutter + 8 + claySpacing.md,
    paddingVertical: claySpacing.md,
  },
  line1: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 4,
    height: 14,
    width: '85%',
  },
  line2: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 4,
    height: 12,
    marginTop: claySpacing.sm,
    width: '30%',
  },
  lines: {
    flex: 1,
  },
  row: {
    alignItems: 'flex-start',
    backgroundColor: clayColors.surface,
    flexDirection: 'row',
    gap: claySpacing.md,
    paddingLeft: clayDimensions.gutter,
  },
  thumbnail: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.media,
    height: 44,
    width: 44,
  },
});
