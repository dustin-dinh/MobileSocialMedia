import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ActionSheet } from '../../../components/common/ActionSheet';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ListFooter } from '../../../components/common/ListFooter';
import { LoadError } from '../../../components/common/LoadError';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { SHARE_LINKS_ENABLED } from '../../../config/links';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { ApiError } from '../../../services/apiError';
import { followApi } from '../../../services/followApi';
import { useAuthSession } from '../../auth/authSession';
import { CommentModal } from '../../comment/components/CommentModal';
import { PostCard } from '../../feed/components/PostCard';
import { feedEvents } from '../../feed/feedEvents';
import { feedSpacing } from '../../feed/feedTheme';
import { usePostList } from '../../feed/hooks/usePostList';
import { postKey } from '../../feed/services/postMapper';
import type { Post } from '../../feed/types';
import { anonymousErrorText } from '../../messages/anonymousErrors';
import { messageService } from '../../messages/services/messageService';
import { ReportModal } from '../../report/ReportModal';
import type { ReportTarget } from '../../report/reportService';
import { setUserMuted } from '../muteUser';
import { profileColors } from '../profileTheme';
import { profileService } from '../services/profileService';
import type { UpdateProfilePayload, UserProfile } from '../types';
import { EditProfileModal } from './EditProfileModal';
import { ProfileEmptyPosts } from './ProfileEmptyPosts';
import { ProfileHeader, type ProfileTab } from './ProfileHeader';

type ProfileViewProps = {
  /** Lets the host screen open the "more" menu of another user's profile. */
  menuVisible?: boolean;
  onCloseMenu?: () => void;
  /** Own profile only: jump to the Create tab from the empty state. */
  onCreatePost?: () => void;
  userId: string;
};

/**
 * A user's profile: header, Posts / Reposts tabs and the paginated list.
 * Used by the Profile tab (own profile) and by the UserProfile screen.
 */
