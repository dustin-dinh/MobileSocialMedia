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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import type { MainTabParamList } from '../../../navigation/types';
import { useAuthSession } from '../../auth/authSession';
import { CommentModal } from '../../comment/components/CommentModal';
import { PostCard } from '../../feed/components/PostCard';
import { feedEvents } from '../../feed/feedEvents';
import { feedColors, feedSpacing } from '../../feed/feedTheme';
import { feedService } from '../../feed/services/feedService';
import type { Post } from '../../feed/types';
import { EditProfileModal } from '../components/EditProfileModal';
import { ProfileEmptyPosts } from '../components/ProfileEmptyPosts';
import { ProfileHeader } from '../components/ProfileHeader';
import { profileColors } from '../profileTheme';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types';

type ProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();
  const isMountedRef = useRef(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // ── Load profile + posts ──────────────────────────────────────────────
  const loadProfileData = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const [profileResult, postsResult] = await Promise.all([
        profileService.getCurrentUserProfile(user),
        profileService.getUserPosts(user),
      ]);

      if (isMountedRef.current) {
        setProfile(profileResult);
        setPosts(postsResult.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      await loadProfileData();

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    };

    void init();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadProfileData]);

  // ── Listen for new posts from CreateScreen ────────────────────────────
  useEffect(() => {
    const unsubscribe = feedEvents.on('postCreated', (newPost) => {
      if (user && newPost.author.id === user.id) {
        setPosts((current) => [newPost, ...current]);
        setProfile((current) =>
          current ? { ...current, postsCount: current.postsCount + 1 } : current,
        );
      }
    });

    return unsubscribe;
  }, [user]);

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

    await loadProfileData();

    if (isMountedRef.current) {
      setIsRefreshing(false);
    }
  }, [loadProfileData]);

  // ── Post interactions ─────────────────────────────────────────────────
  const handleToggleLike = useCallback(async (post: Post) => {
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

  // ── Edit profile ──────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(
    async (data: { bio: string; displayName: string }) => {
      if (!user) {
        return;
      }

      const updated = await profileService.updateProfile(user, data);

      if (isMountedRef.current) {
        setProfile(updated);
      }
    },
    [user],
  );

  // ── Navigate to Create tab ────────────────────────────────────────────
  const handleCreatePost = useCallback(() => {
    navigation.navigate('Create');
  }, [navigation]);

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

  const renderHeader = useCallback(() => {
    if (!profile) {
      return null;
    }

    return (
      <ProfileHeader
        profile={profile}
        onEditProfile={() => setIsEditModalVisible(true)}
      />
    );
  }, [profile]);

  const renderEmpty = useCallback(
    () => <ProfileEmptyPosts onCreatePost={handleCreatePost} />,
    [handleCreatePost],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (isLoading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={profileColors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        contentContainerStyle={[
          posts.length === 0 ? styles.emptyContent : styles.listContent,
          { paddingBottom: 100 },
        ]}
        data={posts}
        initialNumToRender={6}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        maxToRenderPerBatch={6}
        refreshControl={
          <RefreshControl
            colors={[profileColors.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={profileColors.primary}
          />
        }
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={7}
      />

      <EditProfileModal
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveProfile}
        profile={profile}
        visible={isEditModalVisible}
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
    backgroundColor: profileColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: profileColors.background,
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: feedSpacing.cardGap,
  },
});

