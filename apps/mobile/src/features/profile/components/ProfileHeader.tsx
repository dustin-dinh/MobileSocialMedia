import { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { useAuthSession } from '../../auth/authSession';
import { useAuthSubmission } from '../../auth/hooks/useAuthSubmission';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { profileColors, profileRadii } from '../profileTheme';
import type { UserProfile } from '../types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 96;

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

function StatItem({ label, value }: { label: string; value: number }) {
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
      : value >= 1_000
        ? `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
        : String(value);

  return (
    <View style={styles.statItem}>
      <ClayText variant="heading" style={styles.statValue}>
        {formatted}
      </ClayText>
      <ClayText variant="caption" style={styles.statLabel}>
        {label}
      </ClayText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProfileHeader
// ---------------------------------------------------------------------------

type ProfileHeaderProps = {
  onEditProfile: () => void;
  profile: UserProfile;
};

export function ProfileHeader({ onEditProfile, profile }: ProfileHeaderProps) {
  const { signOut } = useAuthSession();
  const { isSubmitting, submit } = useAuthSubmission();

  const handleSignOut = useCallback(() => {
    void submit(signOut);
  }, [signOut, submit]);

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
        <StatItem label="Người theo dõi" value={profile.followersCount} />
        <View style={styles.statDivider} />
        <StatItem label="Đang theo dõi" value={profile.followingCount} />
      </ClaySurface>

      {/* ── Action buttons ─────────────────────────────────── */}
      <View style={styles.actionsRow}>
        <ClayButton
          accessibilityLabel="Chỉnh sửa hồ sơ cá nhân"
          onPress={onEditProfile}
          size="md"
          style={styles.actionButton}
          title="Chỉnh sửa hồ sơ"
          variant="primary"
        />

        <ClayButton
          accessibilityLabel="Đăng xuất khỏi tài khoản"
          disabled={isSubmitting}
          loading={isSubmitting}
          onPress={handleSignOut}
          size="md"
          style={styles.actionButton}
          title="Đăng xuất"
          variant="secondary"
        />
      </View>

      {/* ── Section divider ────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <ClayText variant="heading" style={styles.sectionTitle}>
          Bài viết
        </ClayText>
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
  sectionHeader: {
    borderBottomColor: profileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: profileColors.text,
  },
  statDivider: {
    backgroundColor: profileColors.border,
    height: 28,
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    paddingVertical: 14,
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

