import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { UserListScreen } from '../../../components/common/UserListScreen';
import type { MainStackParamList } from '../../../navigation/types';
import { storyService } from '../services/storyService';

type StoryViewersScreenProps = NativeStackScreenProps<MainStackParamList, 'StoryViewers'>;

/** People who watched one of the signed-in user's stories. */
export function StoryViewersScreen({ route }: StoryViewersScreenProps) {
  const { storyId } = route.params;

  const fetchPage = useCallback(
    async () => ({ hasMore: false, users: await storyService.getViewers(storyId) }),
    [storyId],
  );

  return (
    <UserListScreen emptyText="Chưa có ai xem tin này." fetchPage={fetchPage} title="Người đã xem" />
  );
}
