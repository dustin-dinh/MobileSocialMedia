import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { claySpacing } from '../../../theme/spacing';
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

function Bullets({ icon, items, title }: { icon: string; items: string[]; title: string }) {
  return (
    <View style={styles.section}>
      <ClayText style={styles.sectionTitle} variant="heading">
        {title}
      </ClayText>
      {items.map((item) => (
        <View key={item} style={styles.item}>
          <ClayIcon color={clayColors.primary} name={icon} size={18} />
          <ClayText style={styles.itemText} variant="body">
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
      <ScrollView contentContainerStyle={styles.content}>
        <ClayText style={styles.intro} variant="body">
          Khi bật, người theo dõi bạn có thể bấm "Nhắn ẩn danh" trên trang cá nhân của bạn. Bạn sẽ
          thấy họ là "Người ẩn danh" cho tới khi họ tự tiết lộ. Việc cho phép trả lời ẩn danh story
          được chọn riêng cho từng story khi đăng.
        </ClayText>
        <Bullets icon="TriangleWarning" items={RISKS} title="Rủi ro" />
        <Bullets icon="ShieldCheck" items={SAFEGUARDS} title="Cách ứng dụng bảo vệ bạn" />

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cancel: {
    marginTop: claySpacing.sm,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  content: {
    padding: claySpacing.lg,
  },
  intro: {
    color: clayColors.textSecondary,
  },
  item: {
    flexDirection: 'row',
    gap: claySpacing.sm,
    marginTop: claySpacing.sm,
  },
  itemText: {
    color: clayColors.text,
    flex: 1,
  },
  section: {
    marginBottom: claySpacing.lg,
    marginTop: claySpacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
  },
});
