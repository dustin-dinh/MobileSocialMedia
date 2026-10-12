import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { clayDimensions } from '../../../theme/spacing';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { fontFamilies } from '../../../theme/typography';
import { searchService } from '../services/searchService';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  // ── Fetch users ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const data = await loadUsers(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error('Failed to search users:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng. Vui lòng thử lại.');
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

      Alert.alert('Thông báo', 'Không thể cập nhật theo dõi lúc này. Vui lòng thử lại sau.');
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

    // The empty state already prompts for a query when there are no suggestions.
    if (!hasQuery && users.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionHeader}>
        <ClayText variant="heading" style={styles.sectionTitle}>
          {hasQuery ? 'Kết quả tìm kiếm' : 'Gợi ý cho bạn'}
        </ClayText>
        <ClayText variant="caption" style={styles.sectionSubtitle}>
          {hasQuery
            ? `${users.length} người dùng phù hợp`
            : 'Những người bạn có thể quan tâm'}
        </ClayText>
      </View>
    );
  }, [debouncedQuery, isLoading, users.length]);

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Top Header & Search Bar ────────────────────────── */}
      <View style={styles.headerContainer}>
        <ClayText variant="title" style={styles.screenTitle}>
          Tìm kiếm
        </ClayText>

        <ClaySurface variant="inset" style={styles.searchBar}>
          <ClayIcon name="MagnifyingGlass" size={20} color={clayColors.caption} />

          <TextInput
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
              color={searchColors.primary}
              style={styles.loaderIcon}
            />
          ) : hasQueryInput ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search query"
              hitSlop={8}
              onPress={handleClearQuery}
              style={styles.clearButton}
            >
              <ClayIcon name="X" size={14} weight="bold" color={clayColors.caption} />
            </Pressable>
          ) : null}
        </ClaySurface>

        {hasQueryInput ? (
          <View style={styles.modeRow}>
            {(['users', 'posts'] as const).map((item) => {
              const isActive = item === mode;

              return (
                <Pressable
                  accessibilityLabel={item === 'users' ? 'Tìm người dùng' : 'Tìm bài viết'}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={item}
                  onPress={() => setMode(item)}
                  style={[styles.modeButton, isActive && styles.modeButtonActive]}
                >
                  <ClayText
                    variant="caption"
                    style={isActive ? styles.modeTextActive : undefined}
                  >
                    {item === 'users' ? 'Người dùng' : 'Bài viết'}
                  </ClayText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* ── List Content ────────────────────────────────────── */}
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
        ListEmptyComponent={
          isLoading ? (
            <SearchSkeleton />
          ) : debouncedQuery.trim().length > 0 ? (
            <SearchEmptyState query={debouncedQuery} onClear={handleClearQuery} />
          ) : null
        }
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

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    backgroundColor: clayColors.canvas,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginLeft: 8,
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    width: 24,
  },
  headerContainer: {
    backgroundColor: searchColors.surface,
    borderBottomColor: searchColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    backgroundColor: clayColors.canvas,
    flexGrow: 1,
    paddingBottom: 96,
  },
  loaderIcon: {
    marginLeft: 8,
  },
  modeButton: {
    alignItems: 'center',
    backgroundColor: searchColors.inputBg,
    borderRadius: searchRadii.input,
    flex: 1,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
  modeButtonActive: {
    backgroundColor: clayColors.primarySoft,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modeTextActive: {
    color: clayColors.primary,
    fontFamily: fontFamilies.bold,
  },
  screen: {
    backgroundColor: searchColors.surface,
    flex: 1,
  },
  screenTitle: {
    marginBottom: 12,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: searchColors.inputBg,
    borderRadius: searchRadii.input,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: searchColors.text,
    fontFamily: fontFamilies.regular,
    flex: 1,
    fontSize: 15,
    height: '100%',
    marginLeft: 10,
    paddingVertical: 0,
  },
  sectionHeader: {
    backgroundColor: searchColors.surface,
    borderBottomColor: searchColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionSubtitle: {
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
  },
});
