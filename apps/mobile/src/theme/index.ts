// =============================================================================
// ACTIVE THEME PALETTE
// Options: 'blush' (default soft vanilla-blush) | 'paper' (clean modern paper) | 'ink' (editorial high-contrast ink)
// Hướng dẫn: Đổi một dòng này rồi reload app để so sánh toàn bộ giao diện!
// =============================================================================
export const ACTIVE_PALETTE: 'blush' | 'paper' | 'ink' = 'blush';

import { setActivePaletteName } from './colors';
setActivePaletteName(ACTIVE_PALETTE);

export * from './palettes';
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './clay';
