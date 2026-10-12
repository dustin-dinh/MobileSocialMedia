import { useCallback } from 'react';

import { showToast } from '../../../components/common/toast';
import { UserListScreen } from '../../../components/common/UserListScreen';
import { ClayButton } from '../../../components/ui/ClayButton';
import { profileService } from '../../profile/services/profileService';

/** Users the viewer has blocked, each with an Unblock button. */
export function BlockedUsersScreen() {
  const fetchPage = useCallback(async (page: number) => {
    // The endpoint returns the whole list at once.
    const users = page === 1 ? await profileService.getBlockedUsers() : [];

    return { hasMore: false, users };
  }, []);

  return (
    <UserListScreen
      emptyText="Bạn chưa chặn ai."
      fetchPage={fetchPage}
      renderRight={(user, reload) => (
        <ClayButton
          accessibilityLabel={`Bỏ chặn ${user.displayName ?? user.username}`}
          onPress={() => {
            profileService
              .setBlocked(user.id, false)
              .then(() => {
                showToast('Đã bỏ chặn.');
                reload();
              })
              .catch(() => showToast('Không bỏ chặn được. Vui lòng thử lại.', 'error'));
          }}
          size="sm"
          title="Bỏ chặn"
          variant="secondary"
        />
      )}
      title="Người dùng đã chặn"
    />
  );
}
