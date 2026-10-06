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
import type { PostPrivacy } from '../../feed/types';

export type PostPrivacyModalProps = {
  currentPrivacy: PostPrivacy;
  onClose: () => void;
  onSelectPrivacy: (privacy: PostPrivacy) => void;
  visible: boolean;
};

type PrivacyOption = {
  description: string;
  icon: 'GlobeSimple' | 'Users' | 'LockKey';
  key: PostPrivacy;
  label: string;
};

const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    description: 'Bất kỳ ai trên ứng dụng đều có thể xem bài viết',
    icon: 'GlobeSimple',
    key: 'PUBLIC',
    label: 'Công khai',
  },
  {
    description: 'Chỉ người theo dõi và bạn bè mới có thể xem',
    icon: 'Users',
    key: 'FRIENDS',
    label: 'Bạn bè',
  },
  {
    description: 'Chỉ một mình bạn có thể xem bài viết này',
    icon: 'LockKey',
    key: 'ONLY_ME',
    label: 'Chỉ mình tôi',
  },
];

export function PostPrivacyModal({
  currentPrivacy,
  onClose,
  onSelectPrivacy,
  visible,
}: PostPrivacyModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng tuỳ chọn quyền riêng tư"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="Danh sách quyền riêng tư"
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

            {/* Header */}
            <View style={styles.header}>
              <ClayText variant="title" style={styles.title}>
                Ai có thể xem bài viết này?
              </ClayText>
              <ClayText variant="caption" style={styles.subtitle}>
                Quyền riêng tư quyết định phạm vi người có thể nhìn thấy nội dung của bạn.
              </ClayText>
            </View>

            {/* Options list */}
            <View style={styles.optionsList}>
              {PRIVACY_OPTIONS.map((option) => {
                const isSelected = option.key === currentPrivacy;

                return (
                  <Pressable
                    accessibilityLabel={`Chọn quyền riêng tư: ${option.label}`}
                    accessibilityRole="button"
                    key={option.key}
                    onPress={() => {
                      onSelectPrivacy(option.key);
                      onClose();
                    }}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        isSelected && styles.iconWrapSelected,
                      ]}
                    >
                      <ClayIcon
                        color={isSelected ? clayColors.primary : clayColors.text}
                        name={option.icon}
                        size={22}
                        weight={isSelected ? 'fill' : 'duotone'}
                      />
                    </View>

                    <View style={styles.optionTextWrap}>
                      <ClayText
                        variant="body"
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </ClayText>
                      <ClayText variant="caption" style={styles.optionDescription}>
                        {option.description}
                      </ClayText>
                    </View>

                    {isSelected && (
                      <View style={styles.checkWrap}>
                        <ClayIcon
                          color={clayColors.primary}
                          name="Check"
                          size={18}
                          weight="bold"
                        />
                      </View>
                    )}
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

/**
 * Reusable Privacy Pill/Chip for displaying and changing privacy.
 */
export function PrivacyPill({
  onPress,
  privacy = 'PUBLIC',
}: {
  onPress?: () => void;
  privacy?: PostPrivacy;
}) {
  const meta = PRIVACY_OPTIONS.find((item) => item.key === privacy) ?? PRIVACY_OPTIONS[0];

  return (
    <Pressable
      accessibilityLabel={`Quyền riêng tư hiện tại: ${meta.label}. Bấm để thay đổi.`}
      accessibilityRole="button"
      disabled={!onPress}
      hitSlop={6}
      onPress={onPress}
      style={[styles.pill, !onPress && styles.pillStatic]}
    >
      <ClayIcon
        color={clayColors.caption}
        name={meta.icon}
        size={13}
        weight="bold"
      />
      <ClayText variant="caption" style={styles.pillText}>
        {meta.label}
      </ClayText>
      {Boolean(onPress) && (
        <ClayIcon
          color={clayColors.caption}
          name="CaretLeft"
          size={11}
          style={styles.pillCaret}
          weight="bold"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkWrap: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
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
    marginBottom: 16,
    paddingHorizontal: 20,
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
  iconWrapSelected: {
    backgroundColor: clayColors.primarySoft,
  },
  optionDescription: {
    color: clayColors.caption,
    marginTop: 2,
  },
  optionLabel: {
    color: clayColors.text,
  },
  optionLabelSelected: {
    color: clayColors.primary,
  },
  optionRow: {
    alignItems: 'center',
    borderRadius: clayRadii.control,
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionRowSelected: {
    backgroundColor: clayColors.surfaceHigh,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionsList: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  overlay: {
    backgroundColor: 'rgba(74, 42, 53, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pill: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.pill,
    flexDirection: 'row',
    gap: 5,
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillCaret: {
    transform: [{ rotate: '-90deg' }],
  },
  pillStatic: {
    paddingRight: 8,
  },
  pillText: {
    color: clayColors.caption,
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: clayRadii.modal,
    borderTopRightRadius: clayRadii.modal,
    paddingBottom: 16,
  },
  sheetWrap: {
    width: '100%',
  },
  subtitle: {
    color: clayColors.caption,
    marginTop: 4,
  },
  title: {
    color: clayColors.text,
  },
});
