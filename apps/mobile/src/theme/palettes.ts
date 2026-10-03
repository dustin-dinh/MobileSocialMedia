export interface ColorPalette {
  canvas: string;
  surface: string;
  surfaceHigh: string;
  surfaceWell: string;
  border: string;
  text: string;
  textSecondary: string;
  caption: string;
  shadowDark: string;
  shadowLight: string;
  shadowDarkPressed: string;
  tabBarBg: string;
  tabBarIcon: string;
  tabBarIconActive: string;
  tabBarActiveDot: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  liked: string;
  saved: string;
  success: string;
  error: string;
  errorPressed: string;
  errorBg: string;
}

export type PaletteName = 'blush' | 'paper' | 'ink';

const commonColors = {
  primary: '#CC2F6E',
  primaryPressed: '#A82459',
  primarySoft: '#F6CADB',
  liked: '#E0457B',
  saved: '#E3A02E',
  success: '#4E9F7D',
  error: '#C8413B',
  errorPressed: '#B0332E',
  errorBg: '#F8D9D3',
} as const;

export const blushPalette: ColorPalette = {
  ...commonColors,
  canvas: '#F3E9EC',
  surface: '#FBF5F7',
  surfaceHigh: '#FFFAFB',
  surfaceWell: '#EADDE2',
  border: '#E3D3DA',
  text: '#3A2530',
  textSecondary: '#6B5560',
  caption: '#745D67',
  shadowDark: 'rgba(100,60,85,0.22)',
  shadowLight: 'rgba(255,255,255,0.85)',
  shadowDarkPressed: 'rgba(100,60,85,0.12)',
  tabBarBg: '#FBF5F7',
  tabBarIcon: '#B9A3AD',
  tabBarIconActive: '#CC2F6E',
  tabBarActiveDot: '#CC2F6E',
  onPrimary: '#FFF5F8',
};

export const paperPalette: ColorPalette = {
  ...commonColors,
  canvas: '#F1F0F3',
  surface: '#FFFFFF',
  surfaceHigh: '#FFFFFF',
  surfaceWell: '#E7E5EA',
  border: '#E2DFE5',
  text: '#1F1A1D',
  textSecondary: '#5E565B',
  caption: '#6A6268',
  shadowDark: 'rgba(60,45,70,0.20)',
  shadowLight: 'rgba(255,255,255,0.95)',
  shadowDarkPressed: 'rgba(60,45,70,0.12)',
  tabBarBg: '#FFFFFF',
  tabBarIcon: '#B4B0B8',
  tabBarIconActive: '#CC2F6E',
  tabBarActiveDot: '#CC2F6E',
  onPrimary: '#FFFFFF',
};

export const inkPalette: ColorPalette = {
  ...commonColors,
  canvas: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceHigh: '#FFFFFF',
  surfaceWell: '#E9E9EA',
  border: '#E4E4E4',
  text: '#121212',
  textSecondary: '#555555',
  caption: '#666666',
  shadowDark: 'rgba(20,15,18,0.22)',
  shadowLight: 'rgba(255,255,255,0.95)',
  shadowDarkPressed: 'rgba(20,15,18,0.12)',
  tabBarBg: '#1B1518',
  tabBarIcon: '#7A7074',
  tabBarIconActive: '#F06A9C',
  tabBarActiveDot: '#F06A9C',
  onPrimary: '#FFFFFF',
};

export const palettes: Record<PaletteName, ColorPalette> = {
  blush: blushPalette,
  paper: paperPalette,
  ink: inkPalette,
};
