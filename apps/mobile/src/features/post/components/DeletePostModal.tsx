import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import { postService } from '../services/postService';
import { feedEvents } from '../../feed/feedEvents';
import { ApiError } from '../../../services/apiError';
import type { Post } from '../../feed/types';

export type DeletePostModalProps = {
  onClose: () => void;
  onDeleteSuccess?: (postId: string) => void;
  post: Post;
  visible: boolean;
};

export function DeletePostModal({
  onClose,
  onDeleteSuccess,
  post,
  visible,
}: DeletePostModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postService.deletePost(post.id);
      feedEvents.emitPostDeleted(post.id);
      onDeleteSuccess?.(post.id);
      onClose();
    } catch (error) {
      console.error('Delete post failed:', error);
      Alert.alert(
        'Lỗi',
        error instanceof ApiError
          ? error.message
          : 'Không thể xoá bài viết. Vui lòng thử lại sau.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={isDeleting ? undefined : onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng hộp thoại xác nhận xoá"
        accessibilityRole="button"
        disabled={isDeleting}
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="Hộp thoại xác nhận xoá bài viết"
          onPress={() => {
            // Prevent close
          }}
          style={styles.dialogWrap}
        >
          <ClaySurface variant="modal" style={styles.dialog}>
            {/* Warning Icon Badge */}
            <View style={styles.badgeWrap}>
              <View style={styles.iconCircle}>
                <ClayIcon
                  color={clayColors.error}
                  name="Trash"
                  size={26}
                  weight="bold"
                />
              </View>
            </View>

            {/* Title & Description */}
            <View style={styles.content}>
              <ClayText variant="title" style={styles.title}>
                Xoá bài viết này?
              </ClayText>
              <ClayText variant="body" style={styles.description}>
                Bài viết này sẽ bị xoá vĩnh viễn khỏi trang cá nhân và bảng tin của bạn. Hành động này không thể hoàn tác.
              </ClayText>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <View style={styles.buttonHalf}>
                <ClayButton
                  accessibilityLabel="Huỷ thao tác xoá"
                  disabled={isDeleting}
                  onPress={onClose}
                  style={styles.actionBtn}
                  variant="secondary"
                >
                  Huỷ
                </ClayButton>
              </View>

              <View style={styles.buttonHalf}>
                <ClayButton
                  accessibilityLabel="Xác nhận xoá bài viết vĩnh viễn"
                  disabled={isDeleting}
                  isLoading={isDeleting}
                  onPress={handleDelete}
                  style={[styles.actionBtn, styles.deleteBtn]}
                  variant="primary"
                >
                  Xoá
                </ClayButton>
              </View>
            </View>
          </ClaySurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    minHeight: clayDimensions.minTouchTarget,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonHalf: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteBtn: {
    backgroundColor: clayColors.error,
  },
  description: {
    color: clayColors.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  dialog: {
    alignItems: 'center',
    borderRadius: clayRadii.modal,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  dialogWrap: {
    maxWidth: 400,
    width: '88%',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: clayColors.errorBg,
    borderRadius: clayRadii.pill,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 42, 53, 0.45)',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: clayColors.text,
    textAlign: 'center',
  },
});
