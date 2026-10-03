import { type RefObject, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View, ViewStyle, Platform } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import { getClayBoxShadow } from '../../../theme/clay';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';

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
      <ClayText variant="caption" style={styles.label}>
        {label}
      </ClayText>
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
          placeholderTextColor={clayColors.caption}
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
            <ClayIcon
              name={isPasswordVisible ? 'EyeClosed' : 'Eye'}
              size={20}
              weight="duotone"
              color={clayColors.primary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ClayText accessibilityLiveRegion="polite" variant="caption" style={styles.errorText}>
          {error}
        </ClayText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  errorText: {
    color: clayColors.error,
    marginTop: 6,
  },
  input: {
    color: clayColors.text,
    flex: 1,
    fontSize: 15,
    minHeight: clayDimensions.minTouchTarget + 6,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    borderWidth: 1.5,
    borderTopColor: clayColors.border,
    borderLeftColor: clayColors.border,
    borderRightColor: clayColors.shadowLight,
    borderBottomColor: clayColors.shadowLight,
    flexDirection: 'row',
    marginTop: 6,
    minHeight: clayDimensions.minTouchTarget + 6,
    boxShadow: getClayBoxShadow('inset'),
  } as ViewStyle,
  inputShellFocused: {
    borderTopColor: clayColors.primary,
    borderLeftColor: clayColors.primary,
    borderRightColor: clayColors.primarySoft,
    borderBottomColor: clayColors.primarySoft,
  },
  inputShellInvalid: {
    borderTopColor: clayColors.error,
    borderLeftColor: clayColors.error,
    borderRightColor: clayColors.errorBg,
    borderBottomColor: clayColors.errorBg,
  },
  label: {
    color: clayColors.text,
  },
  passwordInput: {
    paddingRight: 4,
  },
  visibilityAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    paddingHorizontal: 10,
  },
});
