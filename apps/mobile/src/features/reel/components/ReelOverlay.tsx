import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RichText } from '../../../components/common/RichText';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import type { Post } from '../../feed/types';

// Media viewers: white text and icons on the video; the brand hue only on a liked heart.
const MEDIA_INK = clayColors.onPrimary;

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
        color={active ? activeColor : MEDIA_INK}
        name={icon}
        size={28}
        weight={active ? 'fill' : 'bold'}
      />
      {count !== undefined ? (
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
          color={MEDIA_INK}
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
              <ClayText numberOfLines={1} style={styles.authorName} variant="body" weight="semiBold">
                {name}
              </ClayText>
            </Pressable>
            {post.isSample ? (
              <View style={styles.sampleTag}>
                <ClayText style={styles.sampleTagText} variant="meta">
                  Video mẫu
                </ClayText>
              </View>
            ) : null}
            {canFollow ? (
              <Pressable
                accessibilityLabel={`Theo dõi ${name}`}
                accessibilityRole="button"
                hitSlop={6}
                onPress={onFollow}
                style={styles.follow}
              >
                <ClayText style={styles.followText} variant="caption">
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
              tokenStyle={styles.captionToken}
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
            // Saved is ink on light screens; on a dark video it is a filled white mark.
            activeColor={MEDIA_INK}
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
    ...tabularNums,
    color: MEDIA_INK,
    fontFamily: fontFamilies.semiBold,
    marginTop: 2,
  },
  // 44px buttons around 28px glyphs: 8px right padding puts the glyphs on the 16px margin.
  actions: {
    alignItems: 'center',
    gap: claySpacing.xs,
    paddingBottom: claySpacing.sm,
    paddingRight: claySpacing.sm,
  },
  author: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget,
  },
  authorName: {
    color: MEDIA_INK,
    flexShrink: 1,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
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
    color: MEDIA_INK,
    marginTop: claySpacing.sm,
  },
  // The brand pink is unreadable on a dark video: tags stay white, set heavier.
  captionToken: {
    color: MEDIA_INK,
    fontFamily: fontFamilies.semiBold,
  },
  // 32px tall plus hitSlop 6 on each side: a 44px target.
  follow: {
    borderColor: MEDIA_INK,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: claySpacing.md,
  },
  followText: {
    color: MEDIA_INK,
    fontFamily: fontFamilies.semiBold,
  },
  info: {
    flex: 1,
    paddingBottom: claySpacing.md,
    paddingLeft: clayDimensions.gutter,
    paddingRight: claySpacing.md,
  },
  // A neutral disc keeps the white glyph readable on a bright frame.
  mute: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: clayRadii.pill,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    position: 'absolute',
    right: clayDimensions.gutter,
    top: clayDimensions.gutter,
    width: clayDimensions.minTouchTarget,
  },
  sampleTag: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: clayRadii.pill,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: claySpacing.sm,
    paddingVertical: 2,
  },
  sampleTagText: {
    color: MEDIA_INK,
  },
  scrim: {
    bottom: 0,
    // A fade, not a flat box: a flat box shows a hard edge across the video.
    experimental_backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.6))', // taste-skill-ignore: the media scrim, neutral black under white text over video
    height: '45%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
