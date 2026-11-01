import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { clayRadii } from '../../../theme/spacing';
import { ClayText } from '../../../components/ui/ClayText';

type AuthBrandProps = {
  /** 1 where the product name is the screen's title (Splash). */
  level?: 1;
};

/** The product's lockup: the raspberry "MS" mark beside the name. */
export function AuthBrand({ level }: AuthBrandProps) {
  return (
    <View style={styles.container}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.mark}>
        <ClayText style={styles.markText} variant="caption" weight="bold">
          MS
        </ClayText>
      </View>
      <ClayText level={level} variant="heading">
        Mobile Social
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: clayColors.primary,
    borderRadius: clayRadii.control,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  markText: {
    color: clayColors.onPrimary,
  },
});
