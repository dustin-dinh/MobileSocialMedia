import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ActionSheet } from '../../../components/common/ActionSheet';
import { showToast } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useIsScreenFocused } from '../../../navigation/useIsScreenFocused';
import { ApiError } from '../../../services/apiError';
import { clayColors } from '../../../theme/colors';
import { claySpacing } from '../../../theme/spacing';
import { useAuthSession } from '../../auth/authSession';
import { validateVideo } from '../../reel/hooks/useVideoPicker';
import { storyService, type StoryGroup, type StoryMedia } from '../services/storyService';

const AVATAR_SIZE = 60;
const RING_SIZE = AVATAR_SIZE + 8;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * The row of stories above the home feed: the viewer's own entry first (with
 * a button to add one), then the people they follow, unseen ones first.
 */
export function StoriesTray({ refreshKey = 0 }: { refreshKey?: number }) {
  const navigation = useAppNavigation();
  const { user } = useAuthSession();
  const isFocused = useIsScreenFocused();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  // Picked and checked, waiting for the "allow anonymous interactions?" choice.
  const [pendingMedia, setPendingMedia] = useState<StoryMedia | null>(null);

  const load = useCallback(() => {
    // Best effort: the feed below works the same without the tray.
    storyService.getFeed().then(setGroups).catch(() => undefined);
  }, []);

  // Coming back from the viewer: the rings of what was just watched change.
  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused, load, refreshKey]);

  const handleAdd = useCallback(async () => {
    if (!user || isPosting) {
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showToast('Hãy cho phép ứng dụng truy cập thư viện để đăng tin.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    const asset = result.canceled ? null : result.assets[0];

    if (!asset) {
      return;
    }

    const isVideo = asset.type === 'video';
    const problem = isVideo
      ? validateVideo(asset)
      : (asset.fileSize ?? 0) > MAX_IMAGE_BYTES
        ? 'Ảnh nặng tối đa 10 MB.'
        : null;

    if (problem) {
      showToast(problem, 'error');
      return;
    }

    setPendingMedia({
      durationMs: asset.duration ?? undefined,
      isVideo,
      mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
      sizeBytes: asset.fileSize,
      uri: asset.uri,
    });
  }, [isPosting, user]);

  const publish = useCallback(async (media: StoryMedia, allowAnonymous: boolean) => {
    if (!user) {
      return;
    }

    setIsPosting(true);

    try {
      await storyService.create(media, user, allowAnonymous);
      showToast('Đã đăng tin. Tin sẽ hiển thị trong 24 giờ.');
      load();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'Không đăng được tin. Vui lòng thử lại.',
        'error',
      );
    } finally {
      setIsPosting(false);
    }
  }, [load, user]);

  const openViewer = (index: number) => navigation.open('StoryViewer', { groups, startIndex: index });

  const ownIndex = groups.findIndex((group) => group.author.id === user?.id);
  const others = groups.filter((group) => group.author.id !== user?.id);
  const ownName = user?.displayName?.trim() || user?.username || '';

  return (
    <>
      <FlatList
        contentContainerStyle={styles.content}
        data={others}
        horizontal
        keyExtractor={(item) => item.author.id}
        ListHeaderComponent={
          <View style={styles.item}>
            <Pressable
              accessibilityLabel={ownIndex >= 0 ? 'Xem tin của bạn' : 'Đăng tin mới'}
              accessibilityRole="button"
              onPress={() => (ownIndex >= 0 ? openViewer(ownIndex) : void handleAdd())}
              style={[styles.ring, ownIndex >= 0 ? styles.ringSeen : styles.ringNone]}
            >
              <UserAvatar avatarUrl={user?.avatarUrl ?? null} name={ownName} size={AVATAR_SIZE} />
              {isPosting ? (
                <View style={styles.posting}>
                  <ActivityIndicator color={clayColors.onPrimary} />
                </View>
              ) : null}
            </Pressable>
            <Pressable
              accessibilityLabel="Đăng tin mới"
              accessibilityRole="button"
              disabled={isPosting}
              hitSlop={10}
              onPress={() => void handleAdd()}
              style={styles.addBadge}
            >
              <ClayIcon color={clayColors.onPrimary} name="Plus" size={14} weight="bold" />
            </Pressable>
            <ClayText numberOfLines={1} style={styles.name} variant="meta">
              Tin của bạn
            </ClayText>
          </View>
        }
        renderItem={({ item }) => {
          const name = item.author.displayName?.trim() || item.author.username;

          return (
            <Pressable
              accessibilityLabel={`Xem tin của ${name}${item.hasUnseen ? ', có tin mới' : ''}`}
              accessibilityRole="button"
              onPress={() => openViewer(groups.indexOf(item))}
              style={styles.item}
            >
              <View style={[styles.ring, item.hasUnseen ? styles.ringUnseen : styles.ringSeen]}>
                <UserAvatar avatarUrl={item.author.avatarUrl} name={name} size={AVATAR_SIZE} />
              </View>
              <ClayText numberOfLines={1} style={styles.name} variant="meta">
                {name}
              </ClayText>
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
        style={styles.tray}
      />
      <ActionSheet
        onClose={() => setPendingMedia(null)}
        options={[
          {
            description: 'Người xem thả cảm xúc và trả lời bằng tên của họ',
            icon: 'Plus',
            key: 'normal',
            label: 'Đăng tin',
            onPress: () => pendingMedia && void publish(pendingMedia, false),
          },
          {
            description: 'Người xem có thể thả cảm xúc, trả lời mà bạn không biết họ là ai',
            icon: 'Mask',
            key: 'anonymous',
            label: 'Đăng và cho phép tương tác ẩn danh',
            onPress: () => pendingMedia && void publish(pendingMedia, true),
          },
        ]}
        title="Đăng tin 24 giờ"
        visible={pendingMedia !== null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  addBadge: {
    alignItems: 'center',
    backgroundColor: clayColors.primary,
    borderColor: clayColors.canvas,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    left: RING_SIZE - 12,
    position: 'absolute',
    top: RING_SIZE - 22,
    width: 22,
  },
  content: {
    gap: claySpacing.md,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.md,
  },
  item: {
    alignItems: 'center',
    width: RING_SIZE + 4,
  },
  name: {
    color: clayColors.textSecondary,
    marginTop: 4,
    maxWidth: RING_SIZE + 4,
  },
  posting: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: AVATAR_SIZE,
  },
  ring: {
    alignItems: 'center',
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    height: RING_SIZE,
    justifyContent: 'center',
    width: RING_SIZE,
  },
  ringNone: {
    borderColor: 'transparent',
  },
  ringSeen: {
    borderColor: clayColors.border,
  },
  ringUnseen: {
    borderColor: clayColors.primary,
  },
  tray: {
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
});
