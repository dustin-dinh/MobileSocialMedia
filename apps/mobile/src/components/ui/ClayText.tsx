import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { clayTypography, fontFamilies } from '../../theme/typography';

export type ClayTextVariant = 'title' | 'heading' | 'body' | 'caption' | 'meta' | 'button';

export type ClayTextProps = TextProps & {
  variant?: ClayTextVariant;
  weight?: keyof typeof fontFamilies;
};

export function ClayText({
  variant = 'body',
  weight,
  style,
  children,
  ...props
}: ClayTextProps) {
  return (
    <Text
      style={[
        styles.base,
        clayTypography[variant],
        weight ? { fontFamily: fontFamilies[weight] } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
