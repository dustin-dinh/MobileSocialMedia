import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { postService } from '../services/postService';
import { feedEvents } from '../../feed/feedEvents';
import { ApiError } from '../../../services/apiError';
import { PostPrivacyModal, PrivacyPill } from './PostPrivacyModal';
import type { Post, PostPrivacy } from '../../feed/types';

export type EditPostModalProps = {
  onClose: () => void;
  onSaveSuccess?: (updatedPost: Post) => void;
  post: Post;
  visible: boolean;
};

const MAX_CONTENT_LENGTH = 500;
const CHAR_WARNING_THRESHOLD = 450;

export function EditPostModal({
  onClose,
  onSaveSuccess,
  post,
  visible,
}: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [privacy, setPrivacy] = useState<PostPrivacy>(post.privacy ?? 'PUBLIC');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setContent(post.content);
      setPrivacy(post.privacy ?? 'PUBLIC');
    }
  }, [post, visible]);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CONTENT_LENGTH;
  const hasChanged = content.trim() !== post.content.trim() || privacy !== (post.privacy ?? 'PUBLIC');
  const canSave = !isSaving && !isOverLimit && hasChanged;

  const charCountColor = isOverLimit
    ? clayColors.error
    : charCount >= CHAR_WARNING_THRESHOLD
      ? clayColors.saved
      : clayColors.caption;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await postService.updatePost(
        post.id,
        {
          content: content.trim(),
          privacy,
        },
        post,
      );

      feedEvents.emitPostUpdated(updated);
      onSaveSuccess?.(updated);
      onClose();
    } catch (error) {
      console.error('Update post failed:', error);
      Alert.alert(
        'Lỗi',
        error instanceof ApiError
          ? error.message
          : 'Không thể cập nhật bài viết. Vui lòng thử lại sau.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanged) {
      Alert.alert(
        'Bỏ thay đổi?',
        'Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát mà không lưu không?',
        [
          { text: 'Tiếp tục sửa', style: 'cancel' },
          {
            text: 'Bỏ thay đổi',
            style: 'destructive',
            onPress: onClose,
          },
        ],
      );
    } else {
      onClose();
    }
  };

  const authorInitials = (post.author.displayName ?? post.author.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Modal
      animationType="slide"
      onRequestClose={isSaving ? undefined : handleCancel}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <Pressable
          accessibilityLabel="Đóng chỉnh sửa bài viết"
          accessibilityRole="button"
          disabled={isSaving}
          onPress={handleCancel}
          style={styles.overlay}
        >
          <Pressable
            accessibilityLabel="Giao diện chỉnh sửa bài viết"
            onPress={() => {
              // Prevent close
            }}
            style={styles.sheetWrap}
          >
            <ClaySurface variant="modal" style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Huỷ chỉnh sửa"
                  accessibilityRole="button"
                  disabled={isSaving}
                  hitSlop={8}
                  onPress={handleCancel}
                  style={styles.headerBtn}
                >
                  <ClayIcon
                    color={clayColors.caption}
                    name="X"
                    size={20}
                    weight="bold"
                  />
                </Pressable>

                <ClayText variant="title" style={styles.headerTitle}>
                  Chỉnh sửa bài viết
                </ClayText>

                <Pressable
                  accessibilityLabel="Lưu thay đổi bài viết"
                  accessibilityRole="button"
                  disabled={!canSave}
                  hitSlop={8}
                  onPress={handleSave}
                  style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                >
                  {isSaving ? (
                    <ActivityIndicator color={clayColors.primary} size="small" />
                  ) : (
                    <ClayText
                      variant="body"
                      weight="Nunito_700Bold"
                      style={[
                        styles.saveBtnText,
                        !canSave && styles.saveBtnTextDisabled,
                      ]}
                    >
                      Lưu
                    </ClayText>
                  )}
                </Pressable>
              </View>

              <ScrollView
                bounces={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Author row & Privacy Selector */}
                <View style={styles.authorRow}>
                  <View style={styles.avatarWrap}>
                    {post.author.avatarUrl ? (
                      <Image
                        source={{ uri: post.author.avatarUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <ClayText variant="caption" style={styles.avatarInitials}>
                          {authorInitials}
                        </ClayText>
                      </View>
                    )}
                  </View>

                  <View style={styles.authorMeta}>
                    <ClayText variant="body" weight="Nunito_700Bold" style={styles.authorName}>
                      {post.author.displayName ?? post.author.username}
                    </ClayText>
                    <View style={styles.privacyWrap}>
                      <PrivacyPill
                        onPress={() => setIsPrivacyModalOpen(true)}
                        privacy={privacy}
                      />
                    </View>
                  </View>
                </View>

                {/* Content Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    multiline
                    onChangeText={setContent}
                    placeholder="Bạn đang nghĩ gì?"
                    placeholderTextColor={clayColors.caption}
                    style={styles.input}
                    value={content}
                  />
                </View>

                {/* Character Count */}
                <View style={styles.charCountRow}>
                  <ClayText
                    variant="caption"
                    style={[styles.charCountText, { color: charCountColor }]}
                  >
                    {charCount}/{MAX_CONTENT_LENGTH}
                  </ClayText>
                </View>

                {/* Existing Media Display */}
                {post.media.length > 0 && (
                  <View style={styles.mediaSection}>
                    <ClayText variant="caption" style={styles.mediaSectionTitle}>
                      Hình ảnh đã đăng (không thể thay đổi)
                    </ClayText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.mediaScroll}
                    >
                      {post.media.map((item) => (
                        <View key={item.id} style={styles.mediaThumbWrap}>
                          <Image source={{ uri: item.url }} style={styles.mediaThumb} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>
            </ClaySurface>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      {/* Nested Privacy Selection Modal */}
      <PostPrivacyModal
        currentPrivacy={privacy}
        onClose={() => setIsPrivacyModalOpen(false)}
        onSelectPrivacy={(newPrivacy) => setPrivacy(newPrivacy)}
        visible={isPrivacyModalOpen}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: clayColors.text,
    fontSize: 15,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    borderRadius: clayRadii.avatar,
    height: 40,
    width: 40,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.avatar,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarInitials: {
    color: clayColors.caption,
    fontSize: 14,
  },
  avatarWrap: {
    marginRight: 12,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  charCountText: {
    fontSize: 12,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerBtn: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
  headerTitle: {
    color: clayColors.text,
    fontSize: 17,
  },
  input: {
    color: clayColors.text,
    fontFamily: fontFamilies.Nunito_400Regular,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    padding: 0,
    textAlignVertical: 'top',
  },
  inputContainer: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    marginBottom: 6,
    minHeight: 140,
    padding: 14,
  },
  keyboardWrap: {
    flex: 1,
  },
  mediaScroll: {
    flexDirection: 'row',
  },
  mediaSection: {
    marginTop: 8,
  },
  mediaSectionTitle: {
    color: clayColors.caption,
    marginBottom: 8,
  },
  mediaThumb: {
    height: '100%',
    width: '100%',
  },
  mediaThumbWrap: {
    borderRadius: clayRadii.control,
    height: 72,
    marginRight: 10,
    overflow: 'hidden',
    width: 72,
  },
  overlay: {
    backgroundColor: 'rgba(74, 42, 53, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  privacyWrap: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    borderRadius: clayRadii.pill,
    height: 34,
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: 14,
  },
  saveBtnDisabled: {
    backgroundColor: clayColors.surfaceWell,
    opacity: 0.6,
  },
  saveBtnText: {
    color: clayColors.primary,
    fontSize: 14,
  },
  saveBtnTextDisabled: {
    color: clayColors.caption,
  },
  scrollContent: {
    padding: 16,
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: clayRadii.modal,
    borderTopRightRadius: clayRadii.modal,
    maxHeight: '85%',
  },
  sheetWrap: {
    width: '100%',
  },
});
