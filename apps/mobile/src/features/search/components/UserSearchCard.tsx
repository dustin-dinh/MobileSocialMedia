import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { searchColors } from '../searchTheme';
import type { SearchedUser } from '../types';

const AVATAR_SIZE = 40;

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

export type UserSearchCardProps = {
  isPending?: boolean;
  onPressUser?: (user: SearchedUser) => void;
  onToggleFollow: (user: SearchedUser) => void;
  user: SearchedUser;
};

/**
 * One person in the search results or suggestions: avatar, name, a grey line
 * of who they are, and a tonal Follow button (an action repeated down a list).
 */
export const UserSearchCard = memo(function UserSearchCard({
  isPending = false,
  onPressUser,
  onToggleFollow,
  user,
}: UserSearchCardProps) {
  const handlePressFollow = useCallback(() => onToggleFollow(user), [onToggleFollow, user]);

  const displayName = user.displayName?.trim() || user.username;
  const isFollowing = user.isFollowing;
  // Line 3: the follower count as a figure first, then the bio; the bio is what gets cut.
  const details = [
    user.followersCount !== null ? `${formatCount(user.followersCount)} người theo dõi` : null,
    user.bio,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityLabel={`Xem trang cá nhân của @${user.username}`}
      accessibilityRole="button"
      onPress={() => onPressUser?.(user)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <UserAvatar avatarUrl={user.avatarUrl} name={displayName} size={AVATAR_SIZE} />

      <View style={styles.info}>
        <ClayText numberOfLines={1} style={styles.displayName} variant="body">
          {displayName}
        </ClayText>
        <ClayText numberOfLines={1} style={styles.meta} variant="caption">
          @{user.username}
        </ClayText>
        {details ? (
          <ClayText numberOfLines={1} style={styles.bio} variant="caption">
            {details}
          </ClayText>
        ) : null}
      </View>

      <ClayButton
        accessibilityLabel={
          isFollowing ? `Bỏ theo dõi @${user.username}` : `Theo dõi @${user.username}`
        }
        isLoading={isPending}
        label={isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
        labelStyle={styles.followLabel}
        onPress={handlePressFollow}
        style={styles.followButton}
        variant={isFollowing ? 'secondary' : 'tonal'}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  bio: {
    ...tabularNums,
    color: searchColors.textSecondary,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  displayName: {
    color: searchColors.text,
    fontFamily: fontFamilies.semiBold,
  },
  followButton: {
    minWidth: 104,
    paddingHorizontal: claySpacing.md,
  },
  followLabel: {
    fontSize: 13,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: claySpacing.md,
  },
  meta: {
    ...tabularNums,
    color: searchColors.caption,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  row: {
    alignItems: 'center',
    backgroundColor: searchColors.surface,
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.md,
  },
  rowPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
});
