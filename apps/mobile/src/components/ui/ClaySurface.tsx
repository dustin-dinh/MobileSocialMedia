import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { clayColors } from '../../theme/colors';
import { clayRadii } from '../../theme/spacing';
import { clayStyles } from '../../theme/clay';

export type ClaySurfaceVariant =
  | 'raised'
  | 'raisedPrimary'
  | 'card'
  | 'inset'
  | 'pill'
  | 'modal'
  | 'lite'
  | 'raisedLite'
  | 'cardLite';

export type ClaySurfaceProps = ViewProps & {
  variant?: ClaySurfaceVariant;
  borderRadius?: number;
};

export function ClaySurface({
  variant = 'raised',
  borderRadius,
  style,
  children,
  ...props
}: ClaySurfaceProps) {
  let baseStyle: ViewStyle = clayStyles.raised;
  let customRadius = borderRadius;

  switch (variant) {
    case 'card':
      baseStyle = clayStyles.raisedCard;
      customRadius = customRadius ?? clayRadii.card;
      break;
    case 'raisedPrimary':
      baseStyle = clayStyles.raisedPrimary;
      customRadius = customRadius ?? clayRadii.control;
      break;
    case 'inset':
      baseStyle = clayStyles.inset;
      customRadius = customRadius ?? clayRadii.control;
      break;
    case 'pill':
      baseStyle = clayStyles.pill;
      customRadius = customRadius ?? clayRadii.pill;
      break;
    case 'modal':
      baseStyle = styles.modal;
      customRadius = customRadius ?? clayRadii.modal;
      break;
    case 'lite':
    case 'raisedLite':
    case 'cardLite':
      baseStyle = clayStyles.raisedLite;
      customRadius = customRadius ?? clayRadii.card;
      break;
    case 'raised':
    default:
      baseStyle = clayStyles.raised;
      customRadius = customRadius ?? clayRadii.card;
      break;
  }

  const radius = customRadius ?? clayRadii.card;
  const isPill = variant === 'pill';
  const isLite = variant === 'lite' || variant === 'raisedLite' || variant === 'cardLite';
  const isInset = variant === 'inset';

  return (
    <View
      style={[
        baseStyle,
        { borderRadius: radius },
        style,
      ]}
      {...props}
    >
      {/* 
        3D Clay reflection highlight bar on top lip:
        - NEVER rendered for 'pill' (avoids the horizontal white streak across floating tab bar)
        - NEVER rendered for 'lite' variants (FlatList render performance)
        - Wrapped inside a container with matching borderRadius and overflow: 'hidden' to prevent any pixel leakage
      */}
      {!isInset && !isPill && !isLite && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              overflow: 'hidden',
            },
          ]}
        >
          <View
            style={[
              styles.highlightLip,
              {
                borderRadius: radius,
                backgroundColor:
                  variant === 'raisedPrimary'
                    ? 'rgba(255,255,255,0.30)'
                    : clayColors.shadowLight,
              },
            ]}
          />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  highlightLip: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    height: 2,
    opacity: 0.85,
  },
  modal: {
    backgroundColor: clayColors.surface,
    borderTopLeftRadius: clayRadii.modal,
    borderTopRightRadius: clayRadii.modal,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(100,60,85)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 8,
  },
});