export function ProfileView({ menuVisible = false, onCloseMenu, onCreatePost, userId }: ProfileViewProps) {
  const { updateUser, user } = useAuthSession();
  const navigation = useAppNavigation();
  const isOwn = user?.id === userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<'missing' | 'network' | null>(null);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [isActionPending, setIsActionPending] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isBlockConfirmVisible, setIsBlockConfirmVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // ── Profile ───────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      setProfile(await profileService.getProfile(userId));
      setProfileError(null);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfileError(error instanceof ApiError && error.status === 404 ? 'missing' : 'network');
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // ── Posts / reposts ───────────────────────────────────────────────────
  const fetchPage = useCallback(
    (page: number) =>
      tab === 'posts'
        ? profileService.getUserPosts(
            { avatarUrl: null, displayName: null, id: userId, username: '', ...(isOwn ? user : {}) },
            page,
          )
        : profileService.getUserReposts(userId, page),
    // `user` only feeds the mock branch; its identity changing must not reload the list.
    [isOwn, tab, userId],
  );
  const list = usePostList(fetchPage, {
    acceptCreated: (post) => isOwn && tab === 'posts' && post.author.id === userId,
  });

  // ── Keep the header in sync with changes made elsewhere ───────────────
  useEffect(() => {
    const unsubscribers = [
      feedEvents.on('postCreated', (post) => {
        if (post.author.id === userId) {
          setProfile((current) =>
            current ? { ...current, postsCount: current.postsCount + 1 } : current,
          );
        }
      }),
      feedEvents.on('postDeleted', () => {
        if (isOwn) {
          setProfile((current) =>
            current ? { ...current, postsCount: Math.max(0, current.postsCount - 1) } : current,
          );
        }
      }),
      feedEvents.on('followChanged', ({ isFollowing, userId: changedId }) => {
        setProfile((current) => {
          if (!current) {
            return current;
          }

          // Someone followed/unfollowed the profile being viewed.
          if (changedId === userId && current.isFollowing !== isFollowing) {
            return {
              ...current,
              followersCount: Math.max(0, current.followersCount + (isFollowing ? 1 : -1)),
              isFollowing,
            };
          }

          // The viewer followed someone while looking at their own profile.
          if (isOwn && changedId !== userId) {
            return {
              ...current,
              followingCount: Math.max(0, current.followingCount + (isFollowing ? 1 : -1)),
            };
          }

          return current;
        });
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [isOwn, userId]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadProfile(), list.refresh()]);
  }, [list.refresh, loadProfile]);

  // ── Follow / block ────────────────────────────────────────────────────
  const handleToggleFollow = useCallback(async () => {
    if (!profile) {
      return;
    }

    setIsActionPending(true);

    try {
      // `followApi` publishes `followChanged`, which updates the header above.
      // Unfollowing also withdraws a pending request to a private account.
      await (profile.isFollowing || profile.followRequested
        ? followApi.unfollow(userId)
        : followApi.follow(userId));

      // A private account answers with "requested", and unfollowing one hides
      // its posts: only a fresh profile knows the new state.
      if (profile.isPrivate) {
        await loadProfile();
        void list.refresh();
      }
    } catch {
      showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
    } finally {
      setIsActionPending(false);
    }
  }, [list.refresh, loadProfile, profile, userId]);

  const handleSetBlocked = useCallback(
    async (blocked: boolean) => {
      setIsBlockConfirmVisible(false);
      setIsActionPending(true);

      try {
        await profileService.setBlocked(userId, blocked);

        if (blocked) {
          // Their posts leave every list, and the follow state is gone on both sides.
          feedEvents.emitPostHidden({ authorId: userId });
          followApi.clearCache();
          showToast('Đã chặn người dùng này.');
          navigation.back();
        } else {
          showToast('Đã bỏ chặn.');
          await handleRefresh();
        }
      } catch {
        showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
      } finally {
        setIsActionPending(false);
      }
    },
    [handleRefresh, navigation, userId],
  );

  const handleMessage = useCallback(async () => {
    try {
      const conversation = await messageService.open(userId);

      navigation.open('Chat', { conversationId: conversation.id, peer: conversation.peer });
    } catch (error) {
      // "Only people they follow" or today's request limit: say so instead of "try again".
      showToast(anonymousErrorText(error, 'Không mở được cuộc trò chuyện. Vui lòng thử lại.'), 'error');
    }
  }, [navigation, userId]);

  // Only followers of someone who accepts anonymous messages can write to them anonymously.
  const handleMessageAnonymously = useCallback(async () => {
    try {
      const conversation = await messageService.openAnonymous(userId);

      navigation.open('Chat', { conversationId: conversation.id, peer: conversation.peer });
    } catch (error) {
      showToast(
        anonymousErrorText(error, 'Không mở được cuộc trò chuyện ẩn danh. Vui lòng thử lại.'),
        'error',
      );
    }
  }, [navigation, userId]);

  // ── Edit own profile ──────────────────────────────────────────────────
  const handleSaveProfile = useCallback(
    async (data: Pick<UpdateProfilePayload, 'avatar' | 'bio' | 'cover' | 'displayName'>) => {
      if (!user) {
        return;
      }

      const updated = await profileService.updateProfile(user, data);

      setProfile(updated);
      // The avatar and name appear all over the app: the session and every
      // loaded post by this user must show the new values.
      updateUser?.({
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
        coverUrl: updated.coverUrl,
        displayName: updated.displayName,
      });
      feedEvents.emitProfileUpdated({
        avatarUrl: updated.avatarUrl,
        displayName: updated.displayName,
        id: updated.id,
        username: updated.username,
      });
      showToast('Đã cập nhật hồ sơ.');
    },
    [updateUser, user],
  );

  // ── Render helpers ────────────────────────────────────────────────────
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

  if (profileError && !profile) {
    return profileError === 'missing' ? (
      <LoadError
        message="Tài khoản này không tồn tại hoặc bạn không thể xem."
        title="Không tìm thấy người dùng"
      />
    ) : (
      <LoadError onRetry={loadProfile} />
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={profileColors.primary} size="large" />
      </View>
    );
  }

  const displayName = profile.displayName ?? profile.username;
  // A private account shows nothing to people who do not follow it yet.
  const isLocked = Boolean(profile.isPrivate && !isOwn && !profile.isFollowing);

  const emptyState = list.isLoading ? (
    <ActivityIndicator color={profileColors.primary} style={styles.listLoading} />
  ) : list.loadFailed ? (
    <LoadError onRetry={list.refresh} />
  ) : isOwn && tab === 'posts' ? (
    <ProfileEmptyPosts onCreatePost={onCreatePost ?? (() => undefined)} />
  ) : isLocked && !profile.isBlocked ? (
    <View style={styles.lockedBlock}>
      <View style={styles.lockedTitleRow}>
        <ClayIcon color={profileColors.text} name="LockKey" size={16} />
        <ClayText level={2} variant="heading">
          Tài khoản riêng tư
        </ClayText>
      </View>
      <ClayText style={styles.lockedText} variant="body">
        {profile.followRequested
          ? `Đã gửi yêu cầu theo dõi. Bài viết sẽ hiện ở đây khi ${displayName} chấp nhận.`
          : `Chỉ người được ${displayName} chấp nhận mới xem được bài viết. Theo dõi để gửi yêu cầu.`}
      </ClayText>
    </View>
  ) : (
    <ClayText variant="body" style={styles.emptyText}>
      {profile.isBlocked
        ? 'Bạn đã chặn người dùng này.'
        : tab === 'posts'
          ? 'Chưa có bài viết nào.'
          : 'Chưa đăng lại bài viết nào.'}
    </ClayText>
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={list.isLoading ? [] : list.posts}
        initialNumToRender={6}
        windowSize={7}
        keyExtractor={postKey}
        ListEmptyComponent={emptyState}
        ListFooterComponent={
          <ListFooter
            hasItems={!list.isLoading && list.posts.length > 0}
            hasMore={list.hasMore}
            isLoadingMore={list.isLoadingMore}
            loadMoreFailed={list.loadMoreFailed}
            onRetry={list.loadMore}
          />
        }
        ListHeaderComponent={
          <ProfileHeader
            activeTab={tab}
            isActionPending={isActionPending}
            isOwn={isOwn}
            onChangeTab={setTab}
            onEditProfile={() => setIsEditModalVisible(true)}
            onMessage={isOwn || profile.isBlocked ? undefined : handleMessage}
            onOpenSettings={() => navigation.open('Settings')}
            onPressStat={
              isLocked ? undefined : (type) => navigation.open('FollowList', { type, userId })
            }
            onToggleFollow={handleToggleFollow}
            onUnblock={() => handleSetBlocked(false)}
            profile={profile}
          />
        }
        maxToRenderPerBatch={6}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            colors={[profileColors.primary]}
            onRefresh={handleRefresh}
            refreshing={list.isRefreshing}
            tintColor={profileColors.primary}
          />
        }
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {isOwn ? (
        <EditProfileModal
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleSaveProfile}
          profile={profile}
          visible={isEditModalVisible}
        />
      ) : (
        <>
          <ActionSheet
            onClose={() => onCloseMenu?.()}
            options={[
              ...(SHARE_LINKS_ENABLED
                ? [
                    {
                      icon: 'LinkSimple' as const,
                      key: 'copy',
                      label: 'Sao chép liên kết trang cá nhân',
                      onPress: () => {
                        void Clipboard.setStringAsync(`mobilesocial://u/${profile.id}`).then(() =>
                          showToast('Đã sao chép liên kết.'),
                        );
                      },
                    },
                  ]
                : []),
              ...(profile.acceptsAnonymousMessages && profile.isFollowing && !profile.isBlocked
                ? [
                    {
                      description: 'Người nhận không biết bạn là ai, trừ khi bạn tự tiết lộ',
                      icon: 'Mask',
                      key: 'anonymous',
                      label: 'Nhắn ẩn danh',
                      onPress: () => void handleMessageAnonymously(),
                    },
                  ]
                : []),
              ...(profile.isBlocked
                ? []
                : [
                    {
                      icon: profile.isMuted ? 'SpeakerHigh' : 'SpeakerSlash',
                      key: 'mute',
                      label: profile.isMuted ? 'Bỏ tắt tiếng' : 'Tắt tiếng',
                      onPress: () => {
                        const muted = !profile.isMuted;

                        void setUserMuted(profile.id, muted).then((done) => {
                          if (done) {
                            setProfile((current) => (current ? { ...current, isMuted: muted } : current));
                          }
                        });
                      },
                    },
                  ]),
              {
                destructive: true,
                icon: 'Flag',
                key: 'report',
                label: 'Báo cáo người dùng',
                onPress: () => setReportTarget({ id: profile.id, type: 'USER' }),
              },
              profile.isBlocked
                ? {
                    icon: 'Prohibit',
                    key: 'unblock',
                    label: 'Bỏ chặn',
                    onPress: () => void handleSetBlocked(false),
                  }
                : {
                    destructive: true,
                    icon: 'Prohibit',
                    key: 'block',
                    label: 'Chặn người dùng',
                    onPress: () => setIsBlockConfirmVisible(true),
                  },
            ]}
            title={`@${profile.username}`}
            visible={menuVisible}
          />
          <ConfirmModal
            confirmLabel="Chặn"
            destructive
            icon="Prohibit"
            isBusy={isActionPending}
            message={`${displayName} sẽ không thấy bài viết của bạn, không thể theo dõi hay tương tác với bạn. Hai bên sẽ ngừng theo dõi nhau.`}
            onCancel={() => setIsBlockConfirmVisible(false)}
            onConfirm={() => void handleSetBlocked(true)}
            title={`Chặn ${displayName}?`}
            visible={isBlockConfirmVisible}
          />
          <ReportModal onClose={() => setReportTarget(null)} target={reportTarget} />
        </>
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
  emptyText: {
    color: profileColors.caption,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.xxl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: claySpacing.xl,
  },
  lockedBlock: {
    backgroundColor: profileColors.surface,
    borderColor: profileColors.border,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    marginHorizontal: clayDimensions.gutter,
    marginTop: claySpacing.base,
    padding: claySpacing.base,
  },
  lockedText: {
    color: profileColors.textSecondary,
    marginTop: claySpacing.xs,
  },
  lockedTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.sm,
  },
  listLoading: {
    paddingVertical: 48,
  },
});
