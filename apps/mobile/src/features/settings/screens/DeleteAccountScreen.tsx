import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { useAuthSession } from '../../auth/authSession';
import { AuthTextInput } from '../../auth/components/AuthTextInput';
import { FormMessage } from '../../auth/components/FormMessage';
import { useAuthSubmission } from '../../auth/hooks/useAuthSubmission';
import { accountService } from '../accountService';

// Matches the server (users.service deleteAccount): the account row is kept, emptied, so other people's chats and reports stay intact.
const CONSEQUENCES = [
  'Hồ sơ, ảnh đại diện, ảnh bìa, bài viết, tin và bình luận của bạn sẽ bị xoá.',
  'Lượt thích, cảm xúc, bài đăng lại, mục đã lưu và danh sách theo dõi của bạn sẽ bị xoá.',
  'Người đã nhắn với bạn vẫn giữ cuộc trò chuyện: tin bạn gửi hiện là "Tin nhắn đã bị xóa", tên bạn hiện là "Người dùng đã xóa".',
  'Báo cáo vi phạm liên quan đến tài khoản được giữ lại để đội kiểm duyệt xử lý.',
  'Không thể khôi phục tài khoản. Bạn có thể dùng lại email này để đăng ký tài khoản mới.',
];

/** Permanently delete the signed-in account, after re-confirming who is asking. */
export function DeleteAccountScreen() {
  const navigation = useAppNavigation();
  const { signOut, user } = useAuthSession();
  // Google-only accounts have no password, so they confirm by typing their username.
  const hasPassword = user?.hasPassword !== false;
  const [confirmation, setConfirmation] = useState('');
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const canContinue = hasPassword
    ? confirmation.length > 0
    : confirmation.trim() === user?.username;

  const handleDelete = async () => {
    setIsConfirmVisible(false);

    const deleted = await submit(async () => {
      await accountService.deleteAccount(
        hasPassword ? { password: confirmation } : { confirm: confirmation.trim() },
      );

      return true;
    });

    if (deleted) {
      // The token no longer belongs to anyone: the logout call answers 401,
      // which `signOut` already treats as "signed out".
      await signOut().catch(() => undefined);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Xoá tài khoản" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.warning}>
            <ClayText level={2} style={styles.warningTitle} variant="heading">
              Hành động này không thể hoàn tác
            </ClayText>
            {CONSEQUENCES.map((line) => (
              <View key={line} style={styles.warningItem}>
                <View style={styles.warningMark} />
                <ClayText style={styles.warningLine} variant="body">
                  {line}
                </ClayText>
              </View>
            ))}
          </View>

          <AuthTextInput
            accessibilityLabel={hasPassword ? 'Mật khẩu để xác nhận' : 'Tên người dùng để xác nhận'}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            label={
              hasPassword
                ? 'Nhập mật khẩu để xác nhận'
                : `Nhập tên người dùng "${user?.username ?? ''}" để xác nhận`
            }
            onChangeText={(value) => {
              setConfirmation(value);
              reset();
            }}
            password={hasPassword}
            value={confirmation}
          />
          <FormMessage message={submissionMessage} tone={submissionTone} />
          <ClayButton
            accessibilityLabel="Xoá tài khoản vĩnh viễn"
            disabled={!canContinue || isSubmitting}
            loading={isSubmitting}
            onPress={() => setIsConfirmVisible(true)}
            style={styles.deleteButton}
            title="Xoá tài khoản"
            variant="destructive"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        confirmLabel="Xoá vĩnh viễn"
        destructive
        icon="Trash"
        message="Hồ sơ và nội dung của bạn sẽ bị xoá ngay và không thể khôi phục."
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={handleDelete}
        title="Xoá tài khoản này?"
        visible={isConfirmVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  content: {
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.base,
  },
  deleteButton: {
    marginTop: claySpacing.sm,
    minHeight: 52,
  },
  flex: {
    flex: 1,
  },
  // The consequences on a plain card; the negative colour only on the title and the action.
  warning: {
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    gap: claySpacing.sm,
    marginBottom: claySpacing.xl,
    padding: claySpacing.base,
  },
  warningItem: {
    flexDirection: 'row',
    gap: claySpacing.md,
  },
  warningLine: {
    color: clayColors.text,
    flex: 1,
    lineHeight: 24,
  },
  warningMark: {
    backgroundColor: clayColors.text,
    borderRadius: 1,
    height: 5,
    marginTop: 10,
    width: 5,
  },
  warningTitle: {
    color: clayColors.errorInk,
  },
});
