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
import { getClayBoxShadow } from '../../theme/clay';

export type ClayButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'pill';

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
  const buttonText = label || title;
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
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          variant === 'destructive' && styles.destructive,
          variant === 'pill' && styles.pill,
          pressed && !isDisabled && (
            variant === 'primary' ? styles.primaryPressed :
            variant === 'secondary' ? styles.secondaryPressed :
            variant === 'destructive' ? styles.destructivePressed :
            styles.ghostPressed
          ),
          isDisabled && styles.disabled,
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
                  variant === 'secondary' && styles.secondaryLabel,
                  variant === 'ghost' && styles.ghostLabel,
                  variant === 'destructive' && styles.destructiveLabel,
                  variant === 'pill' && styles.pillLabel,
                  labelStyle,
                ]}
              >
                {buttonText}
              </ClayText>
            ) : null}
            {children}
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
    borderWidth: 1,
    borderTopColor: clayColors.primarySoft,
    borderLeftColor: clayColors.primarySoft,
    borderRightColor: clayColors.primaryPressed,
    borderBottomColor: clayColors.primaryPressed,
    shadowColor: 'rgb(168,36,89)',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
    // Modern BoxShadow
    boxShadow: getClayBoxShadow('raisedPrimary'),
  } as ViewStyle,
  primaryPressed: {
    backgroundColor: clayColors.primaryPressed,
    borderTopColor: clayColors.primaryPressed,
    borderLeftColor: clayColors.primaryPressed,
    borderRightColor: clayColors.primarySoft,
    borderBottomColor: clayColors.primarySoft,
    boxShadow: getClayBoxShadow('inset'),
  } as ViewStyle,
  secondary: {
    backgroundColor: clayColors.surface,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(150,84,96)',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
    boxShadow: getClayBoxShadow('raised'),
  } as ViewStyle,
  secondaryPressed: {
    backgroundColor: clayColors.surfaceWell,
    borderTopColor: clayColors.border,
    borderLeftColor: clayColors.border,
    borderRightColor: clayColors.shadowLight,
    borderBottomColor: clayColors.shadowLight,
    boxShadow: getClayBoxShadow('inset'),
  } as ViewStyle,
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  destructive: {
    backgroundColor: clayColors.errorBg,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(200,65,59)',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  destructivePressed: {
    backgroundColor: clayColors.errorBg,
  },
  pill: {
    borderRadius: clayRadii.pill,
    backgroundColor: clayColors.surface,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(150,84,96)',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
    boxShadow: getClayBoxShadow('pill'),
  } as ViewStyle,
  disabled: {
    opacity: 0.5,
  },
  labelBase: {
    fontSize: 15,
  },
  primaryLabel: {
    color: clayColors.onPrimary,
  },
  secondaryLabel: {
    color: clayColors.text,
  },
  ghostLabel: {
    color: clayColors.primary,
  },
  destructiveLabel: {
    color: clayColors.error,
  },
  pillLabel: {
    color: clayColors.text,
  },
});
