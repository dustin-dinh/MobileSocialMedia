import { Platform, ViewStyle } from 'react-native';
import { clayColors } from './colors';
import { clayRadii } from './spacing';

export type ClayElevation = 1 | 2 | 3;

export function getClayBoxShadow(type: 'raised' | 'raisedPrimary' | 'inset' | 'card' | 'pill' | 'lite'): string {
  switch (type) {
    case 'raisedPrimary':
      return '4px 6px 12px rgba(168,36,89,0.35), -4px -4px 10px rgba(255,255,255,0.7), inset 1px 1px 2px rgba(255,255,255,0.5), inset -1px -1px 2px rgba(168,36,89,0.3)';
    case 'inset':
      return 'inset 3px 3px 6px rgba(100,60,85,0.22), inset -3px -3px 6px rgba(255,255,255,0.9)';
    case 'card':
      return '6px 8px 16px rgba(100,60,85,0.20), -6px -6px 16px rgba(255,255,255,0.95), inset 1px 1px 2px rgba(255,255,255,0.95), inset -1px -1px 2px rgba(100,60,85,0.12)';
    case 'pill':
      return '3px 4px 10px rgba(100,60,85,0.18), -3px -3px 10px rgba(255,255,255,0.9), inset 1px 1px 2px rgba(255,255,255,0.95)';
    case 'lite':
      return '2px 4px 8px rgba(100,60,85,0.14), inset 1px 1px 2px rgba(255,255,255,0.85)';
    case 'raised':
    default:
      return '4px 6px 12px rgba(100,60,85,0.22), -4px -4px 12px rgba(255,255,255,0.95), inset 1px 1px 2px rgba(255,255,255,0.95), inset -1px -1px 2px rgba(100,60,85,0.14)';
  }
}

export const clayStyles = {
  // Full clay tier (max 4 shadow/highlight layers for key interactive surfaces)
  raised: {
    backgroundColor: clayColors.surface,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(100,60,85)',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    ...(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android'
      ? ({ boxShadow: getClayBoxShadow('raised') } as ViewStyle)
      : {}),
  } as ViewStyle,

  raisedCard: {
    backgroundColor: clayColors.surface,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(100,60,85)',
    shadowOffset: { width: 5, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
    ...(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android'
      ? ({ boxShadow: getClayBoxShadow('card') } as ViewStyle)
      : {}),
  } as ViewStyle,

  raisedPrimary: {
    backgroundColor: clayColors.primary,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    borderTopColor: clayColors.primarySoft,
    borderLeftColor: clayColors.primarySoft,
    borderRightColor: clayColors.primaryPressed,
    borderBottomColor: clayColors.primaryPressed,
    shadowColor: 'rgb(168,36,89)',
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    ...(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android'
      ? ({ boxShadow: getClayBoxShadow('raisedPrimary') } as ViewStyle)
      : {}),
  } as ViewStyle,

  inset: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    borderTopColor: clayColors.border,
    borderLeftColor: clayColors.border,
    borderRightColor: clayColors.shadowLight,
    borderBottomColor: clayColors.shadowLight,
    ...(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android'
      ? ({ boxShadow: getClayBoxShadow('inset') } as ViewStyle)
      : {}),
  } as ViewStyle,

  pill: {
    backgroundColor: clayColors.tabBarBg,
    borderRadius: clayRadii.pill,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(100,60,85)',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
    ...(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android'
      ? ({ boxShadow: getClayBoxShadow('pill') } as ViewStyle)
      : {}),
  } as ViewStyle,

  // Lite clay tier (max 2 shadow layers, 1 inset, optimized for list items in FlatLists)
  raisedLite: {
    backgroundColor: clayColors.surface,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    borderTopColor: clayColors.shadowLight,
    borderLeftColor: clayColors.shadowLight,
    borderRightColor: clayColors.border,
    borderBottomColor: clayColors.border,
    shadowColor: 'rgb(100,60,85)',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
    ...(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android'
      ? ({ boxShadow: getClayBoxShadow('lite') } as ViewStyle)
      : {}),
  } as ViewStyle,
};
