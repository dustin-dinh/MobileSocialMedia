import { useCallback } from 'react';
import { View } from 'react-native';

import { showToast } from '../../../components/common/toast';
import { UserListScreen } from '../../../components/common/UserListScreen';
import { USE_MOCK_API } from '../../../config/runtime';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { followApi } from '../../../services/followApi';
import { useAuthSession } from '../../auth/authSession';
import { messageService } from '../services/messageService';

/** Pick someone you follow to start (or continue) a conversation with. */
export function NewMessageScreen() {
  const navigation = useAppNavigation();
  const { user } = useAuthSession();
  const userId = user?.id;

  const fetchPage = useCallback(
    async (page: number) =>
      USE_MOCK_API || !userId
        ? { hasMore: false, users: [] }
        : followApi.listUsers(`users/${userId}/following`, page),
    [userId],
  );

  const handlePick = async (peerId: string) => {
    try {
      const conversation = await messageService.open(peerId);

      // The picker has done its job: the chat takes its place in the stack.
      navigation.replace('Chat', { conversationId: conversation.id, peer: conversation.peer });
    } catch {
      showToast('Không mở được cuộc trò chuyện. Vui lòng thử lại.', 'error');
    }
  };

  return (
    <UserListScreen
      emptyText="Bạn chưa theo dõi ai. Hãy theo dõi một người để nhắn tin với họ."
      fetchPage={fetchPage}
      onPressUser={(peerId) => void handlePick(peerId)}
      // No follow button here: the whole row opens the chat.
      renderRight={() => <View />}
      title="Tin nhắn mới"
    />
  );
}
