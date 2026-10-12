import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { UserListScreen } from '../../../components/common/UserListScreen';
import { USE_MOCK_API } from '../../../config/runtime';
import type { MainStackParamList } from '../../../navigation/types';
import { followApi } from '../../../services/followApi';

type PostLikesScreenProps = NativeStackScreenProps<MainStackParamList, 'PostLikes'>;

/** People who liked a post. */
export function PostLikesScreen({ route }: PostLikesScreenProps) {
  const { postId } = route.params;
  const fetchPage = useCallback(
    async (page: number) =>
      USE_MOCK_API
        ? { hasMore: false, users: [] }
        : followApi.listUsers(`posts/${postId}/likes`, page),
    [postId],
  );

  return (
    <UserListScreen
      emptyText="Chưa có lượt thích nào."
      fetchPage={fetchPage}
      title="Lượt thích"
    />
  );
}
