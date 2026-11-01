import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { clayColors } from '../../theme/colors';
import { clayRadii, clayDimensions } from '../../theme/spacing';
import { ClayText } from './ClayText';

/**
 * primary: the brand hue, one per screen. tonal: the hue's pale tint with its
 * dark ink, for an action repeated down a list (Follow). secondary: white with
 * a 1px edge. ghost: text only. destructive: the pale negative pair.
 */
export type ClayButtonVariant = 'primary' | 'tonal' | 'secondary' | 'ghost' | 'destructive' | 'pill';

export type ClayButtonProps = {
  accessibilityLabel: string;
  variant?: ClayButtonVariant;
  label?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export function ClayButton({
  accessibilityLabel,
  variant = 'primary',
  label,
  title,
  size = 'md',
  icon,
  isLoading = false,
  loading = false,
  disabled = false,
  onPress,
  style,
  labelStyle,
  children,
}: ClayButtonProps) {
  // Plain-text children are a label too: raw strings cannot render outside a Text.
  const textChild = typeof children === 'string' ? children : undefined;
  const buttonText = label || title || textChild;
  const isButtonLoading = isLoading || loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || isButtonLoading;

  const handlePressIn = () => {
    if (isDisabled) return;
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ busy: isButtonLoading, disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.base,
          size === 'sm' && styles.sizeSm,
          size === 'lg' && styles.sizeLg,
          variant === 'primary' && styles.primary,
          variant === 'tonal' && styles.tonal,
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          variant === 'destructive' && styles.destructive,
          variant === 'pill' && styles.pill,
          pressed && !isDisabled && (
            variant === 'primary' ? styles.primaryPressed :
            variant === 'tonal' ? styles.tonalPressed :
            variant === 'secondary' ? styles.secondaryPressed :
            variant === 'destructive' ? styles.destructivePressed :
            styles.ghostPressed
          ),
          // Disabled stays legible: a grey well with caption text, never faded brand colour.
          isDisabled && !isButtonLoading && (variant === 'ghost' ? null : styles.disabled),
          style,
        ]}
      >
        {isButtonLoading ? (
          <ActivityIndicator
            color={
              variant === 'primary' ? clayColors.onPrimary :
              variant === 'destructive' ? clayColors.error :
              clayColors.primary
            }
            size="small"
          />
        ) : (
          <>
            {icon}
            {buttonText ? (
              <ClayText
                variant="button"
                style={[
                  styles.labelBase,
                  variant === 'primary' && styles.primaryLabel,
                  variant === 'tonal' && styles.tonalLabel,
                  variant === 'secondary' && styles.secondaryLabel,
                  variant === 'ghost' && styles.ghostLabel,
                  variant === 'destructive' && styles.destructiveLabel,
                  variant === 'pill' && styles.pillLabel,
                  isDisabled && !isButtonLoading && styles.disabledLabel,
                  labelStyle,
                ]}
              >
                {buttonText}
              </ClayText>
            ) : null}
            {textChild === undefined ? children : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    borderRadius: clayRadii.control,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
  },
  sizeSm: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: clayColors.primary,
  },
  primaryPressed: {
    backgroundColor: clayColors.primaryPressed,
  },
  tonal: {
    backgroundColor: clayColors.primarySoft,
  },
  tonalPressed: {
    backgroundColor: clayColors.primaryTrack,
  },
  secondary: {
    backgroundColor: clayColors.surfaceHigh,
    borderColor: clayColors.control,
    borderWidth: 1,
  },
  secondaryPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  destructive: {
    backgroundColor: clayColors.errorBg,
  },
  destructivePressed: {
    backgroundColor: clayColors.errorBg,
    opacity: 0.8,
  },
  pill: {
    backgroundColor: clayColors.surfaceHigh,
    borderColor: clayColors.control,
    borderRadius: clayRadii.pill,
    borderWidth: 1,
  },
  disabled: {
    backgroundColor: clayColors.surfaceWell,
    borderColor: clayColors.surfaceWell,
  },
  disabledLabel: {
    color: clayColors.caption,
  },
  labelBase: {},
  primaryLabel: {
    color: clayColors.onPrimary,
  },
  tonalLabel: {
    color: clayColors.primaryInk,
  },
  secondaryLabel: {
    color: clayColors.text,
  },
  ghostLabel: {
    color: clayColors.primary,
  },
  destructiveLabel: {
    color: clayColors.errorInk,
  },
  pillLabel: {
    color: clayColors.text,
  },
});
