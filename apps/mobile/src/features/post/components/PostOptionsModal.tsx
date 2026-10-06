import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import type { Post } from '../../feed/types';

export type PostOptionsModalProps = {
  isAuthor: boolean;
  isSaved?: boolean;
  onChangePrivacy?: () => void;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onHide?: () => void;
  onReport?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  post: Post;
  visible: boolean;
};

type OptionItem = {
  color?: string;
  description: string;
  icon:
    | 'PencilSimple'
    | 'GlobeSimple'
    | 'Trash'
    | 'ShareNetwork'
    | 'BookmarkSimple'
    | 'EyeSlash'
    | 'Flag';
  isDestructive?: boolean;
  key: string;
  label: string;
  onPress: () => void;
};

export function PostOptionsModal({
  isAuthor,
  isSaved = false,
  onChangePrivacy,
  onClose,
  onDelete,
  onEdit,
  onHide,
  onReport,
  onSave,
  onShare,
  visible,
}: PostOptionsModalProps) {
  const authorOptions: OptionItem[] = [
    {
      description: 'Chỉnh sửa nội dung văn bản bài viết',
      icon: 'PencilSimple',
      key: 'edit',
      label: 'Chỉnh sửa bài viết',
      onPress: () => {
        onClose();
        onEdit?.();
      },
    },
    {
      description: 'Điều chỉnh ai có thể nhìn thấy bài viết này',
      icon: 'GlobeSimple',
      key: 'privacy',
      label: 'Thay đổi quyền riêng tư',
      onPress: () => {
        onClose();
        onChangePrivacy?.();
      },
    },
    {
      color: clayColors.error,
      description: 'Gỡ bài viết này vĩnh viễn khỏi trang cá nhân',
      icon: 'Trash',
      isDestructive: true,
      key: 'delete',
      label: 'Xoá bài viết',
      onPress: () => {
        onClose();
        onDelete?.();
      },
    },
  ];

  const viewerOptions: OptionItem[] = [
    {
      description: 'Chia sẻ tới bạn bè hoặc ứng dụng khác',
      icon: 'ShareNetwork',
      key: 'share',
      label: 'Chia sẻ bài viết',
      onPress: () => {
        onClose();
        onShare?.();
      },
    },
    {
      description: isSaved ? 'Gỡ khỏi danh sách bài viết đã lưu' : 'Lưu lại để xem sau bất kỳ lúc nào',
      icon: 'BookmarkSimple',
      key: 'save',
      label: isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết',
      onPress: () => {
        onClose();
        onSave?.();
      },
    },
    {
      description: 'Ẩn bớt các bài viết tương tự khỏi bảng tin',
      icon: 'EyeSlash',
      key: 'hide',
      label: 'Ẩn bài viết',
      onPress: () => {
        onClose();
        onHide?.();
      },
    },
    {
      color: clayColors.error,
      description: 'Báo cáo nội dung vi phạm tiêu chuẩn cộng đồng',
      icon: 'Flag',
      isDestructive: true,
      key: 'report',
      label: 'Báo cáo bài viết',
      onPress: () => {
        onClose();
        onReport?.();
      },
    },
  ];

  const options = isAuthor ? authorOptions : viewerOptions;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng tuỳ chọn bài viết"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="Menu tuỳ chọn bài viết"
          onPress={() => {
            // Prevent close when tapping inside sheet
          }}
          style={styles.sheetWrap}
        >
          <ClaySurface variant="modal" style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Title */}
            <View style={styles.header}>
              <ClayText variant="title" style={styles.headerTitle}>
                {isAuthor ? 'Quản lý bài viết của bạn' : 'Tuỳ chọn bài viết'}
              </ClayText>
            </View>

            {/* List options */}
            <View style={styles.list}>
              {options.map((item) => {
                const iconColor = item.color ?? (item.isDestructive ? clayColors.error : clayColors.text);
                const textColor = item.isDestructive ? clayColors.error : clayColors.text;

                return (
                  <Pressable
                    accessibilityLabel={item.label}
                    accessibilityRole="button"
                    key={item.key}
                    onPress={item.onPress}
                    style={styles.optionRow}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        item.isDestructive && styles.iconWrapDestructive,
                      ]}
                    >
                      <ClayIcon
                        color={iconColor}
                        name={item.icon}
                        size={22}
                        weight={item.isDestructive ? 'bold' : 'duotone'}
                      />
                    </View>

                    <View style={styles.optionContent}>
                      <ClayText
                        variant="body"
                        style={[styles.optionLabel, { color: textColor }]}
                      >
                        {item.label}
                      </ClayText>
                      <ClayText variant="caption" style={styles.optionDescription}>
                        {item.description}
                      </ClayText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ClaySurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: clayColors.border,
    borderRadius: clayRadii.pill,
    height: 4,
    width: 36,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: clayColors.text,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    marginRight: 14,
    width: clayDimensions.minTouchTarget,
  },
  iconWrapDestructive: {
    backgroundColor: clayColors.errorBg,
  },
  list: {
    paddingBottom: 24,
    paddingHorizontal: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionDescription: {
    color: clayColors.caption,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 15,
  },
  optionRow: {
    alignItems: 'center',
    borderRadius: clayRadii.control,
    flexDirection: 'row',
    marginBottom: 6,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overlay: {
    backgroundColor: 'rgba(74, 42, 53, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: clayRadii.modal,
    borderTopRightRadius: clayRadii.modal,
  },
  sheetWrap: {
    width: '100%',
  },
});
