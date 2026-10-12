import { memo, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuthSession } from '../../features/auth/authSession';
import { feedEvents } from '../../features/feed/feedEvents';
import { followApi } from '../../services/followApi';
import { clayColors } from '../../theme/colors';
import { clayDimensions, claySpacing } from '../../theme/spacing';
import { ClayButton } from '../ui/ClayButton';
import { ClayText } from '../ui/ClayText';
import { showToast } from './toast';
import { UserAvatar } from './UserAvatar';

export type UserRowUser = {
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  isFollowing?: boolean;
  username: string;
};

type UserRowProps = {
  onPress?: (userId: string) => void;
  /** Replaces the follow button (e.g. an "Unblock" action). */
  right?: ReactNode;
  /** Second line under the name; defaults to `@username`. */
  subtitle?: string;
  user: UserRowUser;
};

/**
 * One user in a list (followers, likers, suggestions, blocked...) with a
 * follow button that stays in sync with follows made on other screens.
 */
export const UserRow = memo(function UserRow({ onPress, right, subtitle, user }: UserRowProps) {
  const { user: currentUser } = useAuthSession();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [isPending, setIsPending] = useState(false);
  const name = user.displayName?.trim() || user.username;

  useEffect(() => {
    setIsFollowing(user.isFollowing ?? false);
  }, [user.isFollowing]);

  useEffect(
    () =>
      feedEvents.on('followChanged', (change) => {
        if (change.userId === user.id) {
          setIsFollowing(change.isFollowing);
        }
      }),
    [user.id],
  );

  const handleToggleFollow = async () => {
    setIsPending(true);

    try {
      await (isFollowing ? followApi.unfollow(user.id) : followApi.follow(user.id));
    } catch {
      showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Pressable
      accessibilityLabel={`Xem trang cá nhân của ${name}`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={() => onPress?.(user.id)}
      style={styles.container}
    >
      <UserAvatar avatarUrl={user.avatarUrl} name={name} />
      <View style={styles.text}>
        <ClayText numberOfLines={1} style={styles.name} variant="caption">
          {name}
        </ClayText>
        <ClayText numberOfLines={1} style={styles.subtitle} variant="meta">
          {subtitle ?? `@${user.username}`}
        </ClayText>
      </View>
      {right ??
        (user.id === currentUser?.id ? null : (
          <ClayButton
            accessibilityLabel={isFollowing ? `Bỏ theo dõi ${name}` : `Theo dõi ${name}`}
            disabled={isPending}
            loading={isPending}
            onPress={handleToggleFollow}
            size="sm"
            title={isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            variant={isFollowing ? 'secondary' : 'primary'}
          />
        ))}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: clayDimensions.minTouchTarget + 16,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.sm,
  },
  name: {
    color: clayColors.text,
    fontSize: 15,
  },
  subtitle: {
    color: clayColors.caption,
  },
  text: {
    flex: 1,
  },
});
