import { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuthSession } from '../../auth/authSession';
import { useAuthSubmission } from '../../auth/hooks/useAuthSubmission';
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

  if (profile.avatarUrl) {
    return <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{initials}</Text>
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
      <Text style={styles.statValue}>{formatted}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
        <Text style={styles.displayName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={3}>
            {profile.bio}
          </Text>
        ) : null}
      </View>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <View style={styles.statsBar}>
        <StatItem label="Posts" value={profile.postsCount} />
        <View style={styles.statDivider} />
        <StatItem label="Followers" value={profile.followersCount} />
        <View style={styles.statDivider} />
        <StatItem label="Following" value={profile.followingCount} />
      </View>

      {/* ── Action buttons ─────────────────────────────────── */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onEditProfile}
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.actionButton,
            styles.logoutButton,
            pressed && !isSubmitting ? styles.logoutButtonPressed : undefined,
            isSubmitting ? styles.buttonDisabled : undefined,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={profileColors.danger} size="small" />
          ) : (
            <Text style={styles.logoutButtonText}>Log out</Text>
          )}
        </Pressable>
      </View>

      {/* ── Section divider ────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Posts</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: profileRadii.button,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
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
    backgroundColor: profileColors.primary,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  bio: {
    color: profileColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  container: {
    backgroundColor: profileColors.surface,
    paddingBottom: 4,
  },
  displayName: {
    color: profileColors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  editButton: {
    backgroundColor: profileColors.primary,
  },
  editButtonPressed: {
    backgroundColor: profileColors.primaryPressed,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: profileColors.surface,
    borderColor: profileColors.border,
    borderWidth: 1,
  },
  logoutButtonPressed: {
    backgroundColor: profileColors.background,
  },
  logoutButtonText: {
    color: profileColors.danger,
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 17,
    fontWeight: '700',
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
    fontSize: 13,
    marginTop: 2,
  },
  statValue: {
    color: profileColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statsBar: {
    alignItems: 'center',
    backgroundColor: profileColors.background,
    borderRadius: profileRadii.card,
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
    fontSize: 15,
    marginTop: 2,
  },
});
