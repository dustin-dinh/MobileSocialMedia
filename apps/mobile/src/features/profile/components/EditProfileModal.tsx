import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { showToast, ToastHost } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ApiError } from '../../../services/apiError';
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
            <ClaySurface variant="modal" style={styles.sheet}>
              {/* ── Handle indicator ────────────────────── */}
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              {/* ── Header ─────────────────────────────── */}
              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Hủy chỉnh sửa"
                  accessibilityRole="button"
                  onPress={onClose}
                  hitSlop={12}
                  style={styles.headerButton}
                >
                  <ClayText variant="body" style={styles.cancelText}>
                    Hủy
                  </ClayText>
                </Pressable>

                <ClayText variant="heading" style={styles.headerTitle}>
                  Chỉnh sửa hồ sơ
                </ClayText>

                <Pressable
                  accessibilityLabel="Lưu thông tin hồ sơ"
                  accessibilityRole="button"
                  onPress={handleSave}
                  disabled={!canSave}
                  hitSlop={12}
                  style={styles.headerButton}
                >
                  {isSaving ? (
                    <ActivityIndicator color={profileColors.primary} size="small" />
                  ) : (
                    <ClayText
                      variant="body"
                      style={[
                        styles.saveText,
                        !canSave && styles.saveTextDisabled,
                      ]}
                    >
                      Lưu
                    </ClayText>
                  )}
                </Pressable>
              </View>

              {/* ── Cover ───────────────────────────────── */}
              <View style={styles.coverRow}>
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
                <View style={styles.coverActions}>
                  <Pressable
                    accessibilityLabel="Chọn ảnh bìa mới"
                    accessibilityRole="button"
                    disabled={isSaving}
                    hitSlop={8}
                    onPress={handlePickCover}
                    style={styles.avatarAction}
                  >
                    <ClayText variant="caption" style={styles.saveText}>
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
                      style={styles.avatarAction}
                    >
                      <ClayText variant="caption" style={styles.removeAvatarText}>
                        Gỡ ảnh bìa
                      </ClayText>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* ── Avatar ──────────────────────────────── */}
              <View style={styles.avatarRow}>
                <UserAvatar
                  avatarUrl={previewUrl}
                  name={displayName.trim() || profile.username}
                  size={72}
                />
                <View style={styles.avatarActions}>
                  <Pressable
                    accessibilityLabel="Chọn ảnh đại diện mới"
                    accessibilityRole="button"
                    disabled={isSaving}
                    hitSlop={8}
                    onPress={handlePickAvatar}
                    style={styles.avatarAction}
                  >
                    <ClayText variant="caption" style={styles.saveText}>
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
                      style={styles.avatarAction}
                    >
                      <ClayText variant="caption" style={styles.removeAvatarText}>
                        Gỡ ảnh
                      </ClayText>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* ── Fields ──────────────────────────────── */}
              <View style={styles.fieldGroup}>
                <ClayText variant="meta" style={styles.label}>
                  Tên hiển thị
                </ClayText>
                <ClaySurface variant="inset" style={styles.inputSurface}>
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Tên hiển thị của bạn"
                    placeholderTextColor={profileColors.caption}
                    maxLength={MAX_NAME_LENGTH}
                    editable={!isSaving}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </ClaySurface>
                <ClayText variant="caption" style={styles.charHint}>
                  {displayName.length}/{MAX_NAME_LENGTH}
                </ClayText>
              </View>

              <View style={styles.fieldGroup}>
                <ClayText variant="meta" style={styles.label}>
                  Tiểu sử (Bio)
                </ClayText>
                <ClaySurface variant="inset" style={[styles.inputSurface, styles.bioInputSurface]}>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Giới thiệu đôi nét về bản thân"
                    placeholderTextColor={profileColors.caption}
                    maxLength={MAX_BIO_LENGTH}
                    editable={!isSaving}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                  />
                </ClaySurface>
                <ClayText variant="caption" style={styles.charHint}>
                  {bio.length}/{MAX_BIO_LENGTH}
                </ClayText>
              </View>
            </ClaySurface>
          </Pressable>
        </KeyboardAvoidingView>
        <ToastHost bottomOffset={24} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatarAction: {
    justifyContent: 'center',
    minHeight: 36,
  },
  avatarActions: {
    marginLeft: 16,
  },
  coverActions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  coverEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPreview: {
    backgroundColor: profileColors.surfaceWell,
    borderRadius: profileRadii.button,
    height: 96,
    width: '100%',
  },
  coverRow: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  removeAvatarText: {
    color: profileColors.danger,
  },
  bioInput: {
    height: 72,
  },
  bioInputSurface: {
    height: 96,
  },
  cancelText: {
    color: profileColors.caption,
  },
  charHint: {
    marginTop: 6,
    textAlign: 'right',
  },
  fieldGroup: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  handle: {
    backgroundColor: profileColors.border,
    borderRadius: 3,
    height: 5,
    width: 44,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  headerTitle: {
    color: profileColors.text,
  },
  input: {
    color: profileColors.text,
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputSurface: {
    backgroundColor: profileColors.surfaceWell,
    borderRadius: profileRadii.button,
    marginTop: 8,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    color: profileColors.textSecondary,
  },
  overlay: {
    backgroundColor: 'rgba(74,42,53,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  saveText: {
    color: profileColors.primary,
    fontFamily: 'Nunito_700Bold',
  },
  saveTextDisabled: {
    color: profileColors.caption,
    opacity: 0.5,
  },
  sheet: {
    borderTopLeftRadius: profileRadii.modal,
    borderTopRightRadius: profileRadii.modal,
    paddingBottom: 40,
  },
  sheetWrap: {
    maxHeight: '75%',
  },
});

