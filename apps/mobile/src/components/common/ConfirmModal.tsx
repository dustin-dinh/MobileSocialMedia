import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { clayColors } from '../../theme/colors';
import { clayDimensions } from '../../theme/spacing';
import { ClayIcon } from '../icons/ClayIcon';
import { ClayButton } from '../ui/ClayButton';
import { ClaySurface } from '../ui/ClaySurface';
import { ClayText } from '../ui/ClayText';
import { ToastHost } from './toast';

export type ConfirmModalProps = {
  cancelLabel?: string;
  confirmLabel: string;
  /** Red confirm button and icon, for actions that cannot be undone. */
  destructive?: boolean;
  icon?: string;
  /** Disables both buttons and blocks dismissal while the action runs. */
  isBusy?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

/**
 * Clay confirmation pop-up shared by every destructive or irreversible action
 * (delete comment, sign out, block, delete account...).
 */
export function ConfirmModal({
  cancelLabel = 'Huỷ',
  confirmLabel,
  destructive = false,
  icon = 'WarningCircle',
  isBusy = false,
  message,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmModalProps) {
  const accent = destructive ? clayColors.error : clayColors.primary;

  return (
    <Modal
      animationType="fade"
      onRequestClose={isBusy ? undefined : onCancel}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Đóng hộp thoại xác nhận"
        accessibilityRole="button"
        disabled={isBusy}
        onPress={onCancel}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel={title}
          onPress={() => {
            // Taps inside the dialog must not dismiss it.
          }}
          style={styles.dialogWrap}
        >
          <ClaySurface variant="dialog" style={styles.dialog}>
            <View style={styles.icon}>
              <ClayIcon color={accent} name={icon} size={24} />
            </View>

            <ClayText variant="heading" style={styles.title}>
              {title}
            </ClayText>
            <ClayText variant="body" style={styles.message}>
              {message}
            </ClayText>

            <View style={styles.actions}>
              <View style={styles.buttonHalf}>
                <ClayButton
                  accessibilityLabel={cancelLabel}
                  disabled={isBusy}
                  onPress={onCancel}
                  style={styles.actionButton}
                  variant="secondary"
                >
                  {cancelLabel}
                </ClayButton>
              </View>
              <View style={styles.buttonHalf}>
                <ClayButton
                  accessibilityLabel={confirmLabel}
                  disabled={isBusy}
                  isLoading={isBusy}
                  onPress={onConfirm}
                  style={[styles.actionButton, destructive ? styles.destructiveButton : undefined]}
                  variant="primary"
                >
                  {confirmLabel}
                </ClayButton>
              </View>
            </View>
          </ClaySurface>
        </Pressable>
        <ToastHost bottomOffset={24} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    minHeight: clayDimensions.minTouchTarget,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  buttonHalf: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: clayColors.error,
  },
  dialog: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  dialogWrap: {
    maxWidth: 400,
    width: '88%',
  },
  // A plain icon over the title: no tinted disc.
  icon: {
    marginBottom: 12,
  },
  message: {
    color: clayColors.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 12, 16, 0.45)',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: clayColors.text,
    textAlign: 'center',
  },
});
