import { useCallback, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import type { MainTabParamList } from '../../../navigation/types';
import { useAuthSession } from '../../auth/authSession';
import { feedEvents } from '../../feed/feedEvents';
import { useVideoPicker } from '../../reel/hooks/useVideoPicker';
import { REEL_UPLOAD_AVAILABLE, reelService } from '../../reel/services/reelService';
import { useImagePicker } from '../hooks/useImagePicker';
import { postService } from '../services/postService';
import { ApiError } from '../../../services/apiError';
import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { showToast } from '../../../components/common/toast';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { fontFamilies } from '../../../theme/typography';
import { Image as ExpoImage } from 'expo-image';
import type { PostPrivacy } from '../../feed/types';
import { PostPrivacyModal, PrivacyPill } from '../components/PostPrivacyModal';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CONTENT_LENGTH = 500;
const CHAR_WARNING_THRESHOLD = 450;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AuthorAvatar({ avatarUrl, displayName, username }: {
  avatarUrl: string | null;
  displayName: string | null;
  username: string;
}) {
  const initials = (displayName ?? username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarHalo}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <ClayText variant="caption" style={styles.avatarInitials}>
            {initials}
          </ClayText>
        </View>
      )}
    </View>
  );
}

function MediaPreview({ images, onRemove }: {
  images: Array<{ uri: string }>;
  onRemove: (uri: string) => void;
}) {
  if (images.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mediaRow}
      style={styles.mediaScroll}
    >
      {images.map((img) => (
        <View key={img.uri} style={styles.mediaThumbnailWrap}>
          <Image source={{ uri: img.uri }} style={styles.mediaThumbnail} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            onPress={() => onRemove(img.uri)}
            style={styles.mediaRemoveBtn}
            hitSlop={6}
          >
            <ClayIcon name="X" size={13} weight="bold" color={clayColors.onPrimary} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// CreateScreen
// ---------------------------------------------------------------------------

type CreateScreenProps = BottomTabScreenProps<MainTabParamList, 'Create'>;

export function CreateScreen({ navigation }: CreateScreenProps) {
  const { user } = useAuthSession();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput | null>(null);

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscardVisible, setIsDiscardVisible] = useState(false);
  const [privacy, setPrivacy] = useState<PostPrivacy>('PUBLIC');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const {
    images,
    isPicking,
    pickImages,
    removeImage,
    clearImages,
    remainingSlots,
  } = useImagePicker();
  const { clearVideo, error: videoError, isPicking: isPickingVideo, pickVideo, video } =
    useVideoPicker();
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Derived state ───────────────────────────────────────────────────
  const charCount = content.length;
  const hasContent = content.trim().length > 0 || images.length > 0 || video !== null;
  const canSubmit = hasContent && !isSubmitting && charCount <= MAX_CONTENT_LENGTH;

  const charCountColor =
    charCount > MAX_CONTENT_LENGTH
      ? clayColors.error
      : charCount >= CHAR_WARNING_THRESHOLD
        ? clayColors.saved
        : clayColors.caption;

  // ── Handlers ────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    if (hasContent) {
      setIsDiscardVisible(true);
    } else {
      navigation.navigate('Home');
    }
  }, [hasContent, navigation]);

  const handleDiscard = useCallback(() => {
    setIsDiscardVisible(false);
    setContent('');
    clearImages();
    clearVideo();
    navigation.navigate('Home');
  }, [clearImages, clearVideo, navigation]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !user) {
      return;
    }

    setIsSubmitting(true);

    setUploadProgress(0);

    try {
      const newPost = video
        ? await reelService.uploadReel(
            { content: content.trim(), privacy, video },
            user,
            setUploadProgress,
          )
        : await postService.createPost(
            {
              content: content.trim(),
              mediaFiles: images,
              mediaUris: images.map((img) => img.uri),
              privacy,
            },
            user,
          );

      // Notify HomeScreen to prepend the new post
      feedEvents.emit('postCreated', newPost);

      // Reset form
      setContent('');
      clearImages();
      clearVideo();

      // Navigate to Home tab
      navigation.navigate('Home');
    } catch (error) {
      console.error('Failed to create post:', error);
      showToast(
        error instanceof ApiError ? error.message : 'Không đăng được bài viết. Vui lòng thử lại.',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, clearImages, clearVideo, content, images, navigation, privacy, user, video]);

  // ── Render ──────────────────────────────────────────────────────────
  const displayName = user?.displayName ?? user?.username ?? 'You';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel post"
          onPress={handleCancel}
          hitSlop={8}
          style={styles.headerSideBtn}
        >
          <ClayText variant="button" style={styles.cancelText}>
            Cancel
          </ClayText>
        </Pressable>

        <ClayText variant="heading" style={styles.headerTitle}>
          New Post
        </ClayText>

        <ClayButton
          accessibilityLabel="Publish post"
          variant="primary"
          label="Post"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          onPress={handleSubmit}
          style={styles.postButton}
        />
      </View>

      {/* ── Body ──────────────────────────────────────────── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Author bar */}
        <View style={styles.authorBar}>
          {user && (
            <AuthorAvatar
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              username={user.username}
            />
          )}
          <View style={styles.authorInfo}>
            <ClayText variant="heading" style={styles.authorName} numberOfLines={1}>
              {displayName}
            </ClayText>
            {user && (
              <ClayText variant="meta" style={styles.authorUsername}>
                @{user.username}
              </ClayText>
            )}
            <View style={styles.privacyPillWrap}>
              <PrivacyPill
                privacy={privacy}
                onPress={() => setIsPrivacyModalOpen(true)}
              />
            </View>
          </View>
        </View>

        {/* Text input in inset container */}
        <ClaySurface variant="inset" style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={clayColors.caption}
            multiline
            maxLength={MAX_CONTENT_LENGTH + 50}
            value={content}
            onChangeText={setContent}
            editable={!isSubmitting}
            autoFocus
            textAlignVertical="top"
          />
        </ClaySurface>

        {/* Media preview */}
        <MediaPreview images={images} onRemove={removeImage} />

        {video ? (
          <ClaySurface variant="inset" style={styles.videoChip}>
            <ClayIcon name="VideoCamera" size={22} weight="regular" color={clayColors.primary} />
            <View style={styles.videoChipText}>
              <ClayText variant="caption" numberOfLines={1}>
                {video.fileName ?? 'Video đã chọn'}
              </ClayText>
              <ClayText variant="meta">
                {Math.round(video.durationMs / 1000)} giây
                {video.sizeBytes ? ` · ${(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : ''}
              </ClayText>
              {isSubmitting ? (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${uploadProgress * 100}%` }]} />
                </View>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove video"
              disabled={isSubmitting}
              hitSlop={8}
              onPress={clearVideo}
              style={styles.toolbarButton}
            >
              <ClayIcon name="X" size={18} weight="bold" color={clayColors.caption} />
            </Pressable>
          </ClaySurface>
        ) : null}
        {videoError ? (
          <ClayText variant="caption" style={styles.videoError} accessibilityLiveRegion="polite">
            {videoError}
          </ClayText>
        ) : null}
      </ScrollView>

      {/* ── Bottom toolbar ────────────────────────────────── */}
      <View style={[styles.toolbar, { paddingBottom: 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={pickImages}
          disabled={remainingSlots <= 0 || isPicking || isSubmitting || video !== null}
          style={[
            styles.toolbarButton,
            (remainingSlots <= 0 || isSubmitting || video !== null) &&
              styles.toolbarButtonDisabled,
          ]}
          hitSlop={8}
        >
          <ClayIcon name="Image" size={24} weight="regular" color={clayColors.primary} />
          <ClayText
            variant="button"
            style={[
              styles.toolbarLabel,
              remainingSlots <= 0 && styles.toolbarLabelDisabled,
            ]}
          >
            Photo {images.length > 0 ? `${images.length}/4` : ''}
          </ClayText>
        </Pressable>

        {REEL_UPLOAD_AVAILABLE ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add video"
            onPress={pickVideo}
            disabled={images.length > 0 || isPickingVideo || isSubmitting}
            style={[
              styles.toolbarButton,
              (images.length > 0 || isSubmitting) && styles.toolbarButtonDisabled,
            ]}
            hitSlop={8}
          >
            <ClayIcon name="VideoCamera" size={24} weight="regular" color={clayColors.primary} />
            <ClayText variant="button" style={styles.toolbarLabel}>
              Video
            </ClayText>
          </Pressable>
        ) : null}

        <ClayText variant="caption" style={[styles.charCount, { color: charCountColor }]}>
          {charCount}/{MAX_CONTENT_LENGTH}
        </ClayText>
      </View>

      <PostPrivacyModal
        currentPrivacy={privacy}
        onClose={() => setIsPrivacyModalOpen(false)}
        onSelectPrivacy={(newPrivacy) => setPrivacy(newPrivacy)}
        visible={isPrivacyModalOpen}
      />

      <ConfirmModal
        cancelLabel="Viết tiếp"
        confirmLabel="Bỏ bài viết"
        destructive
        message="Nội dung bạn đang soạn sẽ không được lưu."
        onCancel={() => setIsDiscardVisible(false)}
        onConfirm={handleDiscard}
        title="Bỏ bài viết này?"
        visible={isDiscardVisible}
      />
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 42;

const styles = StyleSheet.create({
  authorBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
  },
  authorUsername: {
    marginTop: 1,
  },
  privacyPillWrap: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    justifyContent: 'center',
  },
  avatarHalo: {
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitials: {
    color: clayColors.primary,
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
  },
  cancelText: {
    color: clayColors.caption,
  },
  charCount: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerSideBtn: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  headerTitle: {
    fontSize: 17,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    minHeight: 140,
    padding: 12,
    borderRadius: clayRadii.control,
  },
  mediaRemoveBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,42,53,0.7)',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
  },
  mediaRow: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediaScroll: {
    flexGrow: 0,
  },
  mediaThumbnail: {
    borderRadius: 14,
    height: 130,
    width: 130,
  },
  mediaThumbnailWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: clayColors.border,
    overflow: 'hidden',
  },
  postButton: {
    minHeight: 38,
    minWidth: 70,
    paddingHorizontal: 16,
  },
  textInput: {
    color: clayColors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    padding: 0,
  },
  toolbar: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderTopColor: clayColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  toolbarButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: clayDimensions.minTouchTarget,
    paddingVertical: 4,
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },
  toolbarLabel: {
    color: clayColors.primary,
  },
  toolbarLabelDisabled: {
    color: clayColors.caption,
  },
  progressFill: {
    backgroundColor: clayColors.primary,
    borderRadius: 2,
    height: 4,
  },
  progressTrack: {
    backgroundColor: clayColors.border,
    borderRadius: 2,
    height: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  videoChip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingLeft: 14,
    paddingVertical: 6,
  },
  videoChipText: {
    flex: 1,
  },
  videoError: {
    color: clayColors.error,
    marginTop: 8,
  },
});
