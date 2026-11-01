import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { ListFooter } from '../../../components/common/ListFooter';
import { showToast } from '../../../components/common/toast';
import { USE_MOCK_API } from '../../../config/runtime';
import { useDebounce } from '../../../hooks/useDebounce';
import type { MainTabParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { CommentModal } from '../../comment/components/CommentModal';
import { PostCard } from '../../feed/components/PostCard';
import { feedEvents } from '../../feed/feedEvents';
import { usePostList } from '../../feed/hooks/usePostList';
import { feedService } from '../../feed/services/feedService';
import { postKey } from '../../feed/services/postMapper';
import type { Post } from '../../feed/types';
import { profileService } from '../../profile/services/profileService';
import { suggestionReason } from '../../profile/suggestionReason';
import { SearchEmptyState } from '../components/SearchEmptyState';
import { SearchSkeleton } from '../components/SearchSkeleton';
import { UserSearchCard } from '../components/UserSearchCard';
import { searchColors, searchRadii } from '../searchTheme';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { searchService, type TrendingHashtag } from '../services/searchService';
import type { SearchedUser } from '../types';

/** Adjust a follower total by one, leaving an unknown (null) total untouched. */
function shiftFollowersCount(count: number | null, delta: 1 | -1): number | null {
  return count === null ? null : Math.max(0, count + delta);
}

type SearchScreenProps = Partial<BottomTabScreenProps<MainTabParamList, 'Search'>>;
type SearchMode = 'posts' | 'users';

/**
 * Users for a query; with an empty query, people the viewer may know (the
 * mock layer already answers an empty query with suggestions).
 */
async function loadUsers(searchQuery: string): Promise<SearchedUser[]> {
  if (USE_MOCK_API || searchQuery.trim()) {
    return searchService.searchUsers(searchQuery);
  }

  const suggestions = await profileService.getSuggestions();

  return suggestions.map((user) => ({
    avatarUrl: user.avatarUrl,
    bio: suggestionReason(user),
    displayName: user.displayName,
    followersCount: null,
    id: user.id,
    isFollowing: user.isFollowing,
    username: user.username,
  }));
}

export function SearchScreen({ route }: SearchScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [mode, setMode] = useState<SearchMode>('users');
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // A tapped hashtag opens this tab with the query pre-filled, on the Posts tab.
  const routeQuery = route?.params?.query;

  useEffect(() => {
    if (routeQuery) {
      setQuery(routeQuery);
      setMode('posts');
    }
  }, [routeQuery]);

  const fetchPostPage = useCallback(
    (page: number) => feedService.searchPosts(mode === 'posts' ? debouncedQuery : '', page),
    [debouncedQuery, mode],
  );
  const postList = usePostList(fetchPostPage);

  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usersFailed, setUsersFailed] = useState(false);
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);

  // Best effort: the screen works the same without the trending list.
  useEffect(() => {
    searchService.getTrendingHashtags().then(setTrending).catch(() => undefined);
  }, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  // ── Fetch users ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const data = await loadUsers(searchQuery);
      setUsers(data);
      setUsersFailed(false);
    } catch (error) {
      console.error('Failed to search users:', error);
      // Shown inside the list with a retry, not as a toast.
      setUsers([]);
      setUsersFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search on debounced query change
  useEffect(() => {
    void fetchUsers(debouncedQuery);
  }, [debouncedQuery, fetchUsers]);

  // Follows made on other screens (a profile, a list) show up here too.
  useEffect(
    () =>
      feedEvents.on('followChanged', ({ isFollowing, userId }) => {
        setUsers((current) =>
          current.map((item) =>
            item.id === userId && item.isFollowing !== isFollowing
              ? {
                  ...item,
                  followersCount: shiftFollowersCount(item.followersCount, isFollowing ? 1 : -1),
                  isFollowing,
                }
              : item,
          ),
        );
      }),
    [],
  );

  // ── Handle Clear ───────────────────────────────────────────────────────
  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  // ── Pull to refresh ────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await loadUsers(debouncedQuery);
      setUsers(data);
    } catch (error) {
      console.error('Refresh search failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [debouncedQuery]);

  // ── Optimistic Toggle Follow ───────────────────────────────────────────
  const handleToggleFollow = useCallback(async (targetUser: SearchedUser) => {
    const userId = targetUser.id;
    const previousFollowing = targetUser.isFollowing;
    const nextFollowing = !previousFollowing;

    // 1. Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            followersCount: shiftFollowersCount(u.followersCount, nextFollowing ? 1 : -1),
            isFollowing: nextFollowing,
          };
        }
        return u;
      }),
    );

    // 2. Mark this user action as pending
    setPendingFollowIds((prev) => new Set(prev).add(userId));

    // 3. Call API
    try {
      const updatedStatus = await searchService.toggleFollowUser(userId, previousFollowing);

      // Re-sync with actual server response
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: updatedStatus } : u)),
      );
    } catch (error) {
      console.error('Toggle follow failed:', error);

      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              followersCount: shiftFollowersCount(u.followersCount, previousFollowing ? 1 : -1),
              isFollowing: previousFollowing,
            };
          }
          return u;
        }),
      );

      showToast('Không thể cập nhật theo dõi lúc này. Vui lòng thử lại sau.', 'error');
    } finally {
      setPendingFollowIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, []);

  // ── List Header ────────────────────────────────────────────────────────
  const renderListHeader = useCallback(() => {
    if (isLoading) {
      return null;
    }

    const hasQuery = debouncedQuery.trim().length > 0;

    // Trending hashtags as figures: the tag on the left, its post count right-aligned.
    const trendingSection =
      !hasQuery && trending.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ClayText level={2} variant="heading">
              Xu hướng
            </ClayText>
          </View>
          <View style={styles.block}>
            {trending.map((item, index) => (
              <Pressable
                accessibilityLabel={`Xem bài viết có hashtag ${item.tag}`}
                accessibilityRole="button"
                key={item.tag}
                onPress={() => {
                  setQuery(`#${item.tag}`);
                  setMode('posts');
                }}
                style={({ pressed }) => [
                  styles.trendingRow,
                  index > 0 && styles.rowRule,
                  pressed && styles.rowPressed,
                ]}
              >
                <ClayText numberOfLines={1} style={styles.trendingTag} variant="body">
                  #{item.tag}
                </ClayText>
                <ClayText style={styles.trendingCount} variant="caption">
                  {item.postsCount} bài viết
                </ClayText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null;

    // The empty state already prompts for a query when there are no suggestions.
    if (!hasQuery && users.length === 0) {
      return trendingSection;
    }

    return (
      <>
        {trendingSection}
        <View style={[styles.section, styles.sectionHeader]}>
          <ClayText level={2} variant="heading">
            {hasQuery ? 'Người dùng' : 'Gợi ý cho bạn'}
          </ClayText>
          <ClayText style={styles.sectionSubtitle} variant="caption">
            {hasQuery ? `${users.length} người phù hợp` : 'Những người bạn có thể quen'}
          </ClayText>
        </View>
      </>
    );
  }, [debouncedQuery, isLoading, trending, users.length]);

  const renderItem = useCallback(
    ({ item }: { item: SearchedUser }) => (
      <UserSearchCard
        user={item}
        isPending={pendingFollowIds.has(item.id)}
        onPressUser={(target) => navigation.openProfile(target.id)}
        onToggleFollow={handleToggleFollow}
      />
    ),
    [handleToggleFollow, navigation, pendingFollowIds],
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPressComment={setActiveCommentPost}
        onToggleLike={postList.toggleLike}
        onToggleSave={postList.toggleSave}
      />
    ),
    [postList.toggleLike, postList.toggleSave],
  );

  const keyExtractor = useCallback((item: SearchedUser) => item.id, []);

  const hasQueryInput = query.length > 0;
  const isDebouncing = query !== debouncedQuery;

  const usersEmpty = isLoading ? (
    <SearchSkeleton />
  ) : usersFailed ? (
    <View style={styles.errorBlock}>
      <ClayText style={styles.errorText} variant="body">
        Không tải được danh sách người dùng.
      </ClayText>
      <ClayButton
        accessibilityLabel="Thử tải lại danh sách người dùng"
        onPress={() => void fetchUsers(debouncedQuery)}
        style={styles.retryButton}
        title="Thử lại"
        variant="secondary"
      />
    </View>
  ) : debouncedQuery.trim().length > 0 ? (
    <SearchEmptyState query={debouncedQuery} onClear={handleClearQuery} />
  ) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Title, search field and the users/posts switch ─────── */}
      <View style={styles.headerContainer}>
        <ClayText level={1} variant="title" style={styles.screenTitle}>
          Tìm kiếm
        </ClayText>

        <View style={styles.searchBar}>
          <ClayIcon name="MagnifyingGlass" size={16} color={clayColors.caption} />

          <TextInput
            accessibilityLabel="Tìm kiếm"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
            onChangeText={setQuery}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Tìm người dùng, bài viết, #hashtag..."
            placeholderTextColor={searchColors.placeholder}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />

          {isDebouncing || isLoading ? (
            <ActivityIndicator
              size="small"
              color={clayColors.caption}
              style={styles.loaderIcon}
            />
          ) : hasQueryInput ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xoá nội dung tìm kiếm"
              hitSlop={8}
              onPress={handleClearQuery}
              style={styles.clearButton}
            >
              <ClayIcon name="X" size={16} color={clayColors.caption} />
            </Pressable>
          ) : null}
        </View>

        {hasQueryInput ? (
          <View accessibilityRole="tablist" style={styles.segmented}>
            {(['users', 'posts'] as const).map((item) => {
              const isActive = item === mode;

              return (
                <Pressable
                  accessibilityLabel={item === 'users' ? 'Tìm người dùng' : 'Tìm bài viết'}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={item}
                  onPress={() => setMode(item)}
                  style={[styles.segment, isActive && styles.segmentActive]}
                >
                  <ClayText
                    variant="caption"
                    style={[styles.segmentText, isActive && styles.segmentTextActive]}
                  >
                    {item === 'users' ? 'Người dùng' : 'Bài viết'}
                  </ClayText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* ── Results ─────────────────────────────────────────────── */}
      {mode === 'posts' && hasQueryInput ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={postList.isLoading ? [] : postList.posts}
          initialNumToRender={6}
          windowSize={7}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={postKey}
          ListEmptyComponent={
            postList.isLoading || isDebouncing ? (
              <SearchSkeleton />
            ) : postList.loadFailed ? (
              <View style={styles.errorBlock}>
                <ClayText style={styles.errorText} variant="body">
                  Không tải được bài viết.
                </ClayText>
                <ClayButton
                  accessibilityLabel="Thử tải lại bài viết"
                  onPress={() => void postList.refresh()}
                  style={styles.retryButton}
                  title="Thử lại"
                  variant="secondary"
                />
              </View>
            ) : (
              <SearchEmptyState query={debouncedQuery} onClear={handleClearQuery} />
            )
          }
          ListFooterComponent={
            <ListFooter
              hasItems={postList.posts.length > 0}
              hasMore={postList.hasMore}
              isLoadingMore={postList.isLoadingMore}
              loadMoreFailed={postList.loadMoreFailed}
              onRetry={postList.loadMore}
            />
          }
          onEndReached={postList.loadMore}
          onEndReachedThreshold={0.5}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={isLoading ? [] : users}
          ItemSeparatorComponent={null}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={usersEmpty}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl
              colors={[searchColors.primary]}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
              tintColor={searchColors.primary}
            />
          }
          renderItem={renderItem}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const GUTTER = clayDimensions.gutter;

const styles = StyleSheet.create({
  block: {
    backgroundColor: searchColors.surface,
    borderBottomColor: searchColors.border,
    borderBottomWidth: 1,
    borderTopColor: searchColors.border,
    borderTopWidth: 1,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -claySpacing.md,
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  errorBlock: {
    paddingHorizontal: GUTTER,
    paddingVertical: claySpacing.xl,
  },
  errorText: {
    color: searchColors.textSecondary,
  },
  headerContainer: {
    backgroundColor: searchColors.background,
    borderBottomColor: searchColors.border,
    borderBottomWidth: 1,
    paddingBottom: claySpacing.md,
    paddingHorizontal: GUTTER,
    paddingTop: claySpacing.md,
  },
  listContent: {
    backgroundColor: searchColors.background,
    flexGrow: 1,
    paddingBottom: claySpacing.xl,
  },
  loaderIcon: {
    marginLeft: claySpacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: claySpacing.md,
  },
  rowPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  rowRule: {
    borderTopColor: clayColors.rule,
    borderTopWidth: 1,
  },
  screen: {
    backgroundColor: searchColors.background,
    flex: 1,
  },
  screenTitle: {
    marginBottom: claySpacing.md,
  },
  // A white field with a 1px control edge, as every input in the app.
  searchBar: {
    alignItems: 'center',
    backgroundColor: searchColors.surface,
    borderColor: clayColors.control,
    borderRadius: searchRadii.input,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: claySpacing.md,
  },
  searchInput: {
    color: searchColors.text,
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    marginLeft: claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget - 2,
    paddingVertical: 0,
  },
  section: {
    paddingTop: claySpacing.xl,
  },
  sectionHeader: {
    paddingBottom: claySpacing.sm,
    paddingHorizontal: GUTTER,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  // Users / posts: a segmented control as wide as the screen below 480px.
  segment: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  segmentActive: {
    backgroundColor: clayColors.primarySoft,
    borderRadius: searchRadii.input - 2,
  },
  segmentText: {
    color: searchColors.textSecondary,
  },
  segmentTextActive: {
    color: clayColors.primaryInk,
    fontFamily: fontFamilies.semiBold,
  },
  segmented: {
    backgroundColor: searchColors.surface,
    borderColor: clayColors.border,
    borderRadius: searchRadii.input,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: claySpacing.md,
    maxWidth: 480,
    padding: 3,
  },
  trendingCount: {
    ...tabularNums,
    color: searchColors.caption,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  trendingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: GUTTER,
  },
  trendingTag: {
    color: searchColors.text,
    flexShrink: 1,
    fontFamily: fontFamilies.semiBold,
  },
});
