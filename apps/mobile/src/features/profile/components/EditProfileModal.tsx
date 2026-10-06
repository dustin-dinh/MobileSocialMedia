import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ApiError } from '../../../services/apiError';
import { profileColors, profileRadii } from '../profileTheme';
import type { UserProfile } from '../types';

type EditProfileModalProps = {
  onClose: () => void;
  onSave: (data: { bio: string; displayName: string }) => Promise<void>;
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
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when profile changes or modal opens
  useEffect(() => {
    if (visible) {
      setDisplayName(profile.displayName ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile, visible]);

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
      await onSave({ bio: bio.trim(), displayName: displayName.trim() });
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Lỗi',
        error instanceof ApiError ? error.message : 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [bio, canSave, displayName, onClose, onSave]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng modal chỉnh sửa hồ sơ"
        accessibilityRole="button"
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
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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

