import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDebounce } from '../../../hooks/useDebounce';
import { SearchEmptyState } from '../components/SearchEmptyState';
import { SearchSkeleton } from '../components/SearchSkeleton';
import { UserSearchCard } from '../components/UserSearchCard';
import { searchColors, searchRadii } from '../searchTheme';
import { searchService } from '../services/searchService';
import type { SearchedUser } from '../types';

// ---------------------------------------------------------------------------
// SearchGlassIcon (Clean vector shape using Native Views)
// ---------------------------------------------------------------------------

function SearchGlassIcon({
  color = searchColors.searchIcon,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  const circleSize = Math.round(size * 0.68);

  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: circleSize / 2,
          borderWidth: 2,
          height: circleSize,
          left: 0,
          position: 'absolute',
          top: 0,
          width: circleSize,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 1,
          bottom: 1,
          height: size * 0.44,
          position: 'absolute',
          right: 1,
          transform: [{ rotate: '-45deg' }],
          width: 2.2,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main SearchScreen
// ---------------------------------------------------------------------------

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
            followersCount: nextFollowing
              ? u.followersCount + 1
              : Math.max(0, u.followersCount - 1),
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
              followersCount: previousFollowing
                ? u.followersCount + 1
                : Math.max(0, u.followersCount - 1),
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

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {hasQuery ? 'Kết quả tìm kiếm' : 'Gợi ý cho bạn'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {hasQuery
            ? `${users.length} người dùng phù hợp`
            : 'Những người bạn có thể quan tâm'}
        </Text>
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
        <Text style={styles.screenTitle}>Tìm kiếm</Text>

        <View style={styles.searchBar}>
          <SearchGlassIcon size={18} color={searchColors.searchIcon} />

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
              hitSlop={8}
              onPress={handleClearQuery}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.clearButtonPressed,
              ]}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── List Content ────────────────────────────────────── */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={isLoading ? [] : users}
        ItemSeparatorComponent={null}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
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
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    width: 20,
  },
  clearButtonPressed: {
    backgroundColor: '#CBD5E1',
  },
  clearButtonText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  headerContainer: {
    backgroundColor: searchColors.surface,
    borderBottomColor: searchColors.border,
    borderBottomWidth: 1,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    backgroundColor: searchColors.surface,
    flexGrow: 1,
    paddingBottom: 24,
  },
  loaderIcon: {
    marginLeft: 8,
  },
  screen: {
    backgroundColor: searchColors.surface,
    flex: 1,
  },
  screenTitle: {
    color: searchColors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: searchRadii.input,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: searchColors.text,
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
    color: searchColors.caption,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: searchColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
