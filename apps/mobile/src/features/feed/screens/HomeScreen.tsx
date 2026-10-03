import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentModal } from '../../comment/components/CommentModal';
import { ClayText } from '../../../components/ui/ClayText';
import { fontFamilies } from '../../../theme/typography';
import { FeedEmptyState } from '../components/FeedEmptyState';
import { PostCard } from '../components/PostCard';
import { feedColors, feedSpacing } from '../feedTheme';
import { feedEvents } from '../feedEvents';
import { feedService } from '../services/feedService';
import type { Post } from '../types';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const isMountedRef = useRef(true);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    const loadFeed = async () => {
      try {
        const response = await feedService.getFeed(1);

        if (isMountedRef.current) {
          setPosts(response.data);
        }
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadFeed();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Listen for new posts created from CreateScreen ─────────────────
  useEffect(() => {
    const unsubscribe = feedEvents.on('postCreated', (newPost) => {
      setPosts((current) => [newPost, ...current]);
    });

    return unsubscribe;
  }, []);

  // ── Listen for commentAdded events to sync commentsCount ─────────────
  useEffect(() => {
    const unsubscribe = feedEvents.on('commentAdded', ({ commentsCount, postId }) => {
      setPosts((current) =>
        current.map((p) => (p.id === postId ? { ...p, commentsCount } : p)),
      );
    });

    return unsubscribe;
  }, []);

  // ── Pull-to-refresh ───────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await feedService.getFeed(1);

      if (isMountedRef.current) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh feed:', error);
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // ── Interactions ──────────────────────────────────────────────────────
  const handleToggleLike = useCallback(async (post: Post) => {
    // Optimistic update
    setPosts((current) =>
      current.map((p) =>
        p.id === post.id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      ),
    );

    try {
      await feedService.toggleLike(post);
    } catch {
      // Revert on failure
      setPosts((current) =>
        current.map((p) => (p.id === post.id ? post : p)),
      );
    }
  }, []);

  const handleToggleSave = useCallback(async (post: Post) => {
    setPosts((current) =>
      current.map((p) =>
        p.id === post.id ? { ...p, isSaved: !p.isSaved } : p,
      ),
    );

    try {
      await feedService.toggleSave(post);
    } catch {
      setPosts((current) =>
        current.map((p) => (p.id === post.id ? post : p)),
      );
    }
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────
  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPressComment={setActiveCommentPost}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
      />
    ),
    [handleToggleLike, handleToggleSave],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  // ── Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={feedColors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ClayText variant="title" style={styles.headerTitle}>
          Mobile Social
        </ClayText>
      </View>

      <FlatList
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
        data={posts}
        keyExtractor={keyExtractor}
        ListEmptyComponent={FeedEmptyState}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            colors={[feedColors.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={feedColors.primary}
          />
        }
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <CommentModal
        onClose={() => setActiveCommentPost(null)}
        post={activeCommentPost}
        visible={!!activeCommentPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: feedColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: feedColors.background,
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  header: {
    alignItems: 'center',
    backgroundColor: feedColors.background,
    borderBottomColor: feedColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: feedColors.text,
    fontSize: 24,
    fontFamily: fontFamilies.extraBold,
    letterSpacing: -0.4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 96,
    paddingTop: feedSpacing.cardGap / 2,
  },
});
