import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LoadError } from '../../../components/common/LoadError';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
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
        <PeerAvatar peer={author} size={44} />
        <View style={styles.rowText}>
          <ClayText numberOfLines={1} style={styles.name} variant="body">
            {name}
          </ClayText>
          <ClayText style={styles.time} variant="meta">
            {formatTimeAgo(item.createdAt)}
          </ClayText>
        </View>
        <ClayText style={styles.emoji} variant="heading">
          {emoji}
        </ClayText>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Cảm xúc về tin" />
      {isLoading ? (
        <ActivityIndicator color={clayColors.primary} style={styles.loading} />
      ) : loadFailed && reactions.length === 0 ? (
        <LoadError onRetry={load} />
      ) : (
        <FlatList
          contentContainerStyle={reactions.length === 0 ? styles.emptyContainer : undefined}
          data={reactions}
          initialNumToRender={15}
          keyExtractor={(item, index) => `${item.user?.id ?? 'anonymous'}-${item.createdAt}-${index}`}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ClayIcon color={clayColors.caption} name="Heart" size={40} />
              <ClayText style={styles.emptyText} variant="body">
                Chưa có ai thả cảm xúc. Ứng dụng không cho biết ai đã xem tin của bạn.
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
  emoji: {
    fontSize: 24,
  },
  empty: {
    alignItems: 'center',
    gap: claySpacing.md,
    paddingHorizontal: claySpacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: clayColors.caption,
    textAlign: 'center',
  },
  loading: {
    marginTop: 40,
  },
  name: {
    fontFamily: fontFamilies.semiBold,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.sm,
  },
  rowText: {
    flex: 1,
  },
  time: {
    color: clayColors.caption,
  },
});
