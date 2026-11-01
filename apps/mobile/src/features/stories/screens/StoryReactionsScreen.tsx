import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LoadError } from '../../../components/common/LoadError';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayText } from '../../../components/ui/ClayText';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { tabularNums } from '../../../theme/typography';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { reactionOf } from '../../feed/reactions';
import { PeerAvatar } from '../../messages/components/PeerAvatar';
import { ANONYMOUS_USER_ID } from '../../messages/services/messageService';
import { storyService, type StoryReaction } from '../services/storyService';

type StoryReactionsScreenProps = NativeStackScreenProps<MainStackParamList, 'StoryReactions'>;

const ANONYMOUS_AUTHOR = {
  avatarUrl: null,
  displayName: 'Người ẩn danh',
  id: ANONYMOUS_USER_ID,
  username: 'nguoi_an_danh',
};

/** Who reacted to one of your stories. Viewers are never listed, only reactions. */
export function StoryReactionsScreen({ route }: StoryReactionsScreenProps) {
  const { storyId } = route.params;
  const navigation = useAppNavigation();
  const [reactions, setReactions] = useState<StoryReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setReactions(await storyService.getReactions(storyId));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const renderItem = ({ item }: { item: StoryReaction }) => {
    const author = item.user ?? ANONYMOUS_AUTHOR;
    const name = author.displayName?.trim() || author.username;
    const emoji = reactionOf(item.type)?.emoji ?? '';

    return (
      <Pressable
        accessibilityLabel={`${name} đã thả ${reactionOf(item.type)?.label ?? 'cảm xúc'}`}
        accessibilityRole={item.user ? 'button' : 'text'}
        disabled={!item.user}
        onPress={() => item.user && navigation.openProfile(item.user.id)}
        style={styles.row}
      >
        <PeerAvatar peer={author} size={40} />
        <View style={styles.rowText}>
          <ClayText numberOfLines={1} variant="body" weight="semiBold">
            {name}
          </ClayText>
          <ClayText style={styles.time} variant="meta">
            {formatTimeAgo(item.createdAt)}
          </ClayText>
        </View>
        <ClayText style={styles.emoji} variant="title">
          {emoji}
        </ClayText>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Cảm xúc về tin" />
      {isLoading ? (
        <ActivityIndicator color={clayColors.caption} style={styles.loading} />
      ) : loadFailed && reactions.length === 0 ? (
        <LoadError onRetry={load} />
      ) : (
        <FlatList
          data={reactions}
          initialNumToRender={15}
          keyExtractor={(item, index) => `${item.user?.id ?? 'anonymous'}-${item.createdAt}-${index}`}
          ListEmptyComponent={
            <ClayText style={styles.empty} variant="body">
              Chưa có ai thả cảm xúc về tin này.
            </ClayText>
          }
          ListHeaderComponent={
            <View style={styles.summary}>
              <ClayText style={tabularNums} variant="heading">
                {reactions.length} cảm xúc
              </ClayText>
              <ClayText variant="caption">
                Bạn chỉ thấy ai thả cảm xúc, không thấy ai đã xem tin.
              </ClayText>
            </View>
          }
          renderItem={renderItem}
          windowSize={9}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  // A reaction glyph is the row's data; it sits in the trailing slot.
  emoji: {
    lineHeight: 28,
  },
  empty: {
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.base,
  },
  loading: {
    marginTop: claySpacing.xxl,
  },
  // 40px avatar + 24px: a two-line row with media.
  row: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: 64,
    paddingHorizontal: clayDimensions.gutter,
  },
  rowText: {
    flex: 1,
  },
  summary: {
    gap: claySpacing.xs,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.md,
  },
  time: {
    ...tabularNums,
  },
});
