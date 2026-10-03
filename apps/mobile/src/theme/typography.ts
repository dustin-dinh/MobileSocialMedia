import { TextStyle } from 'react-native';
import { clayColors } from './colors';

export const fontFamilies = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const clayTypography: Record<'title' | 'heading' | 'body' | 'caption' | 'meta' | 'button', TextStyle> = {
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 26,
    lineHeight: 34,
    color: clayColors.text,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 24,
    color: clayColors.text,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
    color: clayColors.text,
  },
  caption: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: clayColors.caption,
  },
  meta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    color: clayColors.caption,
  },
  button: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    lineHeight: 20,
    color: clayColors.onPrimary,
  },
};
