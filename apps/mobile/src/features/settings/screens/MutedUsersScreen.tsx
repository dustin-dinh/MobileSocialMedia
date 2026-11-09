import { useCallback } from 'react';

import { UserListScreen } from '../../../components/common/UserListScreen';
import { ClayButton } from '../../../components/ui/ClayButton';
import { setUserMuted } from '../../profile/muteUser';
import { profileService } from '../../profile/services/profileService';

/** Users the viewer has muted, each with an Unmute button. */
export function MutedUsersScreen() {
  const fetchPage = useCallback(async (page: number) => {
    // The endpoint returns the whole list at once.
    const users = page === 1 ? await profileService.getMutedUsers() : [];

    return { hasMore: false, users };
  }, []);

  return (
    <UserListScreen
      emptyText="Bạn chưa tắt tiếng ai."
      fetchPage={fetchPage}
      renderRight={(user, reload) => (
        <ClayButton
          accessibilityLabel={`Bỏ tắt tiếng ${user.displayName ?? user.username}`}
          onPress={() => {
            void setUserMuted(user.id, false).then((done) => done && reload());
          }}
          size="sm"
          title="Bỏ tắt tiếng"
          variant="secondary"
        />
      )}
      title="Đã tắt tiếng"
    />
  );
}
