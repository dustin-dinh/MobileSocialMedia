import { useCallback, useRef, useState } from 'react';
import {
  Alert,
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
import { useImagePicker } from '../hooks/useImagePicker';
import { postService } from '../services/postService';
import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { fontFamilies } from '../../../theme/typography';
import { Image as ExpoImage } from 'expo-image';

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

  const {
    images,
    isPicking,
    pickImages,
    removeImage,
    clearImages,
    remainingSlots,
  } = useImagePicker();

  // ── Derived state ───────────────────────────────────────────────────
  const charCount = content.length;
  const hasContent = content.trim().length > 0 || images.length > 0;
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
      Alert.alert(
        'Discard post?',
        'You have unsaved changes. Are you sure you want to discard this post?',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setContent('');
              clearImages();
              navigation.navigate('Home');
            },
          },
        ],
      );
    } else {
      navigation.navigate('Home');
    }
  }, [clearImages, hasContent, navigation]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newPost = await postService.createPost(
        {
          content: content.trim(),
          mediaUris: images.map((img) => img.uri),
        },
        user,
      );

      // Notify HomeScreen to prepend the new post
      feedEvents.emit('postCreated', newPost);

      // Reset form
      setContent('');
      clearImages();

      // Navigate to Home tab
      navigation.navigate('Home');
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, clearImages, content, images, navigation, user]);

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
      </ScrollView>

      {/* ── Bottom toolbar ────────────────────────────────── */}
      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 12) + 60 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={pickImages}
          disabled={remainingSlots <= 0 || isPicking || isSubmitting}
          style={[
            styles.toolbarButton,
            (remainingSlots <= 0 || isSubmitting) && styles.toolbarButtonDisabled,
          ]}
          hitSlop={8}
        >
          <ClayIcon name="Image" size={24} weight="duotone" color={clayColors.primary} />
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

        <ClayText variant="caption" style={[styles.charCount, { color: charCountColor }]}>
          {charCount}/{MAX_CONTENT_LENGTH}
        </ClayText>
      </View>
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
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: clayColors.surfaceHigh,
    shadowColor: 'rgb(150,84,96)',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitials: {
    color: clayColors.primary,
    fontSize: 14,
    fontFamily: fontFamilies.extraBold,
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
});
