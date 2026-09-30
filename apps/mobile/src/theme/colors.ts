import { palettes, ColorPalette, PaletteName } from './palettes';

function getActivePaletteName(): PaletteName {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const themeIndex = require('./index');
    if (themeIndex && themeIndex.ACTIVE_PALETTE && palettes[themeIndex.ACTIVE_PALETTE as PaletteName]) {
      return themeIndex.ACTIVE_PALETTE as PaletteName;
    }
  } catch {
    // Circular require fallback
  }
  return 'blush';
}

export const clayColors: ColorPalette = new Proxy({} as ColorPalette, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'string') {
      const activeName = getActivePaletteName();
      const currentPalette = palettes[activeName] || palettes.blush;
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
    const activeName = getActivePaletteName();
    const currentPalette = palettes[activeName] || palettes.blush;
    return {
      value: currentPalette[prop as keyof ColorPalette],
      enumerable: true,
      configurable: true,
      writable: false,
    };
  },
});

export type ClayColors = ColorPalette;
