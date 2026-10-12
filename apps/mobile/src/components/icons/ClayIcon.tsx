import React, { memo } from 'react';
import type { LucideIcon } from 'lucide-react-native';

// One file per icon: importing the package root would bundle every Lucide icon.
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import Ban from 'lucide-react-native/icons/ban';
import Bell from 'lucide-react-native/icons/bell';
import Bookmark from 'lucide-react-native/icons/bookmark';
import Camera from 'lucide-react-native/icons/camera';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import Eye from 'lucide-react-native/icons/eye';
import EyeClosed from 'lucide-react-native/icons/eye-closed';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Flag from 'lucide-react-native/icons/flag';
import Globe from 'lucide-react-native/icons/globe';
import Heart from 'lucide-react-native/icons/heart';
import House from 'lucide-react-native/icons/house';
import Image from 'lucide-react-native/icons/image';
import Link from 'lucide-react-native/icons/link';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Pause from 'lucide-react-native/icons/pause';
import Pencil from 'lucide-react-native/icons/pencil';
import Play from 'lucide-react-native/icons/play';
import Plus from 'lucide-react-native/icons/plus';
import Repeat2 from 'lucide-react-native/icons/repeat-2';
import Search from 'lucide-react-native/icons/search';
import Send from 'lucide-react-native/icons/send';
import Settings from 'lucide-react-native/icons/settings';
import Share from 'lucide-react-native/icons/share';
import Share2 from 'lucide-react-native/icons/share-2';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Trash from 'lucide-react-native/icons/trash';
import User from 'lucide-react-native/icons/user';
import UserPlus from 'lucide-react-native/icons/user-plus';
import Users from 'lucide-react-native/icons/users';
import Video from 'lucide-react-native/icons/video';
import Volume2 from 'lucide-react-native/icons/volume-2';
import VolumeX from 'lucide-react-native/icons/volume-x';
import X from 'lucide-react-native/icons/x';

import { clayColors } from '../../theme/colors';

/**
 * The app's own icon names (kept from the previous icon set, so screens did
 * not change) mapped to the Lucide icon that draws them. To restyle every
 * icon, edit this file only.
 */
const ICON_MAP = {
  ArrowUp,
  Bell,
  BookmarkSimple: Bookmark,
  Camera,
  CaretLeft: ChevronLeft,
  CaretRight: ChevronRight,
  ChatCircle: MessageCircle,
  Check,
  DotsThree: Ellipsis,
  Export: Share,
  Eye,
  EyeClosed,
  EyeSlash: EyeOff,
  Flag,
  Gear: Settings,
  GlobeSimple: Globe,
  Heart,
  House,
  Image,
  LinkSimple: Link,
  LockKey: Lock,
  MagnifyingGlass: Search,
  PaperPlaneTilt: Send,
  Pause,
  PencilSimple: Pencil,
  Play,
  Plus,
  Prohibit: Ban,
  Repeat: Repeat2,
  ShareNetwork: Share2,
  SignOut: LogOut,
  Sparkle: Sparkles,
  SpeakerHigh: Volume2,
  SpeakerSlash: VolumeX,
  Trash,
  User,
  UserPlus,
  Users,
  VideoCamera: Video,
  WarningCircle: CircleAlert,
  X,
} satisfies Record<string, LucideIcon>;

export type ClayIconName = keyof typeof ICON_MAP;

const STROKE_WIDTH = { bold: 2.5, duotone: 2, fill: 2, light: 1.5, regular: 2, thin: 1.25 };

// A filled magnifier is a solid dot: its active state is a heavier outline instead.
const OUTLINE_ONLY: ReadonlySet<string> = new Set(['MagnifyingGlass']);

export type ClayIconProps = {
  name: ClayIconName | string;
  size?: number;
  /** `fill` draws the solid version (active tab, liked, saved). */
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  color?: string;
};

export const ClayIcon = memo(function ClayIcon({
  name,
  size = 22,
  weight = 'regular',
  color = clayColors.text,
}: ClayIconProps) {
  const IconComponent = (ICON_MAP as Record<string, LucideIcon>)[name];

  if (!IconComponent) {
    return null;
  }

  const isFilled = weight === 'fill' && !OUTLINE_ONLY.has(name);

  return (
    <IconComponent
      color={color}
      fill={isFilled ? color : 'none'}
      size={size}
      strokeWidth={weight === 'fill' && !isFilled ? STROKE_WIDTH.bold : STROKE_WIDTH[weight]}
    />
  );
});
