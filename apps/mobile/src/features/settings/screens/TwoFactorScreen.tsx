import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import { AuthTextInput } from '../../auth/components/AuthTextInput';
import { FormMessage } from '../../auth/components/FormMessage';
import { PrimaryButton } from '../../auth/components/PrimaryButton';
import { useAuthSubmission } from '../../auth/hooks/useAuthSubmission';
import { accountService } from '../accountService';

/**
 * Two-factor sign-in by emailed code. Turning it on or off asks for the
 * current password; a Google-only account sets a password first.
 */
export function TwoFactorScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { updateUser, user } = useAuthSession();
  const isOn = user?.twoFactorEnabled ?? false;
  const hasPassword = user?.hasPassword !== false;
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const handleSave = async () => {
    if (!password) {
      setPasswordError('Nhập mật khẩu hiện tại.');
      return;
    }

    const done = await submit(async () => {
      await accountService.setTwoFactor(!isOn, password);
      return true;
    });

    if (done) {
      updateUser({ twoFactorEnabled: !isOn });
      showToast(isOn ? 'Đã tắt xác thực hai lớp.' : 'Đã bật xác thực hai lớp.');
      navigation.back();
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Xác thực hai lớp" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + claySpacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.statusRow}>
            <ClayIcon color={clayColors.text} name="ShieldCheck" size={20} />
            <ClayText style={styles.statusLabel} variant="body">
              Mã đăng nhập qua email
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
            Khi bật, mỗi lần đăng nhập bạn cần nhập thêm mã gồm 6 chữ số gửi tới{' '}
            {user?.email ?? 'email của bạn'}. Người biết mật khẩu của bạn vẫn không vào được tài khoản
            nếu không có email.
          </ClayText>

          {hasPassword ? (
            <View style={styles.form}>
              <AuthTextInput
                accessibilityLabel="Mật khẩu hiện tại"
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isSubmitting}
                error={passwordError}
                label="Mật khẩu hiện tại"
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordError(undefined);
                  reset();
                }}
                onSubmitEditing={() => void handleSave()}
                password
                value={password}
              />
              <FormMessage message={submissionMessage} tone={submissionTone} />
              <PrimaryButton
                disabled={isSubmitting}
                isLoading={isSubmitting}
                label={isOn ? 'Tắt xác thực hai lớp' : 'Bật xác thực hai lớp'}
                onPress={() => void handleSave()}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.notice}>
                <ClayText style={styles.noticeText} variant="caption">
                  Tài khoản đăng nhập bằng Google chưa có mật khẩu. Hãy đặt mật khẩu trước, rồi quay lại
                  đây để bật xác thực hai lớp.
                </ClayText>
              </View>
              <PrimaryButton label="Đặt mật khẩu" onPress={() => navigation.open('ChangePassword')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: claySpacing.base,
  },
  flex: {
    flex: 1,
  },
  form: {
    marginTop: claySpacing.xl,
  },
  intro: {
    color: clayColors.text,
    lineHeight: 24,
    marginTop: claySpacing.base,
  },
  notice: {
    backgroundColor: clayColors.warningBg,
    borderColor: clayColors.warningBorder,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    marginBottom: claySpacing.base,
    paddingHorizontal: claySpacing.md,
    paddingVertical: 10,
  },
  noticeText: {
    color: clayColors.warningInk,
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
