import { ViewStyle } from 'react-native';
import { clayColors } from './colors';
import { clayRadii } from './spacing';

export type ClayElevation = 1 | 2 | 3;

const NO_SHADOW = '0px 0px 0px rgba(0,0,0,0)';

/**
 * Shadows of the flat design: content has none, and only layers that float
 * above the page (dialogs, sheets, toasts) get one soft shadow. The older
 * names are kept so existing call sites keep working.
 *
 * `boxShadow` is used (not `elevation` / `shadow*`) because it renders the
 * same on Android and iOS.
 */
export function getClayBoxShadow(
  type: 'raised' | 'raisedPrimary' | 'inset' | 'card' | 'pill' | 'lite' | 'floating',
): string {
  switch (type) {
    case 'floating':
      return '0px 8px 24px rgba(100,60,85,0.18)';
    case 'raised':
    case 'card':
    case 'pill':
      return '0px 2px 8px rgba(100,60,85,0.08)';
    case 'raisedPrimary':
    case 'inset':
    case 'lite':
    default:
      return NO_SHADOW;
  }
}

/** A bordered block on the page: one hairline, no shadow. */
const flatCard: ViewStyle = {
  backgroundColor: clayColors.surfaceHigh,
  borderColor: clayColors.border,
  borderRadius: clayRadii.card,
  borderWidth: 1,
};

export const clayStyles = {
  raised: flatCard,
  raisedCard: flatCard,
  // Lite tier: what list items use. Identical here because nothing has a heavy shadow any more.
  raisedLite: flatCard,

  raisedPrimary: {
    backgroundColor: clayColors.primary,
    borderRadius: clayRadii.control,
  } as ViewStyle,

  inset: {
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
    borderRadius: clayRadii.control,
    borderWidth: 1,
  } as ViewStyle,

  pill: {
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
    borderRadius: clayRadii.pill,
    borderWidth: 1,
  } as ViewStyle,

  /** A list row: full width, separated from the next one by a hairline. */
  row: {
    backgroundColor: clayColors.surface,
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
  } as ViewStyle,

  /** Dialogs, bottom sheets, toasts: the only surfaces with a shadow. */
  floating: {
    backgroundColor: clayColors.surfaceHigh,
    borderColor: clayColors.border,
    borderWidth: 1,
    boxShadow: getClayBoxShadow('floating'),
  } as ViewStyle,
};
