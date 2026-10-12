import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { clayRadii } from '../../theme/spacing';
import { clayStyles } from '../../theme/clay';

export type ClaySurfaceVariant =
  | 'raised'
  | 'raisedPrimary'
  | 'card'
  | 'inset'
  | 'pill'
  | 'modal'
  | 'dialog'
  | 'lite'
  | 'raisedLite'
  | 'cardLite'
  | 'rowLite'
  | 'flat';

export type ClaySurfaceProps = ViewProps & {
  variant?: ClaySurfaceVariant;
  borderRadius?: number;
};

/**
 * The surfaces of the flat design:
 * - `card` / `raised` / `*Lite`: a bordered block with small corners (post cards).
 * - `rowLite`: a full-width list row with a hairline below it.
 * - `inset`: the well of an input.
 * - `modal` (bottom sheet) and `dialog`: floating layers, the only ones with a shadow.
 * - `flat`: no chrome at all.
 */
export function ClaySurface({
  variant = 'raised',
  borderRadius,
  style,
  children,
  ...props
}: ClaySurfaceProps) {
  let baseStyle: ViewStyle;
  let radiusStyle: ViewStyle;

  switch (variant) {
    case 'raisedPrimary':
      baseStyle = clayStyles.raisedPrimary;
      radiusStyle = { borderRadius: borderRadius ?? clayRadii.control };
      break;
    case 'inset':
      baseStyle = clayStyles.inset;
      radiusStyle = { borderRadius: borderRadius ?? clayRadii.control };
      break;
    case 'pill':
      baseStyle = clayStyles.pill;
      radiusStyle = { borderRadius: borderRadius ?? clayRadii.pill };
      break;
    case 'modal':
      baseStyle = clayStyles.floating;
      // A bottom sheet is only rounded where it meets the page.
      radiusStyle = {
        borderTopLeftRadius: borderRadius ?? clayRadii.modal,
        borderTopRightRadius: borderRadius ?? clayRadii.modal,
      };
      break;
    case 'dialog':
      baseStyle = clayStyles.floating;
      radiusStyle = { borderRadius: borderRadius ?? clayRadii.dialog };
      break;
    case 'rowLite':
      baseStyle = clayStyles.row;
      radiusStyle = {};
      break;
    case 'flat':
      baseStyle = {};
      radiusStyle = borderRadius === undefined ? {} : { borderRadius };
      break;
    case 'lite':
    case 'raisedLite':
    case 'cardLite':
      baseStyle = clayStyles.raisedLite;
      radiusStyle = { borderRadius: borderRadius ?? clayRadii.card };
      break;
    case 'card':
    case 'raised':
    default:
      baseStyle = clayStyles.raised;
      radiusStyle = { borderRadius: borderRadius ?? clayRadii.card };
      break;
  }

  // Rounded blocks clip their children (media reaching the edge follows the
  // corners). Pills and chrome-less surfaces must not: they hold badges and
  // controls that may reach past their edge.
  const clipsChildren = variant !== 'pill' && variant !== 'flat' && variant !== 'rowLite';

  return (
    <View
      style={[baseStyle, radiusStyle, clipsChildren ? { overflow: 'hidden' } : undefined, style]}
      {...props}
    >
      {children}
    </View>
  );
}
