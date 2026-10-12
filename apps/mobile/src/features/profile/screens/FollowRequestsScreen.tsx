import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { showToast } from '../../../components/common/toast';
import { UserListScreen } from '../../../components/common/UserListScreen';
import { ClayButton } from '../../../components/ui/ClayButton';
import { claySpacing } from '../../../theme/spacing';
import { profileService } from '../services/profileService';

/** People asking to follow the signed-in user's private account. */
export function FollowRequestsScreen() {
  const fetchPage = useCallback(
    async () => ({ hasMore: false, users: await profileService.getFollowRequests() }),
    [],
  );

  const answer = async (userId: string, accept: boolean, reload: () => void) => {
    try {
      await profileService.answerFollowRequest(userId, accept);
      reload();
    } catch {
      showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
    }
  };

  return (
    <UserListScreen
      emptyText="Không có yêu cầu theo dõi nào."
      fetchPage={fetchPage}
      renderRight={(user, reload) => (
        <View style={styles.actions}>
          <ClayButton
            accessibilityLabel={`Chấp nhận yêu cầu của @${user.username}`}
            onPress={() => void answer(user.id, true, reload)}
            size="sm"
            title="Chấp nhận"
            variant="primary"
          />
          <ClayButton
            accessibilityLabel={`Xoá yêu cầu của @${user.username}`}
            onPress={() => void answer(user.id, false, reload)}
            size="sm"
            title="Xoá"
            variant="secondary"
          />
        </View>
      )}
      title="Yêu cầu theo dõi"
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: claySpacing.sm,
  },
});
