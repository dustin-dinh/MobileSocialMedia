import { palette, ColorPalette } from './palettes';

export const googleBrandColors = {
  blue: '#4285F4',
  green: '#34A853',
  red: '#EA4335',
  yellow: '#FBBC05',
} as const;

export const clayColors: ColorPalette = palette;

export type ClayColors = ColorPalette;
