import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CONTENT_LENGTH = 500;
const CHAR_WARNING_THRESHOLD = 450;

const colors = {
  background: '#F4F7FB',
  border: '#E8ECF2',
  caption: '#667085',
  danger: '#EF4444',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  surface: '#FFFFFF',
  text: '#172033',
  textSecondary: '#4B5563',
  warning: '#F59E0B',
} as const;

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

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{initials}</Text>
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
            onPress={() => onRemove(img.uri)}
            style={styles.mediaRemoveBtn}
            hitSlop={6}
          >
            <Text style={styles.mediaRemoveText}>✕</Text>
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
      ? colors.danger
      : charCount >= CHAR_WARNING_THRESHOLD
        ? colors.warning
        : colors.caption;

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
        <Pressable onPress={handleCancel} hitSlop={8} style={styles.headerSideBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <Text style={styles.headerTitle}>New Post</Text>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          hitSlop={8}
          style={[
            styles.postButton,
            canSubmit ? styles.postButtonEnabled : styles.postButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.postButtonText,
                !canSubmit && styles.postButtonTextDisabled,
              ]}
            >
              Post
            </Text>
          )}
        </Pressable>
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
            <Text style={styles.authorName} numberOfLines={1}>
              {displayName}
            </Text>
            {user && (
              <Text style={styles.authorUsername}>@{user.username}</Text>
            )}
          </View>
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.caption}
          multiline
          maxLength={MAX_CONTENT_LENGTH + 50}
          value={content}
          onChangeText={setContent}
          editable={!isSubmitting}
          autoFocus
          textAlignVertical="top"
        />

        {/* Media preview */}
        <MediaPreview images={images} onRemove={removeImage} />
      </ScrollView>

      {/* ── Bottom toolbar ────────────────────────────────── */}
      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable
          onPress={pickImages}
          disabled={remainingSlots <= 0 || isPicking || isSubmitting}
          style={[
            styles.toolbarButton,
            (remainingSlots <= 0 || isSubmitting) && styles.toolbarButtonDisabled,
          ]}
          hitSlop={8}
        >
          <Text style={styles.toolbarIcon}>🖼</Text>
          <Text
            style={[
              styles.toolbarLabel,
              remainingSlots <= 0 && styles.toolbarLabelDisabled,
            ]}
          >
            Photo {images.length > 0 ? `${images.length}/4` : ''}
          </Text>
        </Pressable>

        <Text style={[styles.charCount, { color: charCountColor }]}>
          {charCount}/{MAX_CONTENT_LENGTH}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  authorBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  authorUsername: {
    color: colors.caption,
    fontSize: 13,
    marginTop: 1,
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
  },
  cancelText: {
    color: colors.text,
    fontSize: 16,
  },
  charCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerSideBtn: {
    minWidth: 60,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  mediaRemoveBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
  },
  mediaRemoveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mediaRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mediaScroll: {
    flexGrow: 0,
  },
  mediaThumbnail: {
    borderRadius: 12,
    height: 140,
    width: 140,
  },
  mediaThumbnailWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  postButton: {
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 60,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    backgroundColor: colors.border,
  },
  postButtonEnabled: {
    backgroundColor: colors.primary,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  postButtonTextDisabled: {
    color: colors.caption,
  },
  textInput: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  toolbar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  toolbarButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },
  toolbarIcon: {
    fontSize: 20,
  },
  toolbarLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  toolbarLabelDisabled: {
    color: colors.caption,
  },
});
