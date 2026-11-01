import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import { PrimaryButton } from '../../auth/components/PrimaryButton';
import { accountService } from '../accountService';

const RISKS = [
  'Người lạ có thể giả làm người quen để lừa tiền, đòi mã OTP hoặc hỏi thông tin cá nhân.',
  'Bạn có thể nhận lời lẽ khó chịu, quấy rối hoặc xúc phạm mà không biết ai gửi.',
  'Bạn không biết người gửi là ai, nên đừng tin những gì họ tự giới thiệu về mình.',
];

const SAFEGUARDS = [
  'Chỉ người đang theo dõi bạn, tài khoản đã xác thực email và có từ 7 ngày tuổi mới nhắn ẩn danh được.',
  'Tin ẩn danh chỉ có chữ: không ảnh, không đường link, không số điện thoại hay số tài khoản ngân hàng.',
  'Tin ẩn danh nằm trong "Tin nhắn chờ"; người gửi chỉ gửi được 3 tin cho tới khi bạn trả lời.',
  'Tin có dấu hiệu lừa đảo được đánh dấu cảnh báo.',
  'Bạn có thể chặn hoặc báo cáo ngay trong cuộc trò chuyện. Báo cáo sẽ đóng cuộc trò chuyện và tạm khoá quyền nhắn ẩn danh của người đó.',
  'Ẩn danh chỉ với bạn: đội ngũ quản trị vẫn biết người gửi là ai khi xử lý báo cáo.',
];

/** A plain list: a small square mark in the list's ink, then the sentence. */
function Bullets({ inkColor, items }: { inkColor: string; items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.item}>
          <View style={[styles.mark, { backgroundColor: inkColor }]} />
          <ClayText style={[styles.itemText, { color: inkColor }]} variant="body">
            {item}
          </ClayText>
        </View>
      ))}
    </View>
  );
}

/**
 * Turning anonymous messages on goes through this screen: the risks and the
 * safeguards are spelled out before the user confirms. Turning them off is
 * one tap, here or in Settings.
 */
export function AnonymousMessagesScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { updateUser, user } = useAuthSession();
  const isOn = user?.allowAnonymousMessages ?? false;
  const [isSaving, setIsSaving] = useState(false);

  const save = async (allow: boolean) => {
    setIsSaving(true);

    try {
      await accountService.setAllowAnonymousMessages(allow);
      updateUser({ allowAnonymousMessages: allow });
      showToast(allow ? 'Đã bật nhận tin nhắn ẩn danh.' : 'Đã tắt nhận tin nhắn ẩn danh.');
      navigation.back();
    } catch {
      showToast('Không lưu được thay đổi. Vui lòng thử lại.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Tin nhắn ẩn danh" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + claySpacing.xl }]}
      >
        {/* The current state, with the anonymous mask: the product's own safety mark */}
        <View style={styles.statusRow}>
          <ClayIcon color={clayColors.text} name="Mask" size={20} />
          <ClayText style={styles.statusLabel} variant="body">
            Nhận tin nhắn ẩn danh
          </ClayText>
          <View style={[styles.statusPill, isOn ? styles.statusPillOn : styles.statusPillOff]}>
            <ClayText
              style={[styles.statusText, { color: isOn ? clayColors.primaryInk : clayColors.textSecondary }]}
              variant="meta"
            >
              {isOn ? 'Đang bật' : 'Đang tắt'}
            </ClayText>
          </View>
        </View>

        <ClayText style={styles.intro} variant="body">
          Khi bật, người theo dõi bạn có thể bấm "Nhắn ẩn danh" trên trang cá nhân của bạn. Bạn sẽ
          thấy họ là "Người ẩn danh" cho tới khi họ tự tiết lộ. Việc cho phép trả lời ẩn danh story
          được chọn riêng cho từng story khi đăng.
        </ClayText>

        <View style={styles.risks}>
          <ClayText level={2} style={styles.risksTitle} variant="heading">
            Rủi ro bạn cần biết
          </ClayText>
          <Bullets inkColor={clayColors.warningInk} items={RISKS} />
        </View>

        <ClayText level={2} style={styles.sectionTitle} variant="heading">
          Cách ứng dụng bảo vệ bạn
        </ClayText>
        <Bullets inkColor={clayColors.text} items={SAFEGUARDS} />

        <View style={styles.actions}>
          {isOn ? (
            <PrimaryButton
              accessibilityLabel="Tắt nhận tin nhắn ẩn danh"
              disabled={isSaving}
              isLoading={isSaving}
              label="Tắt tin nhắn ẩn danh"
              onPress={() => void save(false)}
            />
          ) : (
            <>
              <PrimaryButton
                accessibilityLabel="Tôi đã hiểu rủi ro, bật nhận tin nhắn ẩn danh"
                disabled={isSaving}
                isLoading={isSaving}
                label="Tôi đã hiểu, bật tin nhắn ẩn danh"
                onPress={() => void save(true)}
              />
              <ClayButton
                accessibilityLabel="Để sau"
                disabled={isSaving}
                onPress={navigation.back}
                style={styles.cancel}
                title="Để sau"
                variant="secondary"
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: claySpacing.xl,
  },
  cancel: {
    marginTop: claySpacing.sm,
    minHeight: 52,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  content: {
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.base,
  },
  intro: {
    color: clayColors.text,
    lineHeight: 24,
    marginTop: claySpacing.base,
  },
  item: {
    flexDirection: 'row',
    gap: claySpacing.md,
  },
  itemText: {
    flex: 1,
    lineHeight: 24,
  },
  list: {
    gap: claySpacing.sm,
    marginTop: claySpacing.sm,
  },
  mark: {
    borderRadius: 1,
    height: 5,
    marginTop: 10,
    width: 5,
  },
  risks: {
    backgroundColor: clayColors.warningBg,
    borderColor: clayColors.warningBorder,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    marginTop: claySpacing.xl,
    padding: claySpacing.base,
  },
  risksTitle: {
    color: clayColors.warningInk,
  },
  sectionTitle: {
    marginTop: claySpacing.xl,
  },
  statusLabel: {
    flex: 1,
    fontFamily: fontFamilies.semiBold,
  },
  statusPill: {
    borderRadius: clayRadii.pill,
    paddingHorizontal: claySpacing.sm,
    paddingVertical: 2,
  },
  statusPillOff: {
    backgroundColor: clayColors.surfaceWell,
  },
  statusPillOn: {
    backgroundColor: clayColors.primarySoft,
  },
  statusRow: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: 52,
    paddingHorizontal: claySpacing.base,
  },
  statusText: {
    fontFamily: fontFamilies.medium,
  },
});
