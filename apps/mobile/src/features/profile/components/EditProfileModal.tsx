import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { showToast, ToastHost } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayInput } from '../../../components/ui/ClayInput';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ApiError } from '../../../services/apiError';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies, tabularNums } from '../../../theme/typography';
import { profileColors, profileRadii } from '../profileTheme';
import type { UpdateProfilePayload, UserProfile } from '../types';

type AvatarChange = UpdateProfilePayload['avatar'];

type EditProfileModalProps = {
  onClose: () => void;
  /** `avatar` is only present when the picture changed (`null` = removed). */
  onSave: (data: {
    avatar?: AvatarChange;
    bio: string;
    cover?: AvatarChange;
    displayName: string;
  }) => Promise<void>;
  profile: UserProfile;
  visible: boolean;
};

const MAX_BIO_LENGTH = 160;
const MAX_NAME_LENGTH = 50;

export function EditProfileModal({
  onClose,
  onSave,
  profile,
  visible,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  // undefined = keep the current picture, null = remove it, object = new picture.
  const [avatar, setAvatar] = useState<AvatarChange>(undefined);
  const [cover, setCover] = useState<AvatarChange>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  // Sync form when profile changes or modal opens
  useEffect(() => {
    if (visible) {
      setDisplayName(profile.displayName ?? '');
      setBio(profile.bio ?? '');
      setAvatar(undefined);
      setCover(undefined);
    }
  }, [profile, visible]);

  const previewUrl = avatar === undefined ? profile.avatarUrl : (avatar?.uri ?? null);
  const coverPreviewUrl = cover === undefined ? (profile.coverUrl ?? null) : (cover?.uri ?? null);

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showToast('Hãy cho phép ứng dụng truy cập thư viện ảnh để đổi ảnh đại diện.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      setAvatar({ fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  }, []);

  const handlePickCover = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showToast('Hãy cho phép ứng dụng truy cập thư viện ảnh để đổi ảnh bìa.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      setCover({ fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  }, []);

  const canSave =
    !isSaving &&
    displayName.trim().length > 0 &&
    displayName.length <= MAX_NAME_LENGTH &&
    bio.length <= MAX_BIO_LENGTH;

  const handleSave = useCallback(async () => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        bio: bio.trim(),
        displayName: displayName.trim(),
        ...(avatar === undefined ? {} : { avatar }),
        ...(cover === undefined ? {} : { cover }),
      });
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast(
        error instanceof ApiError ? error.message : 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  }, [avatar, bio, canSave, cover, displayName, onClose, onSave]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={isSaving ? undefined : onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng modal chỉnh sửa hồ sơ"
        accessibilityRole="button"
        disabled={isSaving}
        style={styles.overlay}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable
            accessibilityLabel="Nội dung chỉnh sửa hồ sơ"
            style={styles.sheetWrap}
            onPress={() => { /* prevent close */ }}
          >
            <ClaySurface
              variant="modal"
              style={[styles.sheet, { paddingBottom: insets.bottom + claySpacing.base }]}
            >
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Hủy chỉnh sửa"
                  accessibilityRole="button"
                  onPress={onClose}
                  hitSlop={12}
                  style={[styles.headerButton, styles.headerButtonStart]}
                >
                  <ClayText variant="body" style={styles.cancelText}>
                    Hủy
                  </ClayText>
                </Pressable>

                <ClayText level={2} variant="heading" style={styles.headerTitle}>
                  Chỉnh sửa hồ sơ
                </ClayText>

                <Pressable
                  accessibilityLabel="Lưu thông tin hồ sơ"
                  accessibilityRole="button"
                  accessibilityState={{ busy: isSaving, disabled: !canSave }}
                  onPress={handleSave}
                  disabled={!canSave}
                  hitSlop={12}
                  style={[styles.headerButton, styles.headerButtonEnd]}
                >
                  {isSaving ? (
                    <ActivityIndicator color={profileColors.primary} size="small" />
                  ) : (
                    <ClayText
                      variant="body"
                      style={[styles.saveText, !canSave && styles.saveTextDisabled]}
                    >
                      Lưu
                    </ClayText>
                  )}
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                {/* Cover */}
                <ClayText variant="caption" style={styles.label}>
                  Ảnh bìa
                </ClayText>
                {coverPreviewUrl ? (
                  <ExpoImage
                    contentFit="cover"
                    source={{ uri: coverPreviewUrl }}
                    style={styles.coverPreview}
                  />
                ) : (
                  <View style={[styles.coverPreview, styles.coverEmpty]}>
                    <ClayText variant="meta">Chưa có ảnh bìa</ClayText>
                  </View>
                )}
                <View style={styles.pictureActions}>
                  <Pressable
                    accessibilityLabel="Chọn ảnh bìa mới"
                    accessibilityRole="button"
                    disabled={isSaving}
                    hitSlop={8}
                    onPress={handlePickCover}
                    style={styles.textAction}
                  >
                    <ClayText variant="caption" style={styles.actionText}>
                      Đổi ảnh bìa
                    </ClayText>
                  </Pressable>
                  {coverPreviewUrl ? (
                    <Pressable
                      accessibilityLabel="Gỡ ảnh bìa"
                      accessibilityRole="button"
                      disabled={isSaving}
                      hitSlop={8}
                      onPress={() => setCover(null)}
                      style={styles.textAction}
                    >
                      <ClayText variant="caption" style={styles.removeText}>
                        Gỡ ảnh bìa
                      </ClayText>
                    </Pressable>
                  ) : null}
                </View>

                {/* Avatar */}
                <View style={styles.avatarRow}>
                  <UserAvatar
                    avatarUrl={previewUrl}
                    name={displayName.trim() || profile.username}
                    size={64}
                  />
                  <View style={styles.avatarActions}>
                    <Pressable
                      accessibilityLabel="Chọn ảnh đại diện mới"
                      accessibilityRole="button"
                      disabled={isSaving}
                      hitSlop={8}
                      onPress={handlePickAvatar}
                      style={styles.textAction}
                    >
                      <ClayText variant="caption" style={styles.actionText}>
                        Đổi ảnh đại diện
                      </ClayText>
                    </Pressable>
                    {previewUrl ? (
                      <Pressable
                        accessibilityLabel="Gỡ ảnh đại diện"
                        accessibilityRole="button"
                        disabled={isSaving}
                        hitSlop={8}
                        onPress={() => setAvatar(null)}
                        style={styles.textAction}
                      >
                        <ClayText variant="caption" style={styles.removeText}>
                          Gỡ ảnh
                        </ClayText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {/* Fields: label above, the length limit under each field */}
                <ClayInput
                  autoCapitalize="words"
                  containerStyle={styles.field}
                  editable={!isSaving}
                  label="Tên hiển thị"
                  maxLength={MAX_NAME_LENGTH}
                  onChangeText={setDisplayName}
                  placeholder="Tên hiển thị của bạn"
                  returnKeyType="next"
                  value={displayName}
                />
                <ClayText variant="meta" style={styles.charHint}>
                  {displayName.length}/{MAX_NAME_LENGTH}
                </ClayText>

                <ClayInput
                  containerStyle={styles.field}
                  editable={!isSaving}
                  label="Tiểu sử"
                  maxLength={MAX_BIO_LENGTH}
                  multiline
                  numberOfLines={3}
                  onChangeText={setBio}
                  placeholder="Giới thiệu đôi nét về bản thân"
                  returnKeyType="done"
                  style={styles.bioInput}
                  textAlignVertical="top"
                  value={bio}
                />
                <ClayText variant="meta" style={styles.charHint}>
                  {bio.length}/{MAX_BIO_LENGTH}
                </ClayText>
              </ScrollView>
            </ClaySurface>
          </Pressable>
        </KeyboardAvoidingView>
        <ToastHost bottomOffset={24} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionText: {
    color: profileColors.text,
    fontFamily: fontFamilies.semiBold,
  },
  avatarActions: {
    marginLeft: claySpacing.base,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: claySpacing.base,
    marginTop: claySpacing.sm,
  },
  bioInput: {
    minHeight: 88,
    paddingTop: claySpacing.md,
  },
  body: {
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.sm,
  },
  cancelText: {
    color: profileColors.textSecondary,
  },
  charHint: {
    ...tabularNums,
    marginBottom: claySpacing.base,
    marginTop: claySpacing.xs,
    textAlign: 'right',
  },
  coverEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPreview: {
    backgroundColor: profileColors.surfaceWell,
    borderRadius: clayRadii.media,
    height: 96,
    width: '100%',
  },
  field: {
    marginBottom: 0,
  },
  handle: {
    backgroundColor: profileColors.border,
    borderRadius: clayRadii.pill,
    height: 4,
    width: 36,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: claySpacing.sm,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: profileColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: claySpacing.xs,
    paddingHorizontal: clayDimensions.gutter,
  },
  headerButton: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  headerButtonEnd: {
    alignItems: 'flex-end',
  },
  headerButtonStart: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: profileColors.text,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    color: profileColors.text,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    marginBottom: claySpacing.sm,
    marginTop: claySpacing.sm,
  },
  overlay: {
    backgroundColor: 'rgba(20,12,16,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pictureActions: {
    flexDirection: 'row',
    gap: claySpacing.lg,
  },
  removeText: {
    color: profileColors.danger,
  },
  saveText: {
    color: profileColors.primary,
    fontFamily: fontFamilies.semiBold,
  },
  saveTextDisabled: {
    color: profileColors.caption,
  },
  sheet: {
    borderTopLeftRadius: profileRadii.modal,
    borderTopRightRadius: profileRadii.modal,
  },
  sheetWrap: {
    maxHeight: '85%',
  },
  textAction: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
});
