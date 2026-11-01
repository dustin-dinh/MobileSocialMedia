import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import type { AuthStackParamList } from '../../../navigation/types';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { AuthTextInput } from '../components/AuthTextInput';
import { FormMessage } from '../components/FormMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
import { passwordResetService } from '../services/passwordResetService';
import {
  type FieldErrors,
  type NewPasswordFormValues,
  validateNewPassword,
} from '../validation';

type NewPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'NewPassword'>;

/**
 * Last step of "Forgot password": the emailed code and the new password are
 * sent together, because the backend validates the code at this point.
 */
export function NewPasswordScreen({ navigation, route }: NewPasswordScreenProps) {
  const { code, email } = route.params;
  const [values, setValues] = useState<NewPasswordFormValues>({
    confirmPassword: '',
    password: '',
  });
  const [errors, setErrors] = useState<FieldErrors<keyof NewPasswordFormValues>>({});
  const confirmInputRef = useRef<TextInput | null>(null);
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const updateField = (field: keyof NewPasswordFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    reset();
  };

  const handleSubmit = async () => {
    const nextErrors = validateNewPassword(values);

    setErrors(nextErrors);
    reset();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await submit(() =>
      passwordResetService.resetPassword(email, code, values.password),
    );

    if (result?.success) {
      navigation.navigate('Login', {
        email,
        message: 'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.',
      });
    }
  };

  return (
    <AuthScreenContainer
      back={{ label: 'Nhập mã khác', onPress: () => navigation.navigate('VerifyCode', { email }) }}
      footerActionLabel="Đăng nhập"
      footerPrompt="Đã nhớ mật khẩu?"
      onFooterAction={() => navigation.navigate('Login')}
      subtitle="Mật khẩu mới dùng cho lần đăng nhập sau trên mọi thiết bị."
      title="Mật khẩu mới"
    >
      <AuthTextInput
        accessibilityLabel="New password input"
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.password}
        label="Mật khẩu mới"
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={() => confirmInputRef.current?.focus()}
        password
        placeholder="Ít nhất 8 ký tự"
        returnKeyType="next"
        textContentType="newPassword"
        value={values.password}
      />
      <AuthTextInput
        accessibilityLabel="Confirm new password input"
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.confirmPassword}
        inputRef={confirmInputRef}
        label="Nhập lại mật khẩu mới"
        onChangeText={(value) => updateField('confirmPassword', value)}
        onSubmitEditing={handleSubmit}
        password
        returnKeyType="done"
        textContentType="newPassword"
        value={values.confirmPassword}
      />

      <FormMessage message={submissionMessage} tone={submissionTone} />

      <PrimaryButton
        accessibilityLabel="Save new password"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        label="Lưu mật khẩu"
        onPress={handleSubmit}
      />
    </AuthScreenContainer>
  );
}
