import React from 'react';
import * as Icons from 'phosphor-react-native';
import { clayColors } from '../../theme/colors';

export type PhosphorIconName =
  | 'House'
  | 'MagnifyingGlass'
  | 'Plus'
  | 'Bell'
  | 'User'
  | 'Heart'
  | 'ChatCircle'
  | 'ShareNetwork'
  | 'BookmarkSimple'
  | 'DotsThree'
  | 'X'
  | 'Image'
  | 'PaperPlaneTilt'
  | 'ArrowUp'
  | 'UserPlus'
  | 'Eye'
  | 'EyeClosed'
  | 'Camera'
  | 'SignOut'
  | 'CaretLeft'
  | 'Check'
  | 'Sparkle';

export type ClayIconProps = {
  name: PhosphorIconName | string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  color?: string;
};

export function ClayIcon({
  name,
  size = 22,
  weight = 'duotone',
  color = clayColors.text,
}: ClayIconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} weight={weight} color={color} />;
}
