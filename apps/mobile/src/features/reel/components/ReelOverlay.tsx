import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RichText } from '../../../components/common/RichText';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import type { Post } from '../../feed/types';

type ReelOverlayProps = {
  /** Space to keep clear at the bottom (the floating tab bar). */
  bottomInset: number;
  /** Hidden when the viewer already follows the author, or it is their own reel. */
  canFollow: boolean;
  isMuted: boolean;
  onFollow: () => void;
  onOpenComments: () => void;
  onOpenMenu: () => void;
  onPressAuthor: () => void;
  onPressHashtag: (tag: string) => void;
  onPressMention: (username: string) => void;
  onShare: () => void;
  onToggleLike: () => void;
  onToggleMute: () => void;
  onToggleSave: () => void;
  post: Post;
};

/** 1200 -> "1,2 N", 3400000 -> "3,4 Tr" (Vietnamese short forms). */
export function formatReelCount(value: number): string {
  const short = (amount: number, unit: string) =>
    `${amount.toFixed(1).replace(/\.0$/, '').replace('.', ',')} ${unit}`;

  if (value >= 1_000_000) {
    return short(value / 1_000_000, 'Tr');
  }

  return value >= 1_000 ? short(value / 1_000, 'N') : String(value);
}

function ActionButton({
  active = false,
  activeColor = clayColors.liked,
  count,
  icon,
  label,
  onPress,
}: {
  active?: boolean;
  activeColor?: string;
  count?: number;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={styles.action}
    >
      <ClayIcon
        color={active ? activeColor : clayColors.onPrimary}
        name={icon}
        size={30}
        weight={active ? 'fill' : 'bold'}
      />
      {count !== undefined && count > 0 ? (
        <ClayText style={styles.actionCount} variant="meta">
          {formatReelCount(count)}
        </ClayText>
      ) : null}
    </Pressable>
  );
}

/** Everything drawn on top of a reel: author, caption and the action column. */
export const ReelOverlay = memo(function ReelOverlay({
  bottomInset,
  canFollow,
  isMuted,
  onFollow,
  onOpenComments,
  onOpenMenu,
  onPressAuthor,
  onPressHashtag,
  onPressMention,
  onShare,
  onToggleLike,
  onToggleMute,
  onToggleSave,
  post,
}: ReelOverlayProps) {
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const name = post.author.displayName?.trim() || post.author.username;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Darkens the bottom so white text stays readable on bright videos. */}
      <View pointerEvents="none" style={styles.scrim} />

      <Pressable
        accessibilityLabel={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onToggleMute}
        style={styles.mute}
      >
        <ClayIcon
          color={clayColors.onPrimary}
          name={isMuted ? 'SpeakerSlash' : 'SpeakerHigh'}
          size={20}
          weight="bold"
        />
      </Pressable>

      <View pointerEvents="box-none" style={[styles.bottomRow, { paddingBottom: bottomInset }]}>
        {/* ── Author + caption ──────────────────────────── */}
        <View pointerEvents="box-none" style={styles.info}>
          <View style={styles.authorRow}>
            <Pressable
              accessibilityLabel={`Xem trang cá nhân của ${name}`}
              accessibilityRole="button"
              onPress={onPressAuthor}
              style={styles.author}
            >
              <UserAvatar avatarUrl={post.author.avatarUrl} name={name} size={40} />
              <ClayText numberOfLines={1} style={styles.authorName} variant="caption">
                {name}
              </ClayText>
            </Pressable>
            {canFollow ? (
              <Pressable
                accessibilityLabel={`Theo dõi ${name}`}
                accessibilityRole="button"
                hitSlop={6}
                onPress={onFollow}
                style={styles.follow}
              >
                <ClayText style={styles.followText} variant="meta">
                  Theo dõi
                </ClayText>
              </Pressable>
            ) : null}
          </View>

          {post.content ? (
            <RichText
              numberOfLines={isCaptionExpanded ? undefined : 2}
              onPressHashtag={onPressHashtag}
              onPressMention={onPressMention}
              onPressText={() => setIsCaptionExpanded((expanded) => !expanded)}
              style={styles.caption}
              text={post.content}
            />
          ) : null}
        </View>

        {/* ── Actions ───────────────────────────────────── */}
        <View style={styles.actions}>
          <ActionButton
            active={post.isLiked}
            count={post.likesCount}
            icon="Heart"
            label={post.isLiked ? 'Bỏ thích video' : 'Thích video'}
            onPress={onToggleLike}
          />
          <ActionButton
            count={post.commentsCount}
            icon="ChatCircle"
            label="Xem bình luận"
            onPress={onOpenComments}
          />
          <ActionButton icon="ShareNetwork" label="Chia sẻ video" onPress={onShare} />
          <ActionButton
            active={post.isSaved}
            activeColor={clayColors.saved}
            icon="BookmarkSimple"
            label={post.isSaved ? 'Bỏ lưu video' : 'Lưu video'}
            onPress={onToggleSave}
          />
          <ActionButton icon="DotsThree" label="Tuỳ chọn khác" onPress={onOpenMenu} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget + 8,
    minWidth: clayDimensions.minTouchTarget,
  },
  actionCount: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.bold,
    marginTop: 2,
  },
  actions: {
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  author: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 10,
    minHeight: clayDimensions.minTouchTarget,
  },
  authorName: {
    color: clayColors.onPrimary,
    flexShrink: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  bottomRow: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  caption: {
    color: clayColors.onPrimary,
    marginTop: 6,
  },
  follow: {
    borderColor: clayColors.onPrimary,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  followText: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.bold,
  },
  info: {
    flex: 1,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 12,
  },
  mute: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 22,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: clayDimensions.minTouchTarget,
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    bottom: 0,
    height: '38%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
