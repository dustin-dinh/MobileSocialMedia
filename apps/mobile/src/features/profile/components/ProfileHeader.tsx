import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { ClayButton } from '../../../components/ui/ClayButton';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { clayDimensions, clayRadii } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { profileColors } from '../profileTheme';
import type { UserProfile } from '../types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 96;

export type ProfileTab = 'posts' | 'reposts';

function ProfileAvatar({ profile }: { profile: UserProfile }) {
  const initials = (profile.displayName ?? profile.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarHalo}>
      {profile.avatarUrl ? (
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
      )}
    </View>
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
      <ClayText variant="heading" style={styles.statValue}>
        {formatted}
      </ClayText>
      <ClayText variant="caption" style={styles.statLabel}>
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
  onOpenSettings,
  onPressStat,
  onToggleFollow,
  onUnblock,
  profile,
}: ProfileHeaderProps) {
  const displayName = profile.displayName ?? profile.username;

  return (
    <View style={styles.container}>
      {/* ── Avatar + Info ──────────────────────────────────── */}
      <View style={styles.topSection}>
        <ProfileAvatar profile={profile} />
        <ClayText variant="title" style={styles.displayName} numberOfLines={1}>
          {displayName}
        </ClayText>
        <ClayText variant="meta" style={styles.username}>
          @{profile.username}
        </ClayText>
        {!isOwn && profile.followsYou ? (
          <View style={styles.followsYouBadge}>
            <ClayText variant="meta" style={styles.followsYouText}>
              Theo dõi bạn
            </ClayText>
          </View>
        ) : null}
        {profile.bio ? (
          <ClayText variant="body" style={styles.bio} numberOfLines={3}>
            {profile.bio}
          </ClayText>
        ) : null}
      </View>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <ClaySurface variant="raised" style={styles.statsBar}>
        <StatItem label="Bài viết" value={profile.postsCount} />
        <View style={styles.statDivider} />
        <StatItem
          label="Người theo dõi"
          onPress={onPressStat ? () => onPressStat('followers') : undefined}
          value={profile.followersCount}
        />
        <View style={styles.statDivider} />
        <StatItem
          label="Đang theo dõi"
          onPress={onPressStat ? () => onPressStat('following') : undefined}
          value={profile.followingCount}
        />
      </ClaySurface>

      {/* ── Action buttons ─────────────────────────────────── */}
      <View style={styles.actionsRow}>
        {isOwn ? (
          <>
            <ClayButton
              accessibilityLabel="Chỉnh sửa hồ sơ cá nhân"
              onPress={onEditProfile}
              size="md"
              style={styles.actionButton}
              title="Chỉnh sửa hồ sơ"
              variant="primary"
            />
            <ClayButton
              accessibilityLabel="Mở cài đặt tài khoản"
              onPress={onOpenSettings}
              size="md"
              style={styles.actionButton}
              title="Cài đặt"
              variant="secondary"
            />
          </>
        ) : profile.isBlocked ? (
          <ClayButton
            accessibilityLabel={`Bỏ chặn ${displayName}`}
            disabled={isActionPending}
            loading={isActionPending}
            onPress={onUnblock}
            size="md"
            style={styles.actionButton}
            title="Bỏ chặn"
            variant="secondary"
          />
        ) : (
          <ClayButton
            accessibilityLabel={
              profile.isFollowing ? `Bỏ theo dõi ${displayName}` : `Theo dõi ${displayName}`
            }
            disabled={isActionPending}
            loading={isActionPending}
            onPress={onToggleFollow}
            size="md"
            style={styles.actionButton}
            title={
              profile.isFollowing
                ? 'Đang theo dõi'
                : profile.followsYou
                  ? 'Theo dõi lại'
                  : 'Theo dõi'
            }
            variant={profile.isFollowing ? 'secondary' : 'primary'}
          />
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
    gap: 12,
    paddingHorizontal: 20,
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
  avatarHalo: {
    borderColor: profileColors.surfaceWell,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    borderWidth: 3,
    padding: 2,
  },
  avatarInitials: {
    color: profileColors.primary,
  },
  bio: {
    color: profileColors.textSecondary,
    marginTop: 8,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  container: {
    backgroundColor: profileColors.canvas,
    paddingBottom: 4,
  },
  displayName: {
    color: profileColors.text,
    marginTop: 12,
  },
  followsYouBadge: {
    backgroundColor: profileColors.surfaceWell,
    borderRadius: clayRadii.pill,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  followsYouText: {
    color: profileColors.textSecondary,
  },
  statDivider: {
    backgroundColor: profileColors.border,
    height: 28,
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
  statLabel: {
    color: profileColors.caption,
    marginTop: 2,
  },
  statValue: {
    color: profileColors.text,
  },
  statsBar: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 8,
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
    borderBottomColor: profileColors.primary,
  },
  tabText: {
    color: profileColors.caption,
  },
  tabTextActive: {
    color: profileColors.primary,
    fontFamily: fontFamilies.bold,
  },
  tabs: {
    borderBottomColor: profileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  username: {
    color: profileColors.caption,
    marginTop: 2,
  },
});
