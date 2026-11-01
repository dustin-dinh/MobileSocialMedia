import { Pressable, StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { profileColors } from '../profileTheme';
import type { UserProfile } from '../types';

const AVATAR_SIZE = 72;
const GUTTER = clayDimensions.gutter;

export type ProfileTab = 'posts' | 'reposts';

function ProfileAvatar({ profile }: { profile: UserProfile }) {
  const initials = (profile.displayName ?? profile.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return profile.avatarUrl ? (
    <ExpoImage
      cachePolicy="memory-disk"
      contentFit="cover"
      source={{ uri: profile.avatarUrl }}
      style={styles.avatar}
    />
  ) : (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <ClayText style={styles.avatarInitials} variant="title">
        {initials}
      </ClayText>
    </View>
  );
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return String(value);
}

/** One count as a figure: the number over its noun. Tappable when it opens a list. */
function StatItem({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress?: () => void;
  value: number;
}) {
  const formatted = formatCount(value);

  return (
    <Pressable
      accessibilityLabel={`${formatted} ${label}`}
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.statItem, pressed && styles.statItemPressed]}
    >
      <ClayText style={styles.statValue} variant="heading">
        {formatted}
      </ClayText>
      <ClayText variant="caption">{label}</ClayText>
    </Pressable>
  );
}

type ProfileHeaderProps = {
  activeTab: ProfileTab;
  /** A follow/unfollow/unblock request is in flight. */
  isActionPending?: boolean;
  /** The signed-in user's own profile: shows Edit and Settings instead of Follow. */
  isOwn: boolean;
  onChangeTab: (tab: ProfileTab) => void;
  onEditProfile?: () => void;
  /** Other people's profiles: open the conversation with this user. */
  onMessage?: () => void;
  onOpenSettings?: () => void;
  onPressStat?: (type: 'followers' | 'following') => void;
  onToggleFollow?: () => void;
  onUnblock?: () => void;
  profile: UserProfile;
};

const TABS: Array<{ key: ProfileTab; label: string }> = [
  { key: 'posts', label: 'Bài viết' },
  { key: 'reposts', label: 'Đăng lại' },
];

