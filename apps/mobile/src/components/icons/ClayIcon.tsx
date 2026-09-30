import React, { memo } from 'react';
import type { ComponentType } from 'react';
import type { IconProps } from 'phosphor-react-native';

import { ArrowUp } from 'phosphor-react-native/lib/module/icons/ArrowUp';
import { Bell } from 'phosphor-react-native/lib/module/icons/Bell';
import { BookmarkSimple } from 'phosphor-react-native/lib/module/icons/BookmarkSimple';
import { CaretLeft } from 'phosphor-react-native/lib/module/icons/CaretLeft';
import { ChatCircle } from 'phosphor-react-native/lib/module/icons/ChatCircle';
import { Check } from 'phosphor-react-native/lib/module/icons/Check';
import { DotsThree } from 'phosphor-react-native/lib/module/icons/DotsThree';
import { Eye } from 'phosphor-react-native/lib/module/icons/Eye';
import { EyeClosed } from 'phosphor-react-native/lib/module/icons/EyeClosed';
import { Heart } from 'phosphor-react-native/lib/module/icons/Heart';
import { House } from 'phosphor-react-native/lib/module/icons/House';
import { Image } from 'phosphor-react-native/lib/module/icons/Image';
import { MagnifyingGlass } from 'phosphor-react-native/lib/module/icons/MagnifyingGlass';
import { PaperPlaneTilt } from 'phosphor-react-native/lib/module/icons/PaperPlaneTilt';
import { Plus } from 'phosphor-react-native/lib/module/icons/Plus';
import { ShareNetwork } from 'phosphor-react-native/lib/module/icons/ShareNetwork';
import { SignOut } from 'phosphor-react-native/lib/module/icons/SignOut';
import { Sparkle } from 'phosphor-react-native/lib/module/icons/Sparkle';
import { User } from 'phosphor-react-native/lib/module/icons/User';
import { UserPlus } from 'phosphor-react-native/lib/module/icons/UserPlus';
import { X } from 'phosphor-react-native/lib/module/icons/X';

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

const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  ArrowUp,
  Bell,
  BookmarkSimple,
  CaretLeft,
  ChatCircle,
  Check,
  DotsThree,
  Eye,
  EyeClosed,
  Heart,
  House,
  Image,
  MagnifyingGlass,
  PaperPlaneTilt,
  Plus,
  ShareNetwork,
  SignOut,
  Sparkle,
  User,
  UserPlus,
  X,
};

export type ClayIconProps = {
  name: PhosphorIconName | string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  color?: string;
};

export const ClayIcon = memo(function ClayIcon({
  name,
  size = 22,
  weight = 'duotone',
  color = clayColors.text,
}: ClayIconProps) {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} weight={weight} color={color} />;
});
