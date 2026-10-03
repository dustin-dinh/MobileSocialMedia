import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { clayColors } from '../../theme/colors';
import { clayRadii, clayDimensions } from '../../theme/spacing';
import { ClayText } from './ClayText';
import { getClayBoxShadow } from '../../theme/clay';

export type ClayInputProps = TextInputProps & {
  label?: string;
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function ClayInput({
  label,
  error,
  inputRef,
  leftIcon,
  rightAction,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: ClayInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isInvalid = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <ClayText variant="caption" style={styles.label}>
          {label}
        </ClayText>
      ) : null}

      <View
        style={[
          styles.inputShell,
          isFocused && styles.inputShellFocused,
          isInvalid && styles.inputShellInvalid,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={clayColors.caption}
          ref={inputRef}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...props}
        />

        {rightAction ? <View style={styles.rightActionWrapper}>{rightAction}</View> : null}
      </View>

      {error ? (
        <ClayText variant="caption" style={styles.errorText} accessibilityLiveRegion="polite">
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
  label: {
    marginBottom: 8,
    color: clayColors.text,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    borderWidth: 1.5,
    borderTopColor: clayColors.border,
    borderLeftColor: clayColors.border,
    borderRightColor: clayColors.shadowLight,
    borderBottomColor: clayColors.shadowLight,
    paddingHorizontal: 14,
    minHeight: clayDimensions.minTouchTarget + 6,
    // Modern BoxShadow for inset
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
  input: {
    flex: 1,
    color: clayColors.text,
    fontSize: 15,
    minHeight: clayDimensions.minTouchTarget,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  leftIconWrapper: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionWrapper: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: clayColors.error,
    marginTop: 6,
  },
});
