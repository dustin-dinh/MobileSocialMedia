import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { clayTypography, fontFamilies } from '../../theme/typography';

export type ClayTextVariant = 'title' | 'heading' | 'body' | 'caption' | 'meta' | 'button';

export type ClayTextProps = TextProps & {
  variant?: ClayTextVariant;
  weight?: keyof typeof fontFamilies;
  /**
   * Marks the text as a heading: 1 for the screen's title, 2 for a section.
   * Screen readers announce it on Android and iOS; the web build renders h1/h2.
   */
  level?: 1 | 2;
};

export function ClayText({
  variant = 'body',
  weight,
  level,
  style,
  children,
  ...props
}: ClayTextProps) {
  return (
    <Text
      aria-level={level}
      role={level ? 'heading' : undefined}
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
