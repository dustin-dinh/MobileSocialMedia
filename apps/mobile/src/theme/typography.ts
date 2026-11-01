import { TextStyle } from 'react-native';
import { clayColors } from './colors';

/**
 * Be Vietnam Pro: a grotesk drawn for Vietnamese, so every diacritic stacks
 * correctly. Four weights do all the work; 700 is for titles and names only.
 * The heavier keys map to 700 so older call sites keep a valid font.
 */
export const fontFamilies = {
  regular: 'BeVietnamPro_400Regular',
  italic: 'BeVietnamPro_400Regular_Italic',
  medium: 'BeVietnamPro_500Medium',
  semiBold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extraBold: 'BeVietnamPro_700Bold',
  black: 'BeVietnamPro_700Bold',
} as const;

/** Digits keep one width wherever numbers sit in a row or update (counts, times). */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * The scale: 12 / 13 / 14 / 15 / 16 / 22. Screen titles 22, names and section
 * titles 16, post text 15, interface text 14, meta 12-13.
 */
export const clayTypography: Record<'title' | 'heading' | 'body' | 'caption' | 'meta' | 'button', TextStyle> = {
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 28,
    color: clayColors.text,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: clayColors.text,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
    color: clayColors.text,
  },
  caption: {
    fontFamily: fontFamilies.medium,
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
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: clayColors.onPrimary,
  },
};
