import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii } from '../../../theme/spacing';

const SKELETON_ITEMS = [1, 2, 3, 4, 5];

/** The final row layout with flat grey blocks in place of the data; nothing moves. */
export function SearchSkeleton() {
  return (
    <View accessibilityLabel="Đang tải" accessibilityRole="progressbar">
      {SKELETON_ITEMS.map((item) => (
        <View key={item} style={styles.row}>
          <View style={styles.avatar} />
          <View style={styles.info}>
            <View style={styles.titleLine} />
            <View style={styles.subtitleLine} />
          </View>
          <View style={styles.button} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.avatar,
    height: 40,
    width: 40,
  },
  button: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    height: 36,
    width: 96,
  },
  info: {
    flex: 1,
    gap: 6,
    marginHorizontal: 12,
  },
  row: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: clayDimensions.gutter,
  },
  subtitleLine: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 4,
    height: 13,
    width: '45%',
  },
  titleLine: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 4,
    height: 15,
    width: '65%',
  },
});
