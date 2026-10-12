import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { UserListScreen } from '../../../components/common/UserListScreen';
import type { UserRowUser } from '../../../components/common/UserRow';
import { ClayText } from '../../../components/ui/ClayText';
import { USE_MOCK_API } from '../../../config/runtime';
import type { MainStackParamList } from '../../../navigation/types';
import { httpClient } from '../../../services/httpClient';
import { clayColors } from '../../../theme/colors';
import { claySpacing } from '../../../theme/spacing';
import { REACTIONS, reactionOf } from '../reactions';

type PostLikesScreenProps = NativeStackScreenProps<MainStackParamList, 'PostLikes'>;

type LikesResponse = {
  data: Array<UserRowUser & { reaction?: string }>;
  meta: { page: number; reactions?: Record<string, number>; totalPages: number };
};

/** People who reacted to a post, with the reaction each of them chose. */
export function PostLikesScreen({ route }: PostLikesScreenProps) {
  const { postId } = route.params;
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchPage = useCallback(
    async (page: number) => {
      if (USE_MOCK_API) {
        return { hasMore: false, users: [] };
      }

      const response = await httpClient.requestJson<LikesResponse>({
        method: 'GET',
        path: `posts/${postId}/likes?page=${page}&limit=20`,
      });

      setCounts(response.meta.reactions ?? {});

      return {
        hasMore: response.meta.page < response.meta.totalPages,
        users: response.data.map((user) => {
          const reaction = reactionOf(user.reaction);

          return {
            ...user,
            subtitle: reaction
              ? `${reaction.emoji} ${reaction.label} · @${user.username}`
              : undefined,
          };
        }),
      };
    },
    [postId],
  );

  const summary = REACTIONS.filter((reaction) => counts[reaction.type] > 0);

  return (
    <UserListScreen
      emptyText="Chưa có lượt thích nào."
      fetchPage={fetchPage}
      header={
        summary.length > 0 ? (
          <View style={styles.summary}>
            {summary.map((reaction) => (
              <ClayText key={reaction.type} variant="caption">
                {reaction.emoji} {counts[reaction.type]}
              </ClayText>
            ))}
          </View>
        ) : undefined
      }
      title="Lượt thích"
    />
  );
}

const styles = StyleSheet.create({
  summary: {
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: claySpacing.base,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.md,
  },
});
