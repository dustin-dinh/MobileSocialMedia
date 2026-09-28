import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { searchColors, searchRadii } from '../searchTheme';
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

  if (user.avatarUrl) {
    return <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{initials || '?'}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// UserSearchCard Component
// ---------------------------------------------------------------------------

export type UserSearchCardProps = {
  isPending?: boolean;
  onPressUser?: (user: SearchedUser) => void;
  onToggleFollow: (user: SearchedUser) => void;
  user: SearchedUser;
};

export function UserSearchCard({
  isPending = false,
  onPressUser,
  onToggleFollow,
  user,
}: UserSearchCardProps) {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressFollow = useCallback(() => {
    // Quick micro-spring feedback
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
      onPress={() => onPressUser?.(user)}
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardContainerPressed,
      ]}
    >
      {/* ── Left: Avatar ────────────────────────────────────── */}
      <UserAvatar user={user} />

      {/* ── Center: User Meta & Bio ─────────────────────────── */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <Text style={styles.username} numberOfLines={1}>
          @{user.username}
          <Text style={styles.followersText}>
            {' '}• {formatCount(user.followersCount)} followers
          </Text>
        </Text>

        {user.bio ? (
          <Text style={styles.bio} numberOfLines={1} ellipsizeMode="tail">
            {user.bio}
          </Text>
        ) : null}
      </View>

      {/* ── Right: Follow / Following Button ─────────────────── */}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <Pressable
          onPress={handlePressFollow}
          disabled={isPending}
          hitSlop={6}
          style={({ pressed }) => [
            styles.followButton,
            isFollowing ? styles.followingButton : styles.followButtonPrimary,
            pressed && (isFollowing ? styles.followingButtonPressed : styles.followButtonPressed),
          ]}
        >
          {isPending ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? searchColors.followingText : searchColors.followText}
            />
          ) : (
            <Text
              style={[
                styles.followButtonText,
                isFollowing ? styles.followingButtonText : styles.followButtonPrimaryText,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  cardContainerPressed: {
    backgroundColor: '#F8FAFC',
  },
  displayName: {
    color: searchColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  followButton: {
    alignItems: 'center',
    borderRadius: searchRadii.button,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followButtonPrimary: {
    backgroundColor: searchColors.followBg,
  },
  followButtonPrimaryText: {
    color: searchColors.followText,
  },
  followButtonPressed: {
    backgroundColor: searchColors.followBgPressed,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  followersText: {
    color: searchColors.caption,
    fontSize: 13,
    fontWeight: '400',
  },
  followingButton: {
    backgroundColor: searchColors.followingBg,
    borderColor: searchColors.followingBorder,
    borderWidth: 1,
  },
  followingButtonPressed: {
    backgroundColor: searchColors.followingBgPressed,
  },
  followingButtonText: {
    color: searchColors.followingText,
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
    fontSize: 13,
    marginTop: 1,
  },
});
