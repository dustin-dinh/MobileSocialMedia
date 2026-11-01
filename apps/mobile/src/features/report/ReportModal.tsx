import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { showToast, ToastHost } from '../../components/common/toast';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClaySurface } from '../../components/ui/ClaySurface';
import { ClayText } from '../../components/ui/ClayText';
import { clayColors } from '../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../theme/spacing';
import { REPORT_REASONS, reportService, type ReportReason, type ReportTarget } from './reportService';

type ReportModalProps = {
  onClose: () => void;
  /** Called after the report was accepted, e.g. to hide the content locally. */
  onReported?: () => void;
  target: ReportTarget | null;
};

const TITLES: Record<ReportTarget['type'], string> = {
  COMMENT: 'Báo cáo bình luận',
  CONVERSATION: 'Báo cáo cuộc trò chuyện',
  POST: 'Báo cáo bài viết',
  USER: 'Báo cáo người dùng',
};

/**
 * Reason picker used for posts, comments, users and conversations: choose one
 * reason, then send. The sheet stays open on a failed send so it can be retried.
 */
export function ReportModal({ onClose, onReported, target }: ReportModalProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Every new target starts with no reason chosen.
  useEffect(() => {
    setReason(null);
    setIsSending(false);
  }, [target]);

  const handleSubmit = async () => {
    if (!target || !reason) {
      return;
    }

    setIsSending(true);

    try {
      await reportService.report(target, reason);
      showToast(
        target.type === 'CONVERSATION'
          ? 'Đã gửi báo cáo kèm các tin nhắn. Chúng tôi sẽ xem xét.'
          : 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.',
      );
      onClose();
      onReported?.();
    } catch {
      showToast('Không gửi được báo cáo. Vui lòng thử lại.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={isSending ? undefined : onClose}
      transparent
      visible={target !== null}
    >
      <Pressable
        accessibilityLabel="Đóng bảng báo cáo"
        accessibilityRole="button"
        disabled={isSending}
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel={target ? TITLES[target.type] : undefined}
          onPress={() => {
            // Taps inside the sheet must not dismiss it.
          }}
          style={styles.sheetWrap}
        >
          <ClaySurface
            style={[styles.sheet, { paddingBottom: insets.bottom + claySpacing.base }]}
            variant="modal"
          >
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <ClayText level={2} style={styles.title} variant="heading">
              {target ? TITLES[target.type] : ''}
            </ClayText>
            <ClayText style={styles.subtitle} variant="caption">
              Chọn lý do phù hợp nhất. Chúng tôi sẽ xem xét báo cáo của bạn.
            </ClayText>

            <View accessibilityRole="radiogroup" style={styles.list}>
              {REPORT_REASONS.map((item, index) => {
                const isSelected = item.code === reason;

                return (
                  <Pressable
                    accessibilityLabel={item.label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected, disabled: isSending }}
                    disabled={isSending}
                    key={item.code}
                    onPress={() => setReason(item.code)}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowRule,
                      (pressed || isSelected) && styles.rowSelected,
                    ]}
                  >
                    <ClayText style={styles.rowLabel} variant="body">
                      {item.label}
                    </ClayText>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <ClayButton
                accessibilityLabel="Gửi báo cáo"
                disabled={!reason}
                loading={isSending}
                onPress={() => void handleSubmit()}
                style={styles.submit}
                title="Gửi báo cáo"
                variant="primary"
              />
            </View>
          </ClaySurface>
        </Pressable>
        <ToastHost bottomOffset={24} />
      </Pressable>
    </Modal>
  );
}

const RADIO_SIZE = 20;

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.base,
  },
  handle: {
    backgroundColor: clayColors.border,
    borderRadius: clayRadii.pill,
    height: 4,
    width: 36,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: claySpacing.sm,
  },
  list: {
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    borderTopColor: clayColors.border,
    borderTopWidth: 1,
    marginTop: claySpacing.base,
  },
  overlay: {
    backgroundColor: 'rgba(20,12,16,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  radio: {
    alignItems: 'center',
    borderColor: clayColors.control,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 1.5,
    height: RADIO_SIZE,
    justifyContent: 'center',
    width: RADIO_SIZE,
  },
  radioDot: {
    backgroundColor: clayColors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioSelected: {
    borderColor: clayColors.primary,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: 48,
    paddingHorizontal: clayDimensions.gutter,
  },
  rowLabel: {
    flex: 1,
  },
  rowRule: {
    borderTopColor: clayColors.rule,
    borderTopWidth: 1,
  },
  rowSelected: {
    backgroundColor: clayColors.primarySoft,
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetWrap: {
    width: '100%',
  },
  submit: {
    minHeight: 48,
  },
  subtitle: {
    marginTop: 2,
    paddingHorizontal: clayDimensions.gutter,
  },
  title: {
    paddingHorizontal: clayDimensions.gutter,
  },
});
