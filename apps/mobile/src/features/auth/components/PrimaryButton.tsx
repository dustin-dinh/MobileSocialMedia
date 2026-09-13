import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { authColors, authRadii } from '../authTheme';

type PrimaryButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
};

export function PrimaryButton({
  accessibilityLabel,
  disabled = false,
  isLoading = false,
  label,
  onPress,
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled ? styles.buttonPressed : undefined,
        isDisabled ? styles.buttonDisabled : undefined,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={authColors.primaryText} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: authColors.primary,
    borderRadius: authRadii.control,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    backgroundColor: authColors.primaryPressed,
  },
  label: {
    color: authColors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
});
