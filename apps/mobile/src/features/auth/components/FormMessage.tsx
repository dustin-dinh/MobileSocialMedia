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
        style={[styles.message, isError ? styles.errorMessage : styles.infoMessage]}
      >
        {message}
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: clayRadii.control,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  errorContainer: {
    backgroundColor: clayColors.errorBg,
    borderColor: clayColors.error,
  },
  errorMessage: {
    color: clayColors.error,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: clayColors.primarySoft,
    borderColor: clayColors.primary,
  },
  infoMessage: {
    color: clayColors.primary,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