export function ProfileHeader({
  activeTab,
  isActionPending = false,
  isOwn,
  onChangeTab,
  onEditProfile,
  onMessage,
  onOpenSettings,
  onPressStat,
  onToggleFollow,
  onUnblock,
  profile,
}: ProfileHeaderProps) {
  const displayName = profile.displayName ?? profile.username;

  return (
    <View style={styles.container}>
      {profile.coverUrl ? (
        <ExpoImage
          accessibilityLabel={`Ảnh bìa của ${displayName}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: profile.coverUrl }}
          style={styles.cover}
        />
      ) : null}

      {/* Name on the left, avatar on the right */}
      <View style={styles.topSection}>
        <View style={styles.identity}>
          {/* Own profile is a tab root, so the name is its h1; elsewhere the header bar holds the h1. */}
          <ClayText level={isOwn ? 1 : 2} numberOfLines={2} style={styles.displayName} variant="title">
            {displayName}
          </ClayText>
          <View style={styles.usernameRow}>
            <ClayText numberOfLines={1} style={styles.username} variant="body">
              @{profile.username}
            </ClayText>
            {profile.isPrivate ? (
              <View accessibilityLabel="Tài khoản riêng tư" accessible style={styles.privateMark}>
                <ClayIcon color={clayColors.caption} name="LockKey" size={14} />
                <ClayText variant="meta">Riêng tư</ClayText>
              </View>
            ) : null}
            {!isOwn && profile.followsYou ? (
              <View style={styles.followsYouBadge}>
                <ClayText style={styles.followsYouText} variant="meta">
                  Theo dõi bạn
                </ClayText>
              </View>
            ) : null}
          </View>
        </View>
        <ProfileAvatar profile={profile} />
      </View>

      {profile.bio ? (
        <ClayText numberOfLines={4} style={styles.bio} variant="body">
          {profile.bio}
        </ClayText>
      ) : null}

      <View style={styles.statsBar}>
        <StatItem label="bài viết" value={profile.postsCount} />
        <StatItem
          label="người theo dõi"
          onPress={onPressStat ? () => onPressStat('followers') : undefined}
          value={profile.followersCount}
        />
        <StatItem
          label="đang theo dõi"
          onPress={onPressStat ? () => onPressStat('following') : undefined}
          value={profile.followingCount}
        />
      </View>

      <View style={styles.actionsRow}>
        {isOwn ? (
          <>
            <View style={styles.actionButton}>
              <ClayButton
                accessibilityLabel="Chỉnh sửa hồ sơ cá nhân"
                onPress={onEditProfile}
                title="Chỉnh sửa hồ sơ"
                variant="secondary"
              />
            </View>
            <View style={styles.actionButton}>
              <ClayButton
                accessibilityLabel="Mở cài đặt tài khoản"
                icon={<ClayIcon color={clayColors.caption} name="Gear" size={16} />}
                onPress={onOpenSettings}
                title="Cài đặt"
                variant="secondary"
              />
            </View>
          </>
        ) : profile.isBlocked ? (
          <View style={styles.actionButton}>
            <ClayButton
              accessibilityLabel={`Bỏ chặn ${displayName}`}
              disabled={isActionPending}
              loading={isActionPending}
              onPress={onUnblock}
              title="Bỏ chặn"
              variant="secondary"
            />
          </View>
        ) : (
          <>
            <View style={styles.actionButton}>
              <ClayButton
                accessibilityLabel={
                  profile.isFollowing
                    ? `Bỏ theo dõi ${displayName}`
                    : profile.followRequested
                      ? `Huỷ yêu cầu theo dõi ${displayName}`
                      : `Theo dõi ${displayName}`
                }
                disabled={isActionPending}
                loading={isActionPending}
                onPress={onToggleFollow}
                title={
                  profile.isFollowing
                    ? 'Đang theo dõi'
                    : profile.followRequested
                      ? 'Đã gửi yêu cầu'
                      : profile.followsYou
                        ? 'Theo dõi lại'
                        : 'Theo dõi'
                }
                variant={profile.isFollowing || profile.followRequested ? 'secondary' : 'primary'}
              />
            </View>
            {onMessage ? (
              <View style={styles.actionButton}>
                <ClayButton
                  accessibilityLabel={`Nhắn tin cho ${displayName}`}
                  onPress={onMessage}
                  title="Nhắn tin"
                  variant="secondary"
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Underline tabs, each as wide as its label, on one full-width rule */}
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              accessibilityLabel={`Xem ${tab.label.toLowerCase()}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab.key}
              onPress={() => onChangeTab(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <ClayText style={[styles.tabText, isActive && styles.tabTextActive]} variant="body">
                {tab.label}
              </ClayText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: claySpacing.sm,
    paddingHorizontal: GUTTER,
    paddingTop: claySpacing.base,
  },
  avatar: {
    // Shows a quiet circle while the picture loads.
    backgroundColor: profileColors.surfaceWell,
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: clayColors.primaryInk,
  },
  bio: {
    color: profileColors.text,
    marginTop: claySpacing.md,
    paddingHorizontal: GUTTER,
  },
  container: {
    backgroundColor: profileColors.canvas,
  },
  cover: {
    backgroundColor: profileColors.surfaceWell,
    height: 120,
    width: '100%',
  },
  displayName: {
    color: profileColors.text,
  },
  followsYouBadge: {
    backgroundColor: profileColors.surfaceWell,
    borderRadius: clayRadii.pill,
    paddingHorizontal: claySpacing.sm,
    paddingVertical: 2,
  },
  followsYouText: {
    color: profileColors.textSecondary,
  },
  identity: {
    flex: 1,
  },
  privateMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.xs,
  },
  statItem: {
    borderRadius: clayRadii.control,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    paddingVertical: claySpacing.xs,
  },
  statItemPressed: {
    backgroundColor: profileColors.surfaceWell,
  },
  statValue: {
    ...tabularNums,
    color: profileColors.text,
  },
  statsBar: {
    columnGap: claySpacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: claySpacing.md,
    paddingHorizontal: GUTTER,
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    justifyContent: 'center',
    marginBottom: -1,
    minHeight: clayDimensions.minTouchTarget,
  },
  tabActive: {
    borderBottomColor: clayColors.primary,
  },
  tabText: {
    color: profileColors.caption,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },
  tabTextActive: {
    color: profileColors.text,
    fontFamily: fontFamilies.semiBold,
  },
  tabs: {
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    columnGap: claySpacing.xl,
    flexDirection: 'row',
    marginTop: claySpacing.base,
    paddingHorizontal: GUTTER,
  },
  topSection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.base,
    paddingHorizontal: GUTTER,
    paddingTop: claySpacing.base,
  },
  username: {
    color: profileColors.caption,
    flexShrink: 1,
    fontSize: 14,
  },
  usernameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: claySpacing.sm,
    marginTop: 2,
  },
});
