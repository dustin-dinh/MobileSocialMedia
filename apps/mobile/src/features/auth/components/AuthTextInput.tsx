import { type RefObject, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { authColors, authRadii } from '../authTheme';

type AuthTextInputProps = TextInputProps & {
  error?: string;
  inputRef?: RefObject<TextInput | null>;
  label: string;
  password?: boolean;
};

export function AuthTextInput({
  accessibilityLabel,
  error,
  inputRef,
  label,
  onBlur,
  onFocus,
  password = false,
  style,
  ...inputProps
}: AuthTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isInvalid = Boolean(error);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          isFocused ? styles.inputShellFocused : undefined,
          isInvalid ? styles.inputShellInvalid : undefined,
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={authColors.mutedText}
          ref={inputRef}
          secureTextEntry={password ? !isPasswordVisible : inputProps.secureTextEntry}
          style={[styles.input, password ? styles.passwordInput : undefined, style]}
        />
        {password ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={styles.visibilityAction}
          >
            <Text style={styles.visibilityActionText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  errorText: {
    color: authColors.error,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  input: {
    color: authColors.inputText,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: authColors.inputBackground,
    borderColor: authColors.border,
    borderRadius: authRadii.control,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
  },
  inputShellFocused: {
    borderColor: authColors.primary,
    borderWidth: 2,
  },
  inputShellInvalid: {
    borderColor: authColors.error,
  },
  label: {
    color: authColors.title,
    fontSize: 14,
    fontWeight: '700',
  },
  passwordInput: {
    paddingRight: 4,
  },
  visibilityAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  visibilityActionText: {
    color: authColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
