import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayDimensions, clayRadii } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { profileColors } from '../profileTheme';
import type { UserProfile } from '../types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 72;

export type ProfileTab = 'posts' | 'reposts';

function ProfileAvatar({ profile }: { profile: UserProfile }) {
  const initials = (profile.displayName ?? profile.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    profile.avatarUrl ? (
      <ExpoImage
        source={{ uri: profile.avatarUrl }}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    ) : (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <ClayText variant="title" style={styles.avatarInitials}>
          {initials}
        </ClayText>
      </View>
    )
  );
}

function StatItem({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress?: () => void;
  value: number;
}) {
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
      : value >= 1_000
        ? `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
        : String(value);

  return (
    <Pressable
      accessibilityLabel={`${formatted} ${label}`}
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={styles.statItem}
    >
      <ClayText variant="body" style={styles.statLabel}>
        <ClayText variant="body" style={styles.statValue}>
          {formatted}
        </ClayText>{' '}
        {label}
      </ClayText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ProfileHeader
// ---------------------------------------------------------------------------

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
      {/* ── Name + bio on the left, avatar on the right ────── */}
      <View style={styles.topSection}>
        <View style={styles.identity}>
          <ClayText variant="title" style={styles.displayName} numberOfLines={2}>
            {displayName}
          </ClayText>
          <View style={styles.usernameRow}>
            <ClayText variant="body" style={styles.username} numberOfLines={1}>
              @{profile.username}
            </ClayText>
            {profile.isPrivate ? (
              <ClayIcon color={profileColors.caption} name="LockKey" size={14} weight="bold" />
            ) : null}
            {!isOwn && profile.followsYou ? (
              <View style={styles.followsYouBadge}>
                <ClayText variant="meta" style={styles.followsYouText}>
                  Theo dõi bạn
                </ClayText>
              </View>
            ) : null}
          </View>
        </View>
        <ProfileAvatar profile={profile} />
      </View>

      {profile.bio ? (
        <ClayText variant="body" style={styles.bio} numberOfLines={4}>
          {profile.bio}
        </ClayText>
      ) : null}

      {/* ── Stats: one quiet line ──────────────────────────── */}
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

      {/* ── Action buttons ─────────────────────────────────── */}
      <View style={styles.actionsRow}>
        {isOwn ? (
          <>
            <View style={styles.actionButton}>
              <ClayButton
                accessibilityLabel="Chỉnh sửa hồ sơ cá nhân"
                onPress={onEditProfile}
                size="md"
                title="Chỉnh sửa hồ sơ"
                variant="secondary"
              />
            </View>
            <View style={styles.actionButton}>
              <ClayButton
                accessibilityLabel="Mở cài đặt tài khoản"
                onPress={onOpenSettings}
                size="md"
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
              size="md"
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
              size="md"
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
                size="md"
                title="Nhắn tin"
                variant="secondary"
              />
            </View>
          ) : null}
          </>
        )}
      </View>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <View style={styles.tabs}>
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
              <ClayText variant="caption" style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </ClayText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: profileColors.surfaceWell,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: profileColors.primary,
  },
  bio: {
    color: profileColors.text,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: profileColors.canvas,
    paddingBottom: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  followsYouText: {
    color: profileColors.textSecondary,
  },
  identity: {
    flex: 1,
  },
  statItem: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
  statLabel: {
    color: profileColors.caption,
  },
  statValue: {
    color: profileColors.text,
    fontFamily: fontFamilies.bold,
  },
  statsBar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
  tabActive: {
    borderBottomColor: profileColors.text,
  },
  tabText: {
    color: profileColors.caption,
  },
  tabTextActive: {
    color: profileColors.text,
    fontFamily: fontFamilies.bold,
  },
  tabs: {
    borderBottomColor: profileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 12,
  },
  topSection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  username: {
    color: profileColors.caption,
    flexShrink: 1,
  },
  usernameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
});
