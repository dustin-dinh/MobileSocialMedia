import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
    } finally {
      setIsSaving(false);
    }
  }, [bio, canSave, displayName, onClose, onSave]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent
      visible={visible}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable style={styles.sheet} onPress={() => { /* prevent close */ }}>
            {/* ── Header ─────────────────────────────── */}
            <View style={styles.header}>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={8}
              >
                {isSaving ? (
                  <ActivityIndicator color={profileColors.primary} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.saveText,
                      !canSave && styles.saveTextDisabled,
                    ]}
                  >
                    Save
                  </Text>
                )}
              </Pressable>
            </View>

            {/* ── Handle indicator ────────────────────── */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* ── Fields ──────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your display name"
                placeholderTextColor={profileColors.caption}
                maxLength={MAX_NAME_LENGTH}
                editable={!isSaving}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <Text style={styles.charHint}>
                {displayName.length}/{MAX_NAME_LENGTH}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={profileColors.caption}
                maxLength={MAX_BIO_LENGTH}
                editable={!isSaving}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
              />
              <Text style={styles.charHint}>
                {bio.length}/{MAX_BIO_LENGTH}
              </Text>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bioInput: {
    height: 80,
  },
  cancelText: {
    color: profileColors.text,
    fontSize: 16,
  },
  charHint: {
    color: profileColors.caption,
    fontSize: 12,
    marginTop: 4,
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
    width: 40,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    color: profileColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  input: {
    backgroundColor: profileColors.background,
    borderColor: profileColors.border,
    borderRadius: profileRadii.button,
    borderWidth: 1,
    color: profileColors.text,
    fontSize: 15,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    color: profileColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  saveText: {
    color: profileColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveTextDisabled: {
    color: profileColors.caption,
  },
  sheet: {
    backgroundColor: profileColors.surface,
    borderTopLeftRadius: profileRadii.modal,
    borderTopRightRadius: profileRadii.modal,
    maxHeight: '70%',
    paddingBottom: 40,
  },
});
