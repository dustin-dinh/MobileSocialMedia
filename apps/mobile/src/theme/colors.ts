import { palettes, ColorPalette, PaletteName } from './palettes';

let activePaletteName: PaletteName = 'blush';

export function setActivePaletteName(name: PaletteName): void {
  if (name && palettes[name]) {
    activePaletteName = name;
  }
}

export function getActivePaletteName(): PaletteName {
  return activePaletteName;
}

export const googleBrandColors = {
  blue: '#4285F4',
  green: '#34A853',
  red: '#EA4335',
  yellow: '#FBBC05',
} as const;

export const clayColors: ColorPalette = new Proxy({} as ColorPalette, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'string') {
      const currentPalette = palettes[activePaletteName] || palettes.blush;
      if (prop in currentPalette) {
        return currentPalette[prop as keyof ColorPalette];
      }
    }
    return undefined;
  },
  ownKeys() {
    return Reflect.ownKeys(palettes.blush);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const currentPalette = palettes[activePaletteName] || palettes.blush;
    return {
      value: currentPalette[prop as keyof ColorPalette],
      enumerable: true,
      configurable: true,
      writable: false,
    };
  },
});

export type ClayColors = ColorPalette;
