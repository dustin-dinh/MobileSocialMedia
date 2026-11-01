import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { showToast } from '../../../components/common/toast';
import { ClayText } from '../../../components/ui/ClayText';
import { ApiError } from '../../../services/apiError';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { accountService } from '../../settings/accountService';
import { useAuthSession } from '../authSession';
import { birthDateProblem, formatBirthDateInput, parseBirthDateInput } from '../birthDate';
import { AuthBrand } from '../components/AuthBrand';
import { AuthTextInput } from '../components/AuthTextInput';
import { PrimaryButton } from '../components/PrimaryButton';

const PROBLEMS = {
  future: 'Ngày sinh không thể ở tương lai.',
  invalid: 'Nhập ngày sinh theo dạng NN/TT/NNNN, ví dụ 05/09/1998.',
  missing: 'Nhập ngày sinh của bạn.',
  underage: null,
} as const;

/**
 * One-time date of birth for accounts that have none (accounts created before
 * the 18+ rule, Google sign-ups). Shown before anything else in the app. The
 * date cannot be changed afterwards; under 18 locks the account.
 */
export function BirthDateScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, updateUser } = useAuthSession();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleContinue = () => {
    const problem = birthDateProblem(value);

    // Under 18 still goes to the server: the account must be locked there, not only here.
    if (problem && problem !== 'underage') {
      setError(PROBLEMS[problem]);
      return;
    }

    setIsConfirmVisible(true);
  };

  const handleConfirm = async () => {
    const birthDate = parseBirthDateInput(value);

    if (!birthDate) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await accountService.setBirthDate(birthDate);

      setIsConfirmVisible(false);

      if (result.ageLocked) {
        setIsLocked(true);
      } else {
        updateUser({ birthDate });
      }
    } catch (caught) {
      setIsConfirmVisible(false);
      showToast(
        caught instanceof ApiError ? caught.message : 'Không lưu được ngày sinh. Vui lòng thử lại.',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLocked) {
    return (
      <View style={[styles.container, styles.content, { paddingBottom: insets.bottom + claySpacing.base, paddingTop: insets.top + claySpacing.sm }]}>
        <View style={styles.topRow}>
          <AuthBrand />
        </View>
        <ClayText level={1} style={styles.title} variant="title">
          Tài khoản đang bị khoá
        </ClayText>
        <ClayText style={styles.text} variant="body">
          Mobile Social chỉ dành cho người từ 18 tuổi trở lên. Theo ngày sinh bạn vừa khai, bạn chưa đủ
          18 tuổi nên tài khoản này đã bị khoá.
        </ClayText>
        <View style={styles.notice}>
          <ClayText style={styles.noticeText} variant="caption">
            Dữ liệu của bạn không bị xoá. Nếu bạn khai nhầm ngày sinh, hãy liên hệ bộ phận hỗ trợ.
          </ClayText>
        </View>
        <PrimaryButton label="Đăng xuất" onPress={() => void signOut().catch(() => undefined)} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + claySpacing.base, paddingTop: insets.top + claySpacing.sm }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <AuthBrand />
        </View>
        <ClayText level={1} style={styles.title} variant="title">
          Ngày sinh của bạn
        </ClayText>
        <ClayText style={styles.text} variant="body">
          Mobile Social chỉ dành cho người từ 18 tuổi trở lên. Ngày sinh không hiện với người khác và
          chỉ khai một lần, không đổi được sau này.
        </ClayText>
        <AuthTextInput
          accessibilityLabel="Ngày sinh, dạng ngày tháng năm"
          editable={!isSaving}
          error={error ?? undefined}
          keyboardType="number-pad"
          label="Ngày sinh"
          maxLength={10}
          onChangeText={(text) => {
            setValue(formatBirthDateInput(text));
            setError(null);
          }}
          onSubmitEditing={handleContinue}
          placeholder="NN/TT/NNNN"
          value={value}
        />
        <PrimaryButton
          accessibilityLabel="Tiếp tục với ngày sinh này"
          disabled={isSaving}
          isLoading={isSaving}
          label="Tiếp tục"
          onPress={handleContinue}
        />
        <Pressable
          accessibilityLabel="Đăng xuất"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => void signOut().catch(() => undefined)}
          style={styles.signOut}
        >
          <ClayText style={styles.signOutText} variant="button">
            Đăng xuất
          </ClayText>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        confirmLabel="Xác nhận"
        icon="Cake"
        isBusy={isSaving}
        message={`Ngày sinh ${value} sẽ được lưu và không thể sửa lại.`}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={handleConfirm}
        title="Xác nhận ngày sinh?"
        visible={isConfirmVisible}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: clayDimensions.gutter,
  },
  notice: {
    backgroundColor: clayColors.warningBg,
    borderColor: clayColors.warningBorder,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    marginBottom: claySpacing.xl,
    paddingHorizontal: claySpacing.md,
    paddingVertical: 10,
  },
  noticeText: {
    color: clayColors.warningInk,
  },
  signOut: {
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget,
  },
  signOutText: {
    color: clayColors.textSecondary,
  },
  text: {
    color: clayColors.textSecondary,
    marginBottom: claySpacing.xl,
    marginTop: claySpacing.sm,
  },
  title: {
    marginTop: claySpacing.xl,
  },
  topRow: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
});
