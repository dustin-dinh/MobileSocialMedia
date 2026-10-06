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

import { useDebounce } from '../../../hooks/useDebounce';
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

export function SearchScreen() {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());

  // ── Fetch users ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const data = await searchService.searchUsers(searchQuery);
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

  // ── Handle Clear ───────────────────────────────────────────────────────
  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  // ── Pull to refresh ────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await searchService.searchUsers(debouncedQuery);
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
        onToggleFollow={handleToggleFollow}
      />
    ),
    [handleToggleFollow, pendingFollowIds],
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
            placeholder="Tìm kiếm người dùng, @username..."
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
      </View>

      {/* ── List Content ────────────────────────────────────── */}
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
