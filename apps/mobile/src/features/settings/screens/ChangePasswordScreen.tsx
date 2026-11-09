import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { useAuthSession } from '../../auth/authSession';
import { AuthTextInput } from '../../auth/components/AuthTextInput';
import { FormMessage } from '../../auth/components/FormMessage';
import { PrimaryButton } from '../../auth/components/PrimaryButton';
import { useAuthSubmission } from '../../auth/hooks/useAuthSubmission';
import { validateNewPassword } from '../../auth/validation';
import { accountService } from '../accountService';

type Fields = 'confirmPassword' | 'currentPassword' | 'password';

/** Change the password, or set the first one on a Google-only account. */
export function ChangePasswordScreen() {
  const navigation = useAppNavigation();
  const { replaceAccessToken, updateUser, user } = useAuthSession();
  // Google-only accounts have no current password to ask for.
  const hasPassword = user?.hasPassword !== false;
  const [values, setValues] = useState<Record<Fields, string>>({
    confirmPassword: '',
    currentPassword: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const updateField = (field: Fields, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    reset();
  };

  const handleSubmit = async () => {
    const nextErrors: Partial<Record<Fields, string>> = validateNewPassword(values);

    if (hasPassword && !values.currentPassword) {
      nextErrors.currentPassword = 'Nhập mật khẩu hiện tại.';
    } else if (hasPassword && values.currentPassword === values.password) {
      nextErrors.password = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    }

    setErrors(nextErrors);
    reset();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const done = await submit(async () => {
      const { accessToken } = await accountService.changePassword(
        hasPassword ? values.currentPassword : undefined,
        values.password,
      );

      // The old token is revoked on the server: keep this device signed in with the new one.
      if (accessToken) {
        await replaceAccessToken(accessToken);
      }

      return true;
    });

    if (done) {
      updateUser?.({ hasPassword: true });
      showToast(hasPassword ? 'Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.' : 'Đã đặt mật khẩu.');
      navigation.back();
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        onBack={navigation.back}
        title={hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {hasPassword ? (
            <AuthTextInput
              accessibilityLabel="Mật khẩu hiện tại"
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!isSubmitting}
              error={errors.currentPassword}
              label="Mật khẩu hiện tại"
              onChangeText={(value) => updateField('currentPassword', value)}
              password
              value={values.currentPassword}
            />
          ) : null}
          <AuthTextInput
            accessibilityLabel="Mật khẩu mới"
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!isSubmitting}
            error={errors.password}
            label="Mật khẩu mới"
            onChangeText={(value) => updateField('password', value)}
            hint="Ít nhất 8 ký tự."
            password
            value={values.password}
          />
          <AuthTextInput
            accessibilityLabel="Nhập lại mật khẩu mới"
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!isSubmitting}
            error={errors.confirmPassword}
            label="Nhập lại mật khẩu mới"
            onChangeText={(value) => updateField('confirmPassword', value)}
            onSubmitEditing={handleSubmit}
            password
            value={values.confirmPassword}
          />
          <FormMessage message={submissionMessage} tone={submissionTone} />
          <PrimaryButton
            accessibilityLabel="Lưu mật khẩu mới"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            label="Lưu mật khẩu"
            onPress={handleSubmit}
          />
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
    paddingVertical: claySpacing.xl,
  },
  flex: {
    flex: 1,
  },
});
