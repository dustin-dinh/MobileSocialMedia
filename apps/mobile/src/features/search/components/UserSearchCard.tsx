import { memo, useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { searchColors } from '../searchTheme';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayButton } from '../../../components/ui/ClayButton';
import type { SearchedUser } from '../types';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 50;

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

// ---------------------------------------------------------------------------
// UserAvatar
// ---------------------------------------------------------------------------

function UserAvatar({ user }: { user: SearchedUser }) {
  const nameToUse = user.displayName?.trim() || user.username;
  const initials = nameToUse
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarHalo}>
      {user.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <ClayText variant="caption" style={styles.avatarInitials}>
            {initials || '?'}
          </ClayText>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// UserSearchCard Component (memoized)
// ---------------------------------------------------------------------------

export type UserSearchCardProps = {
  isPending?: boolean;
  onPressUser?: (user: SearchedUser) => void;
  onToggleFollow: (user: SearchedUser) => void;
  user: SearchedUser;
};

/**
 * UserSearchCard component (memoized, lite clay tier)
 * Uses lightweight flat row with subtle border and elevation 2 on avatar halo (<= 2 layers).
 */
export const UserSearchCard = memo(function UserSearchCard({
  isPending = false,
  onPressUser,
  onToggleFollow,
  user,
}: UserSearchCardProps) {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressFollow = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        duration: 90,
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        friction: 4,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleFollow(user);
  }, [buttonScale, onToggleFollow, user]);

  const displayName = user.displayName?.trim() || user.username;
  const isFollowing = user.isFollowing;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View profile of @${user.username}`}
      onPress={() => onPressUser?.(user)}
      style={styles.cardContainer}
    >
      {/* ── Left: Avatar ────────────────────────────────────── */}
      <UserAvatar user={user} />

      {/* ── Center: User Meta & Bio ─────────────────────────── */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <ClayText variant="heading" style={styles.displayName} numberOfLines={1}>
            {displayName}
          </ClayText>
        </View>

        <ClayText variant="meta" style={styles.username} numberOfLines={1}>
          @{user.username}
          <ClayText variant="meta" style={styles.followersText}>
            {' '}• {formatCount(user.followersCount)} followers
          </ClayText>
        </ClayText>

        {user.bio ? (
          <ClayText variant="body" style={styles.bio} numberOfLines={1} ellipsizeMode="tail">
            {user.bio}
          </ClayText>
        ) : null}
      </View>

      {/* ── Right: Follow / Following Button ─────────────────── */}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <ClayButton
          accessibilityLabel={isFollowing ? `Following @${user.username}` : `Follow @${user.username}`}
          variant={isFollowing ? 'secondary' : 'primary'}
          label={isFollowing ? 'Following' : 'Follow'}
          isLoading={isPending}
          onPress={handlePressFollow}
          style={styles.followButton}
          labelStyle={styles.followButtonLabel}
        />
      </Animated.View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  avatarHalo: {
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 1.5,
    borderColor: clayColors.surfaceHigh,
    shadowColor: 'rgb(100,60,85)',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitials: {
    color: clayColors.primary,
    fontSize: 16,
    fontFamily: fontFamilies.extraBold,
  },
  bio: {
    color: searchColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  cardContainer: {
    alignItems: 'center',
    backgroundColor: searchColors.surface,
    borderBottomColor: searchColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  displayName: {
    fontSize: 15,
  },
  followButton: {
    minHeight: 36,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followButtonLabel: {
    fontSize: 13,
  },
  followersText: {
    color: searchColors.caption,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  username: {
    color: searchColors.caption,
    marginTop: 1,
  },
});
