import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useAppNavigation } from '../../navigation/useAppNavigation';
import { clayColors } from '../../theme/colors';
import { ClayText } from '../ui/ClayText';
import { ListFooter } from './ListFooter';
import { LoadError } from './LoadError';
import { ScreenHeader } from './ScreenHeader';
import { UserRow, type UserRowUser } from './UserRow';

type UserPage = { hasMore: boolean; users: UserRowUser[] };

type UserListScreenProps = {
  emptyText: string;
  /** Must be stable (`useCallback`); changing it reloads the list. */
  fetchPage: (page: number) => Promise<UserPage>;
  /** Rendered between the title bar and the list (e.g. tabs). */
  header?: ReactNode;
  /** Replaces the follow button on each row. */
  renderRight?: (user: UserRowUser, reload: () => void) => ReactNode;
  title: string;
};

/** A titled, paginated list of users: followers, following, likers, blocked. */
export function UserListScreen({ emptyText, fetchPage, header, renderRight, title }: UserListScreenProps) {
  const navigation = useAppNavigation();
  const [users, setUsers] = useState<UserRowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const pageRef = useRef(1);

  const loadFirstPage = useCallback(async () => {
    try {
      const page = await fetchPage(1);

      pageRef.current = 1;
      setUsers(page.users);
      setHasMore(page.hasMore);
      setLoadFailed(false);
      setLoadMoreFailed(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      setLoadFailed(true);
    }
  }, [fetchPage]);

  useEffect(() => {
    setIsLoading(true);
    void loadFirstPage().finally(() => setIsLoading(false));
  }, [loadFirstPage]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFirstPage();
    setIsRefreshing(false);
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreFailed(false);

    try {
      const page = await fetchPage(pageRef.current + 1);

      pageRef.current += 1;
      setHasMore(page.hasMore);
      setUsers((current) => {
        const seen = new Set(current.map((user) => user.id));

        return [...current, ...page.users.filter((user) => !seen.has(user.id))];
      });
    } catch {
      setLoadMoreFailed(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoading, isLoadingMore]);

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title={title} />
      {header}
      {isLoading ? (
        <ActivityIndicator color={clayColors.primary} size="large" style={styles.loading} />
      ) : loadFailed && users.length === 0 ? (
        <LoadError onRetry={refresh} />
      ) : (
        <FlatList
          data={users}
          initialNumToRender={12}
          windowSize={7}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <ClayText style={styles.empty} variant="body">
              {emptyText}
            </ClayText>
          }
          ListFooterComponent={
            <ListFooter
              hasItems={users.length > 0}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loadMoreFailed={loadMoreFailed}
              onRetry={loadMore}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              colors={[clayColors.primary]}
              onRefresh={refresh}
              refreshing={isRefreshing}
              tintColor={clayColors.primary}
            />
          }
          renderItem={({ item }) => (
            <UserRow
              onPress={navigation.openProfile}
              right={renderRight?.(item, refresh)}
              user={item}
            />
          )}
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
  empty: {
    color: clayColors.caption,
    paddingHorizontal: 32,
    paddingVertical: 48,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
  },
});
