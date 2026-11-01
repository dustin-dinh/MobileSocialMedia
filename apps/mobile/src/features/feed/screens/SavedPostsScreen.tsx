import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { ListFooter } from '../../../components/common/ListFooter';
import { LoadError } from '../../../components/common/LoadError';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { CommentModal } from '../../comment/components/CommentModal';
import { PostCard } from '../components/PostCard';
import { feedColors, feedSpacing } from '../feedTheme';
import { usePostList } from '../hooks/usePostList';
import { feedService } from '../services/feedService';
import { postKey } from '../services/postMapper';
import type { Post } from '../types';

const fetchSavedPage = (page: number) => feedService.getSavedPosts(page);

/** Posts the signed-in user has bookmarked. */
export function SavedPostsScreen() {
  const navigation = useAppNavigation();
  const list = usePostList(fetchSavedPage);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPressComment={setActiveCommentPost}
        onToggleLike={list.toggleLike}
        onToggleSave={list.toggleSave}
      />
    ),
    [list.toggleLike, list.toggleSave],
  );

  // A post unsaved here stays visible (dimmed state is the empty bookmark icon)
  // until the list is refreshed, so an accidental tap can be undone.
  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Bài viết đã lưu" />
      {list.isLoading ? (
        <ActivityIndicator color={feedColors.caption} size="large" style={styles.flex} />
      ) : list.loadFailed && list.posts.length === 0 ? (
        <LoadError onRetry={list.refresh} />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={list.posts}
          initialNumToRender={6}
          windowSize={7}
          keyExtractor={postKey}
          ListEmptyComponent={
            <ClayText style={styles.empty} variant="body">
              Chưa có bài viết đã lưu. Chọn Lưu bài viết trong menu của một bài viết để đọc lại ở đây.
            </ClayText>
          }
          ListFooterComponent={
            <ListFooter
              hasItems={list.posts.length > 0}
              hasMore={list.hasMore}
              isLoadingMore={list.isLoadingMore}
              loadMoreFailed={list.loadMoreFailed}
              onRetry={list.loadMore}
            />
          }
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              colors={[feedColors.primary]}
              onRefresh={list.refresh}
              refreshing={list.isRefreshing}
              tintColor={feedColors.primary}
            />
          }
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CommentModal
        onClose={() => setActiveCommentPost(null)}
        post={activeCommentPost}
        visible={!!activeCommentPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: feedColors.background,
    flex: 1,
  },
  empty: {
    backgroundColor: feedColors.surface,
    color: feedColors.textSecondary,
    paddingHorizontal: feedSpacing.cardPadding,
    paddingVertical: 24,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 48,
    paddingTop: feedSpacing.cardGap,
  },
});
