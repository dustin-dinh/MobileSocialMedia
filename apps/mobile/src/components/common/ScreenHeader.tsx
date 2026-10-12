import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clayColors } from '../../theme/colors';
import { clayDimensions, claySpacing } from '../../theme/spacing';
import { ClayIcon } from '../icons/ClayIcon';
import { ClayText } from '../ui/ClayText';

type ScreenHeaderProps = {
  onBack?: () => void;
  /** Optional control on the right edge (e.g. a "more" button). */
  right?: ReactNode;
  title: string;
};

/** Top bar for screens pushed on top of the tabs: back button, title, optional action. */
export function ScreenHeader({ onBack, right, title }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + claySpacing.sm }]}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={styles.side}
        >
          <ClayIcon color={clayColors.text} name="CaretLeft" size={22} weight="bold" />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <ClayText numberOfLines={1} style={styles.title} variant="heading">
        {title}
      </ClayText>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: clayColors.canvas,
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: claySpacing.sm,
    paddingHorizontal: claySpacing.sm,
  },
  side: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  title: {
    color: clayColors.text,
    flex: 1,
    textAlign: 'center',
  },
});
