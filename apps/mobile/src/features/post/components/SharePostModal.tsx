import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { showToast } from '../../../components/common/toast';
import { SHARE_LINKS_ENABLED } from '../../../config/links';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { clayColors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { clayRadii, clayDimensions } from '../../../theme/spacing';
import type { Post } from '../../feed/types';

export type SharePostModalProps = {
  /** False for the viewer's own posts and for "only me" posts. */
  canRepost?: boolean;
  onClose: () => void;
  /** Repost, or undo the repost when `post.isReposted` is already true. */
  onToggleRepost?: () => void;
  post: Post;
  visible: boolean;
};

export function SharePostModal({
  canRepost = true,
  onClose,
  onToggleRepost,
  post,
  visible,
}: SharePostModalProps) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  // Uses the app's own scheme (see `scheme` in app.json): there is no web
  // domain behind the app yet, so an https link would lead nowhere.
  const postUrl = `mobilesocial://p/${post.id}`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(postUrl);
      setCopied(true);
      showToast('Đã sao chép liên kết bài viết.');
      onClose();
    } catch {
      showToast('Không sao chép được liên kết.', 'error');
    }
  };

  // Without share links the system sheet shares the post text alone, so it is
  // offered only for posts that have text.
  const canSystemShare = SHARE_LINKS_ENABLED || Boolean(post.content);

  const handleSystemShare = async () => {
    try {
      if (!SHARE_LINKS_ENABLED) {
        await Share.share({ message: post.content });
        onClose();
        return;
      }

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
    onClose();
    onToggleRepost?.();
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
          <ClaySurface variant="modal" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Handle bar */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <ClayText variant="heading" style={styles.headerTitle}>
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
                    <ClayText numberOfLines={1} variant="body" style={styles.previewDisplayName}>
                      {post.author.displayName ?? post.author.username}
                    </ClayText>
                    <ClayText numberOfLines={1} variant="caption" style={styles.previewUsername}>
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
              {SHARE_LINKS_ENABLED ? (
                <Pressable
                  accessibilityLabel="Sao chép liên kết bài viết"
                  accessibilityRole="button"
                  onPress={handleCopyLink}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
                >
                  <View style={styles.iconWrap}>
                    <ClayIcon
                      color={clayColors.text}
                      name={copied ? 'Check' : 'LinkSimple'}
                      size={20}
                      weight="regular"
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
              ) : null}

              {canRepost ? (
                <Pressable
                  accessibilityLabel={
                    post.isReposted ? 'Huỷ đăng lại bài viết' : 'Đăng lại lên Bảng tin của bạn'
                  }
                  accessibilityRole="button"
                  onPress={handleRepost}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
                >
                  <View style={styles.iconWrap}>
                    <ClayIcon
                      color={clayColors.text}
                      name="Repeat"
                      size={20}
                      weight={post.isReposted ? 'bold' : 'regular'}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <ClayText variant="body" style={styles.optionLabel}>
                      {post.isReposted ? 'Huỷ đăng lại' : 'Đăng lại lên Bảng tin'}
                    </ClayText>
                    <ClayText variant="caption" style={styles.optionDescription}>
                      {post.isReposted
                        ? 'Gỡ bài viết này khỏi trang cá nhân của bạn'
                        : 'Chia sẻ bài viết này đến người theo dõi của bạn'}
                    </ClayText>
                  </View>
                </Pressable>
              ) : null}

              {canSystemShare ? (
                <Pressable
                  accessibilityLabel="Mở chia sẻ ứng dụng khác của hệ thống"
                  accessibilityRole="button"
                  onPress={handleSystemShare}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
                >
                  <View style={styles.iconWrap}>
                    <ClayIcon
                      color={clayColors.text}
                      name="Export"
                      size={20}
                      weight="regular"
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <ClayText variant="body" style={styles.optionLabel}>
                      Chia sẻ qua ứng dụng khác
                    </ClayText>
                    <ClayText variant="caption" style={styles.optionDescription}>
                      Zalo, Messenger, tin nhắn và các ứng dụng trên máy
                    </ClayText>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </ClaySurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: clayColors.control,
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
    paddingHorizontal: clayDimensions.gutter,
  },
  headerTitle: {
    color: clayColors.text,
  },
  iconWrap: {
    alignItems: 'center',
    marginRight: 16,
    width: 24,
  },
  list: {
    paddingBottom: 8,
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
  optionRowPressed: {
    backgroundColor: clayColors.surfaceWell,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: 8,
  },
  overlay: {
    backgroundColor: 'rgba(20, 12, 16, 0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  previewAuthorMeta: {
    flex: 1,
  },
  previewAvatar: {
    height: 32,
    marginRight: 12,
    width: 32,
  },
  previewAvatarFallback: {
    alignItems: 'center',
    backgroundColor: clayColors.primarySoft,
    borderRadius: clayRadii.avatar,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  previewAvatarImg: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.avatar,
    height: 32,
    width: 32,
  },
  previewCard: {
    padding: 12,
  },
  previewContent: {
    color: clayColors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  previewDisplayName: {
    color: clayColors.text,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  previewInitials: {
    color: clayColors.primaryInk,
    fontSize: 12,
  },
  previewMediaWrap: {
    borderRadius: clayRadii.media,
    height: 120,
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
  },
  previewWrap: {
    marginBottom: 8,
    paddingHorizontal: clayDimensions.gutter,
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
