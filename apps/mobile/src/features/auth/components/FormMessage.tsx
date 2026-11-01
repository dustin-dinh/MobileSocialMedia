import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { clayRadii } from '../../../theme/spacing';
import { ClayText } from '../../../components/ui/ClayText';

type FormMessageProps = {
  message: string | null;
  tone?: 'error' | 'info';
};

export function FormMessage({ message, tone = 'info' }: FormMessageProps) {
  if (!message) {
    return null;
  }

  const isError = tone === 'error';

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, isError ? styles.errorContainer : styles.infoContainer]}
    >
      <ClayText
        variant="caption"
        style={isError ? styles.errorMessage : styles.infoMessage}
      >
        {message}
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pale status pairs: tint ground, dark ink of the same hue, no edge.
  container: {
    borderRadius: clayRadii.control,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorContainer: {
    backgroundColor: clayColors.errorBg,
  },
  errorMessage: {
    color: clayColors.errorInk,
  },
  infoContainer: {
    backgroundColor: clayColors.primarySoft,
  },
  infoMessage: {
    color: clayColors.primaryInk,
  },
});
