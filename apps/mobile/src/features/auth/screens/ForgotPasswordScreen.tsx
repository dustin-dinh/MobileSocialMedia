import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';

import type { AuthStackParamList } from '../../../navigation/types';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { AuthTextInput } from '../components/AuthTextInput';
import { FormMessage } from '../components/FormMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
import { passwordResetService } from '../services/passwordResetService';
import {
  type FieldErrors,
  type ForgotPasswordFormValues,
  validateForgotPassword,
} from '../validation';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const emailRef = useRef('');
  const [errors, setErrors] = useState<FieldErrors<keyof ForgotPasswordFormValues>>({});
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const handleEmailChange = (value: string) => {
    emailRef.current = value;
    setEmail(value);
    if (errors.email) {
      setErrors((current) => ({ ...current, email: undefined }));
    }
    reset();
  };

  const handleSubmit = async () => {
    const currentEmail = emailRef.current;
    const nextErrors = validateForgotPassword({ email: currentEmail });
    setErrors(nextErrors);
    reset();

    if (nextErrors.email) {
      return;
    }

    const result = await submit(() => passwordResetService.requestResetCode(currentEmail));
    if (result?.success) {
      navigation.navigate('VerifyCode', { email: currentEmail.trim().toLowerCase() });
    }
  };

  return (
    <AuthScreenContainer
      back={{ label: 'Đăng nhập', onPress: () => navigation.navigate('Login') }}
      subtitle="Nhập email của tài khoản. Chúng tôi sẽ gửi một mã gồm 6 chữ số để bạn đặt lại mật khẩu."
      title="Quên mật khẩu"
    >
      <AuthTextInput
        accessibilityLabel="Email input"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.email}
        keyboardType="email-address"
        label="Email"
        onChangeText={handleEmailChange}
        onSubmitEditing={handleSubmit}
        placeholder="ten.ban@gmail.com"
        returnKeyType="done"
        textContentType="emailAddress"
        value={email}
      />

      <FormMessage message={submissionMessage} tone={submissionTone} />

      <PrimaryButton
        accessibilityLabel="Send reset code"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        label="Gửi mã"
        onPress={handleSubmit}
      />
    </AuthScreenContainer>
  );
}
