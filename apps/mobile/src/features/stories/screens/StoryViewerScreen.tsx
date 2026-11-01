import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { showToast } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { useAuthSession } from '../../auth/authSession';
import { REACTIONS, type ReactionType } from '../../feed/reactions';
import { anonymousErrorText } from '../../messages/anonymousErrors';
import { storyService, type Story, type StoryReactionMark } from '../services/storyService';

type StoryViewerScreenProps = NativeStackScreenProps<MainStackParamList, 'StoryViewer'>;

const IMAGE_DURATION_MS = 5_000;
const MAX_REPLY_LENGTH = 2000;
const FALLBACK_VIDEO_MS = 15_000;

function StoryVideo({ isPaused, url }: { isPaused: boolean; url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.play();
  });

  useEffect(() => {
    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, player]);

  return (
    <VideoView contentFit="contain" nativeControls={false} player={player} style={styles.media} />
  );
}

/**
 * Full-screen story player. Tap the right side for the next story, the left
 * side for the previous one, hold to pause. Stories advance on their own and
 * move on to the next person when one person's stories are finished.
 *
 * Your own story shows how many people reacted (never who viewed it). Someone
 * else's story has reactions and a reply box; both can be anonymous when the
 * owner allowed it on that story.
 */
export function StoryViewerScreen({ route }: StoryViewerScreenProps) {
  const { groups, startIndex } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { user } = useAuthSession();

  // Start each person on the first story not seen yet.
  const firstUnseen = (index: number) =>
    Math.max(0, groups[index]?.stories.findIndex((story) => !story.isSeen) ?? 0);

  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(() => firstUnseen(startIndex));
  const [isHeld, setIsHeld] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [asAnonymous, setAsAnonymous] = useState(false);
  // Reactions given while watching, by story id (the feed copy is not refreshed meanwhile).
  const [reactions, setReactions] = useState<Record<string, StoryReactionMark | null>>({});
  const progress = useRef(new Animated.Value(0)).current;
  const remainingRef = useRef(0);

  const group = groups[groupIndex];
  const story: Story | undefined = group?.stories[storyIndex];
  const isOwn = group?.author.id === user?.id;
  // Typing a reply pauses the story so it does not move on under the keyboard.
  const isPaused = isHeld || isDeleteVisible || isTyping || replyText.length > 0;
  const canBeAnonymous = Boolean(story?.allowAnonymous);
  const myReaction = story ? (story.id in reactions ? reactions[story.id] : story.myReaction ?? null) : null;
  const duration =
    story?.type === 'VIDEO' ? story.durationMs || FALLBACK_VIDEO_MS : IMAGE_DURATION_MS;

  const goNext = useCallback(() => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      navigation.back();
    }
  }, [group, groupIndex, groups.length, navigation, storyIndex]);

  const goPrevious = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    } else {
      // Already at the very first story: start it again.
      progress.setValue(0);
      remainingRef.current = duration;
    }
  }, [duration, groupIndex, groups, progress, storyIndex]);

  // A new story: reset the bar and tell the server it was seen.
  useEffect(() => {
    progress.setValue(0);
    remainingRef.current = duration;

    if (story && !story.isSeen && !isOwn) {
      storyService.markViewed(story.id).catch(() => undefined);
    }
    // `duration` and `isOwn` follow from the story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // The bar runs while nothing pauses it, and remembers where it stopped.
  useEffect(() => {
    if (isPaused || !story) {
      return;
    }

    const animation = Animated.timing(progress, {
      duration: remainingRef.current,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });

    return () => {
      progress.stopAnimation((value) => {
        remainingRef.current = Math.max(0, (1 - value) * duration);
      });
    };
  }, [duration, goNext, isPaused, progress, story]);

  const handleDelete = async () => {
    if (!story) {
      return;
    }

    setIsDeleting(true);

    try {
      await storyService.remove(story.id);
      showToast('Đã xoá tin.');
      navigation.back();
    } catch {
      setIsDeleting(false);
      setIsDeleteVisible(false);
      showToast('Không xoá được tin. Vui lòng thử lại.', 'error');
    }
  };

  // Same reaction again removes it; another one (or switching anonymity) replaces it.
  const handleReact = (type: ReactionType) => {
    if (!story) {
      return;
    }

    const anonymous = canBeAnonymous && asAnonymous;
    const previous = myReaction;
    const isSame = previous?.type === type && previous.isAnonymous === anonymous;
    const next = isSame ? null : { isAnonymous: anonymous, type };

    setReactions((current) => ({ ...current, [story.id]: next }));

    (next ? storyService.react(story.id, type, anonymous) : storyService.removeReaction(story.id)).catch(
      (error) => {
        setReactions((current) => ({ ...current, [story.id]: previous }));
        showToast(anonymousErrorText(error, 'Không gửi được cảm xúc. Vui lòng thử lại.'), 'error');
      },
    );
  };

  const handleReply = async () => {
    const content = replyText.trim();

    if (!story || !content || isSending) {
      return;
    }

    const anonymous = canBeAnonymous && asAnonymous;

    setIsSending(true);

    try {
      await storyService.reply(story.id, content, anonymous);
      setReplyText('');
      showToast(anonymous ? 'Đã gửi trả lời ẩn danh.' : 'Đã gửi trả lời vào tin nhắn.');
    } catch (error) {
      showToast(anonymousErrorText(error, 'Không gửi được trả lời. Vui lòng thử lại.'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!group || !story) {
    return <View style={styles.container} />;
  }

  const name = group.author.displayName?.trim() || group.author.username;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {story.type === 'VIDEO' ? (
        <StoryVideo isPaused={isPaused} key={story.id} url={story.url} />
      ) : (
        <Image
          accessibilityLabel={`Tin của ${name}`}
          cachePolicy="memory-disk"
          contentFit="contain"
          key={story.id}
          source={{ uri: story.url }}
          style={styles.media}
        />
      )}

      {/* Tap zones sit under the header and the footer. */}
      <View style={styles.zones}>
        <Pressable
          accessibilityLabel="Tin trước"
          accessibilityRole="button"
          delayLongPress={200}
          onLongPress={() => setIsHeld(true)}
          onPress={goPrevious}
          onPressOut={() => setIsHeld(false)}
          style={styles.zoneLeft}
        />
        <Pressable
          accessibilityLabel="Tin tiếp theo"
          accessibilityRole="button"
          delayLongPress={200}
          onLongPress={() => setIsHeld(true)}
          onPress={goNext}
          onPressOut={() => setIsHeld(false)}
          style={styles.zoneRight}
        />
      </View>

      {/* Darkens the edges so the white controls stay readable on a bright picture. */}
      <View pointerEvents="none" style={styles.scrimTop} />
      <View pointerEvents="none" style={styles.scrimBottom} />

      <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + claySpacing.sm }]}>
        <View style={styles.bars}>
          {group.stories.map((item, index) => (
            <View key={item.id} style={styles.bar}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width:
                      index < storyIndex
                        ? '100%'
                        : index > storyIndex
                          ? '0%'
                          : progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <Pressable
            accessibilityLabel={`Xem trang cá nhân của ${name}`}
            accessibilityRole="button"
            onPress={() => navigation.openProfile(group.author.id)}
            style={styles.author}
          >
            <UserAvatar avatarUrl={group.author.avatarUrl} name={name} size={36} />
            <ClayText numberOfLines={1} style={styles.authorName} variant="body">
              {name}
            </ClayText>
            <ClayText style={styles.time} variant="meta">
              {formatTimeAgo(story.createdAt)}
            </ClayText>
          </Pressable>
          <Pressable
            accessibilityLabel="Đóng"
            accessibilityRole="button"
            hitSlop={8}
            onPress={navigation.back}
            style={styles.iconButton}
          >
            <ClayIcon color={clayColors.onPrimary} name="X" size={24} weight="bold" />
          </Pressable>
        </View>
      </View>

      {isOwn ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + claySpacing.md }]}>
          <Pressable
            accessibilityLabel={`${story.reactionsCount ?? 0} cảm xúc. Xem ai đã thả`}
            accessibilityRole="button"
            onPress={() => navigation.open('StoryReactions', { storyId: story.id })}
            style={styles.footerButton}
          >
            <ClayIcon color={clayColors.onPrimary} name="Heart" size={20} />
            <ClayText style={styles.footerText} variant="caption">
              {story.reactionsCount ?? 0} cảm xúc
            </ClayText>
            {story.allowAnonymous ? (
              <ClayText style={styles.footerHint} variant="meta">
                · cho phép ẩn danh
              </ClayText>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityLabel="Xoá tin này"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsDeleteVisible(true)}
            style={styles.iconButton}
          >
            <ClayIcon color={clayColors.onPrimary} name="Trash" size={22} />
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          pointerEvents="box-none"
          style={styles.replyArea}
        >
          <View style={[styles.replyFooter, { paddingBottom: insets.bottom + claySpacing.sm }]}>
            <View style={styles.reactionRow}>
              {REACTIONS.map((reaction) => {
                const isChosen = myReaction?.type === reaction.type;

                return (
                  <Pressable
                    accessibilityLabel={`${reaction.label}${isChosen ? ', đã chọn' : ''}`}
                    accessibilityRole="button"
                    key={reaction.type}
                    onPress={() => handleReact(reaction.type)}
                    style={[styles.reactionButton, isChosen && styles.reactionChosen]}
                  >
                    <ClayText style={styles.reactionEmoji} variant="heading">
                      {reaction.emoji}
                    </ClayText>
                  </Pressable>
                );
              })}
            </View>
            {myReaction?.isAnonymous ? (
              <ClayText style={styles.footerHint} variant="meta">
                Bạn đã thả cảm xúc ẩn danh
              </ClayText>
            ) : null}
            <View style={styles.replyRow}>
              {canBeAnonymous ? (
                <Pressable
                  accessibilityHint="Chủ tin sẽ thấy bạn là Người ẩn danh"
                  accessibilityLabel="Ẩn danh"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: asAnonymous }}
                  onPress={() => setAsAnonymous((current) => !current)}
                  style={[styles.anonymousChip, asAnonymous && styles.anonymousChipOn]}
                >
                  <ClayIcon
                    color={asAnonymous ? clayColors.text : clayColors.onPrimary}
                    name="Mask"
                    size={18}
                  />
                </Pressable>
              ) : null}
              <TextInput
                accessibilityLabel={asAnonymous && canBeAnonymous ? 'Trả lời ẩn danh' : `Trả lời ${name}`}
                maxLength={MAX_REPLY_LENGTH}
                onBlur={() => setIsTyping(false)}
                onChangeText={setReplyText}
                onFocus={() => setIsTyping(true)}
                onSubmitEditing={() => void handleReply()}
                placeholder={asAnonymous && canBeAnonymous ? 'Trả lời ẩn danh…' : `Trả lời ${name}…`}
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                returnKeyType="send"
                style={styles.replyInput}
                value={replyText}
              />
              <Pressable
                accessibilityLabel="Gửi trả lời"
                accessibilityRole="button"
                accessibilityState={{ disabled: !replyText.trim() || isSending }}
                disabled={!replyText.trim() || isSending}
                hitSlop={6}
                onPress={() => void handleReply()}
                style={[styles.iconButton, (!replyText.trim() || isSending) && styles.disabled]}
              >
                <ClayIcon color={clayColors.onPrimary} name="PaperPlaneTilt" size={22} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <ConfirmModal
        confirmLabel="Xoá"
        destructive
        icon="Trash"
        isBusy={isDeleting}
        message="Tin này sẽ bị xoá ngay và không thể khôi phục."
        onCancel={() => setIsDeleteVisible(false)}
        onConfirm={handleDelete}
        title="Xoá tin này?"
        visible={isDeleteVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  anonymousChip: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 22,
    borderWidth: 1,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  anonymousChipOn: {
    backgroundColor: clayColors.onPrimary,
    borderColor: clayColors.onPrimary,
  },
  author: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget,
  },
  authorName: {
    color: clayColors.onPrimary,
    flexShrink: 1,
    fontFamily: fontFamilies.bold,
  },
  bar: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    flex: 1,
    height: 3,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: clayColors.onPrimary,
    height: '100%',
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  container: {
    backgroundColor: clayColors.text,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: claySpacing.base,
    position: 'absolute',
    right: 0,
  },
  footerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget,
  },
  disabled: {
    opacity: 0.4,
  },
  footerHint: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  footerText: {
    color: clayColors.onPrimary,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: claySpacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  reactionButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  reactionChosen: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  reactionEmoji: {
    fontSize: 26,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  replyArea: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  replyFooter: {
    gap: claySpacing.sm,
    paddingHorizontal: claySpacing.base,
  },
  replyInput: {
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 22,
    borderWidth: 1,
    color: clayColors.onPrimary,
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.sm,
  },
  media: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrimBottom: {
    bottom: 0,
    experimental_backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0))',
    height: 140,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  scrimTop: {
    experimental_backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0))',
    height: 160,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  time: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  top: {
    left: 0,
    paddingHorizontal: claySpacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  zoneLeft: {
    flex: 1,
  },
  zoneRight: {
    flex: 2,
  },
  zones: {
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
