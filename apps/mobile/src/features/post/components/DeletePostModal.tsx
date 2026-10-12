import { useState } from 'react';

import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { showToast } from '../../../components/common/toast';
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
      showToast(
        error instanceof ApiError
          ? error.message
          : 'Không thể xoá bài viết. Vui lòng thử lại sau.',
        'error',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmModal
      confirmLabel="Xoá"
      destructive
      icon="Trash"
      isBusy={isDeleting}
      message="Bài viết này sẽ bị xoá vĩnh viễn khỏi trang cá nhân và bảng tin của bạn. Hành động này không thể hoàn tác."
      onCancel={onClose}
      onConfirm={handleDelete}
      title="Xoá bài viết này?"
      visible={visible}
    />
  );
}
