import React, { memo } from 'react';
import type { ComponentType } from 'react';
import type { IconProps } from 'phosphor-react-native';

import { ArrowUp } from 'phosphor-react-native/lib/module/icons/ArrowUp';
import { Bell } from 'phosphor-react-native/lib/module/icons/Bell';
import { BookmarkSimple } from 'phosphor-react-native/lib/module/icons/BookmarkSimple';
import { Camera } from 'phosphor-react-native/lib/module/icons/Camera';
import { CaretLeft } from 'phosphor-react-native/lib/module/icons/CaretLeft';
import { ChatCircle } from 'phosphor-react-native/lib/module/icons/ChatCircle';
import { Check } from 'phosphor-react-native/lib/module/icons/Check';
import { DotsThree } from 'phosphor-react-native/lib/module/icons/DotsThree';
import { Export } from 'phosphor-react-native/lib/module/icons/Export';
import { Eye } from 'phosphor-react-native/lib/module/icons/Eye';
import { EyeClosed } from 'phosphor-react-native/lib/module/icons/EyeClosed';
import { EyeSlash } from 'phosphor-react-native/lib/module/icons/EyeSlash';
import { Flag } from 'phosphor-react-native/lib/module/icons/Flag';
import { GlobeSimple } from 'phosphor-react-native/lib/module/icons/GlobeSimple';
import { Heart } from 'phosphor-react-native/lib/module/icons/Heart';
import { House } from 'phosphor-react-native/lib/module/icons/House';
import { Image } from 'phosphor-react-native/lib/module/icons/Image';
import { LinkSimple } from 'phosphor-react-native/lib/module/icons/LinkSimple';
import { LockKey } from 'phosphor-react-native/lib/module/icons/LockKey';
import { MagnifyingGlass } from 'phosphor-react-native/lib/module/icons/MagnifyingGlass';
import { PaperPlaneTilt } from 'phosphor-react-native/lib/module/icons/PaperPlaneTilt';
import { PencilSimple } from 'phosphor-react-native/lib/module/icons/PencilSimple';
import { Plus } from 'phosphor-react-native/lib/module/icons/Plus';
import { Repeat } from 'phosphor-react-native/lib/module/icons/Repeat';
import { ShareNetwork } from 'phosphor-react-native/lib/module/icons/ShareNetwork';
import { SignOut } from 'phosphor-react-native/lib/module/icons/SignOut';
import { Sparkle } from 'phosphor-react-native/lib/module/icons/Sparkle';
import { Trash } from 'phosphor-react-native/lib/module/icons/Trash';
import { User } from 'phosphor-react-native/lib/module/icons/User';
import { UserPlus } from 'phosphor-react-native/lib/module/icons/UserPlus';
import { Users } from 'phosphor-react-native/lib/module/icons/Users';
import { WarningCircle } from 'phosphor-react-native/lib/module/icons/WarningCircle';
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
  | 'EyeSlash'
  | 'Camera'
  | 'SignOut'
  | 'CaretLeft'
  | 'Check'
  | 'Sparkle'
  | 'PencilSimple'
  | 'Trash'
  | 'GlobeSimple'
  | 'Users'
  | 'LockKey'
  | 'LinkSimple'
  | 'Export'
  | 'Flag'
  | 'Repeat'
  | 'WarningCircle';

const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  ArrowUp,
  Bell,
  BookmarkSimple,
  Camera,
  CaretLeft,
  ChatCircle,
  Check,
  DotsThree,
  Export,
  Eye,
  EyeClosed,
  EyeSlash,
  Flag,
  GlobeSimple,
  Heart,
  House,
  Image,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Repeat,
  ShareNetwork,
  SignOut,
  Sparkle,
  Trash,
  User,
  UserPlus,
  Users,
  WarningCircle,
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
