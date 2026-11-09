import { Pressable, StyleSheet } from 'react-native';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';

/**
 * Covers a blurred sensitive image until the viewer taps it. Same mark as a
 * sensitive chat image (ChatScreen): neutral dark scrim, eye-off icon, one line.
 * Place it inside the image's container; it fills it.
 */
export function SensitiveCover({ onReveal }: { onReveal: () => void }) {
  return (
    <Pressable
      accessibilityHint="Ảnh có thể chứa nội dung nhạy cảm"
      accessibilityLabel="Xem ảnh"
      accessibilityRole="button"
      onPress={onReveal}
      style={styles.cover}
    >
      <ClayIcon color={clayColors.onPrimary} name="EyeSlash" size={22} />
      <ClayText style={styles.text} variant="caption">
        Ảnh nhạy cảm · Chạm để xem
      </ClayText>
    </Pressable>
  );
}

/** Same strength on Android, iOS and web; the picture underneath is not recognisable. */
export const SENSITIVE_BLUR_RADIUS = 60;

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.55)',
    bottom: 0,
    gap: claySpacing.sm,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: claySpacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  text: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
  },
});
