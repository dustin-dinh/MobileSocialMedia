import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { clayColors } from '../../../theme/colors';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import type { Post } from '../../feed/types';

export type SharePostModalProps = {
  onClose: () => void;
  onRepostSuccess?: (post: Post) => void;
  post: Post;
  visible: boolean;
};

export function SharePostModal({
  onClose,
  onRepostSuccess,
  post,
  visible,
}: SharePostModalProps) {
  const [copied, setCopied] = useState(false);

  const postUrl = `https://mobilesocial.app/p/${post.id}`;

  const handleCopyLink = () => {
    setCopied(true);
    Alert.alert(
      'Đã sao chép liên kết',
      `Liên kết bài viết đã được sao chép:\n${postUrl}`,
      [{ text: 'Đóng', onPress: onClose }],
    );
  };

  const handleSystemShare = async () => {
    try {
      const shareMessage = post.content
        ? `${post.content}\n\n${postUrl}`
        : postUrl;

      await Share.share({
        message: shareMessage,
        url: postUrl,
      });
      onClose();
    } catch (error) {
      console.error('System share error:', error);
    }
  };

  const handleRepost = () => {
    Alert.alert(
      'Chia sẻ lên Bảng tin',
      'Bạn có muốn chia sẻ bài viết này lên bảng tin của mình không?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Chia sẻ ngay',
          onPress: () => {
            onRepostSuccess?.(post);
            onClose();
            Alert.alert('Thành công', 'Đã chia sẻ bài viết lên bảng tin của bạn.');
          },
        },
      ],
    );
  };

  const handleSendMessage = () => {
    Alert.alert(
      'Gửi tin nhắn riêng',
      'Chọn người bạn muốn gửi bài viết này tới (tính năng Direct Message).',
      [{ text: 'Đóng', onPress: onClose }],
    );
  };

  const authorInitials = (post.author.displayName ?? post.author.username)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const firstMedia = post.media.length > 0 ? post.media[0] : null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng bảng chia sẻ bài viết"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="Bảng chia sẻ bài viết"
          onPress={() => {
            // Prevent close
          }}
          style={styles.sheetWrap}
        >
          <ClaySurface variant="modal" style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <ClayText variant="title" style={styles.headerTitle}>
                Chia sẻ bài viết
              </ClayText>
            </View>

            {/* Post Preview Card */}
            <View style={styles.previewWrap}>
              <ClaySurface variant="cardLite" style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewAvatar}>
                    {post.author.avatarUrl ? (
                      <Image
                        source={{ uri: post.author.avatarUrl }}
                        style={styles.previewAvatarImg}
                      />
                    ) : (
                      <View style={styles.previewAvatarFallback}>
                        <ClayText variant="caption" style={styles.previewInitials}>
                          {authorInitials}
                        </ClayText>
                      </View>
                    )}
                  </View>
                  <View style={styles.previewAuthorMeta}>
                    <ClayText variant="body" style={styles.previewDisplayName}>
                      {post.author.displayName ?? post.author.username}
                    </ClayText>
                    <ClayText variant="caption" style={styles.previewUsername}>
                      @{post.author.username}
                    </ClayText>
                  </View>
                </View>

                {post.content.trim().length > 0 && (
                  <ClayText
                    numberOfLines={2}
                    variant="caption"
                    style={styles.previewContent}
                  >
                    {post.content}
                  </ClayText>
                )}

                {Boolean(firstMedia) && (
                  <View style={styles.previewMediaWrap}>
                    <Image
                      source={{ uri: firstMedia!.url }}
                      style={styles.previewThumbnail}
                    />
                  </View>
                )}
              </ClaySurface>
            </View>

            {/* Share options */}
            <View style={styles.list}>
              <Pressable
                accessibilityLabel="Sao chép liên kết bài viết"
                accessibilityRole="button"
                onPress={handleCopyLink}
                style={styles.optionRow}
              >
                <View style={[styles.iconWrap, copied && styles.iconWrapActive]}>
                  <ClayIcon
                    color={copied ? clayColors.primary : clayColors.text}
                    name="LinkSimple"
                    size={22}
                    weight="duotone"
                  />
                </View>
                <View style={styles.optionContent}>
                  <ClayText variant="body" style={styles.optionLabel}>
                    Sao chép liên kết
                  </ClayText>
                  <ClayText variant="caption" style={styles.optionDescription}>
                    {postUrl}
                  </ClayText>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Đăng lại lên Bảng tin của bạn"
                accessibilityRole="button"
                onPress={handleRepost}
                style={styles.optionRow}
              >
                <View style={styles.iconWrap}>
                  <ClayIcon
                    color={clayColors.text}
                    name="Repeat"
                    size={22}
                    weight="duotone"
                  />
                </View>
                <View style={styles.optionContent}>
                  <ClayText variant="body" style={styles.optionLabel}>
                    Đăng lại lên Bảng tin
                  </ClayText>
                  <ClayText variant="caption" style={styles.optionDescription}>
                    Chia sẻ bài viết này đến người theo dõi của bạn
                  </ClayText>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Gửi qua tin nhắn riêng"
                accessibilityRole="button"
                onPress={handleSendMessage}
                style={styles.optionRow}
              >
                <View style={styles.iconWrap}>
                  <ClayIcon
                    color={clayColors.text}
                    name="PaperPlaneTilt"
                    size={22}
                    weight="duotone"
                  />
                </View>
                <View style={styles.optionContent}>
                  <ClayText variant="body" style={styles.optionLabel}>
                    Gửi bằng tin nhắn
                  </ClayText>
                  <ClayText variant="caption" style={styles.optionDescription}>
                    Gửi trực tiếp cho bạn bè trong cuộc trò chuyện
                  </ClayText>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Mở chia sẻ ứng dụng khác của hệ thống"
                accessibilityRole="button"
                onPress={handleSystemShare}
                style={styles.optionRow}
              >
                <View style={styles.iconWrap}>
                  <ClayIcon
                    color={clayColors.text}
                    name="Export"
                    size={22}
                    weight="duotone"
                  />
                </View>
                <View style={styles.optionContent}>
                  <ClayText variant="body" style={styles.optionLabel}>
                    Tuỳ chọn chia sẻ khác...
                  </ClayText>
                  <ClayText variant="caption" style={styles.optionDescription}>
                    Chia sẻ qua Zalo, Messenger, Facebook, hoặc AirDrop
                  </ClayText>
                </View>
              </Pressable>
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
    marginBottom: 8,
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
  iconWrapActive: {
    backgroundColor: clayColors.primarySoft,
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
    color: clayColors.text,
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
  previewAuthorMeta: {
    flex: 1,
  },
  previewAvatar: {
    height: 32,
    marginRight: 8,
    width: 32,
  },
  previewAvatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.avatar,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  previewAvatarImg: {
    borderRadius: clayRadii.avatar,
    height: 32,
    width: 32,
  },
  previewCard: {
    padding: 12,
  },
  previewContent: {
    color: clayColors.text,
    marginTop: 6,
  },
  previewDisplayName: {
    color: clayColors.text,
    fontSize: 13,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  previewInitials: {
    color: clayColors.caption,
    fontSize: 11,
  },
  previewMediaWrap: {
    borderRadius: clayRadii.control,
    height: 60,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  previewThumbnail: {
    height: '100%',
    width: '100%',
  },
  previewUsername: {
    color: clayColors.caption,
    fontSize: 11,
  },
  previewWrap: {
    marginBottom: 12,
    paddingHorizontal: 16,
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
