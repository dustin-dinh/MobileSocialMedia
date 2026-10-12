import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadError } from '../../../components/common/LoadError';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { ClayText } from '../../../components/ui/ClayText';
import type { MainStackParamList } from '../../../navigation/types';
import { ApiError } from '../../../services/apiError';
import { clayColors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { CommentThread } from '../../comment/components/CommentThread';
import { PostCard } from '../components/PostCard';
import { feedEvents } from '../feedEvents';
import { feedSpacing } from '../feedTheme';
import { feedService } from '../services/feedService';
import type { Post } from '../types';

type PostDetailScreenProps = NativeStackScreenProps<MainStackParamList, 'PostDetail'>;

/**
 * One post with its full comment thread. Target of notifications, shared
 * links and taps on a post's text.
 */
export function PostDetailScreen({ navigation, route }: PostDetailScreenProps) {
  const { commentId, postId } = route.params;
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<'missing' | 'network' | null>(null);

  const loadPost = useCallback(async () => {
    try {
      setPost(await feedService.getPost(postId));
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError && (loadError.status === 404 || loadError.status === 403)
          ? 'missing'
          : 'network',
      );
    }
  }, [postId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  // Changes made from the card itself or from other screens.
  useEffect(() => {
    const unsubscribers = [
      feedEvents.on('postUpdated', (updated) => {
        if (updated.id === postId) {
          setPost(updated);
        }
      }),
      feedEvents.on('commentAdded', ({ commentsCount, postId: changedId }) => {
        if (changedId === postId) {
          setPost((current) => (current ? { ...current, commentsCount } : current));
        }
      }),
      feedEvents.on('postDeleted', ({ postId: deletedId }) => {
        if (deletedId === postId) {
          navigation.goBack();
        }
      }),
      feedEvents.on('postHidden', ({ postId: hiddenId }) => {
        if (hiddenId === postId) {
          navigation.goBack();
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [navigation, postId]);

  const toggle = useCallback(
    async (current: Post, optimistic: Post, request: (target: Post) => Promise<Post>) => {
      feedEvents.emitPostUpdated(optimistic);

      try {
        await request(current);
      } catch {
        feedEvents.emitPostUpdated(current);
        showToast('Không thực hiện được. Vui lòng thử lại.', 'error');
      }
    },
    [],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.goBack} title="Bài viết" />
      {error === 'missing' ? (
        <LoadError
          message="Bài viết đã bị xoá hoặc bạn không còn quyền xem."
          title="Bài viết không còn tồn tại"
        />
      ) : error === 'network' && !post ? (
        <LoadError onRetry={loadPost} />
      ) : !post ? (
        <ActivityIndicator color={clayColors.primary} size="large" style={styles.flex} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <CommentThread
            bottomInset={Math.max(insets.bottom, 12)}
            focusCommentId={commentId}
            header={
              <View style={styles.postWrap}>
                <PostCard
                  isDetail
                  onToggleLike={(target) =>
                    toggle(
                      target,
                      {
                        ...target,
                        isLiked: !target.isLiked,
                        likesCount: target.likesCount + (target.isLiked ? -1 : 1),
                      },
                      feedService.toggleLike,
                    )
                  }
                  onToggleSave={(target) =>
                    toggle(target, { ...target, isSaved: !target.isSaved }, feedService.toggleSave)
                  }
                  post={post}
                />
                {post.likesCount > 0 ? (
                  <ClayText
                    accessibilityRole="button"
                    onPress={() => navigation.push('PostLikes', { postId })}
                    style={styles.likesLink}
                    variant="caption"
                  >
                    {post.likesCount} lượt thích · xem danh sách
                  </ClayText>
                ) : null}
              </View>
            }
            post={post}
          />
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  likesLink: {
    color: clayColors.primary,
    fontFamily: fontFamilies.bold,
    paddingHorizontal: feedSpacing.cardPadding + 4,
    paddingVertical: 10,
  },
  postWrap: {
    paddingTop: feedSpacing.cardGap / 2,
  },
});
