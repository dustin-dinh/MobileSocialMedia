import { StyleSheet, Text, View } from 'react-native';

import { authColors, authRadii } from '../authTheme';

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
      <Text style={[styles.message, isError ? styles.errorMessage : styles.infoMessage]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: authRadii.control,
    marginBottom: 16,
    padding: 12,
  },
  errorContainer: {
    backgroundColor: authColors.errorBackground,
  },
  errorMessage: {
    color: authColors.error,
  },
  infoContainer: {
    backgroundColor: authColors.noticeBackground,
  },
  infoMessage: {
    color: authColors.noticeText,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
});
