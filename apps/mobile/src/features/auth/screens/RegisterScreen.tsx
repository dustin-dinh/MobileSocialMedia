import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import { isGoogleSignInAvailable } from '../../../config/google';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAuthSession } from '../authSession';
import { clayColors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { AuthDivider } from '../components/AuthDivider';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { AuthTextInput } from '../components/AuthTextInput';
import { FormMessage } from '../components/FormMessage';
import { GoogleButton } from '../components/GoogleButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatBirthDateInput } from '../birthDate';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
import { authService } from '../services/authService';
import {
  type FieldErrors,
  type RegisterFormValues,
  validateRegister,
} from '../validation';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const INITIAL_VALUES: RegisterFormValues = {
  birthDate: '',
  confirmPassword: '',
  email: '',
  password: '',
  username: '',
};

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [errors, setErrors] = useState<FieldErrors<keyof RegisterFormValues>>({});
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const confirmPasswordInputRef = useRef<TextInput | null>(null);
  const birthDateInputRef = useRef<TextInput | null>(null);
  const { signInWithGoogle } = useAuthSession();
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const showGoogle = isGoogleSignInAvailable();

  const updateField = (field: keyof RegisterFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    reset();
  };

  const handleSubmit = () => {
    const nextErrors = validateRegister(values);

    setErrors(nextErrors);
    reset();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    void submit(() => authService.register(values)).then((user) => {
      if (user) {
        // The backend refuses logins until the emailed code is confirmed.
        navigation.replace('VerifyCode', {
          email: user.email,
          mode: 'verifyEmail',
        });
      }
    });
  };

  const handleGoogleSignIn = () => {
    reset();
    void submit(() => signInWithGoogle());
  };

  return (
    <AuthScreenContainer
      footerActionLabel="Đăng nhập"
      footerPrompt="Đã có tài khoản?"
      onFooterAction={() => navigation.navigate('Login')}
      subtitle="Mobile Social chỉ dành cho người từ 18 tuổi trở lên."
      title="Tạo tài khoản"
    >
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="username"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.username}
        label="Tên người dùng"
        onChangeText={(value) => updateField('username', value)}
        onSubmitEditing={() => birthDateInputRef.current?.focus()}
        placeholder="vd. minh.anh"
        returnKeyType="next"
        textContentType="username"
        value={values.username}
      />
      <AuthTextInput
        editable={!isSubmitting}
        error={errors.birthDate}
        inputRef={birthDateInputRef}
        keyboardType="number-pad"
        hint="Không hiện với người khác, chỉ dùng để xác nhận bạn đủ 18 tuổi."
        label="Ngày sinh"
        maxLength={10}
        onChangeText={(value) => updateField('birthDate', formatBirthDateInput(value))}
        onSubmitEditing={() => emailInputRef.current?.focus()}
        placeholder="NN/TT/NNNN"
        returnKeyType="next"
        value={values.birthDate}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.email}
        inputRef={emailInputRef}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => updateField('email', value)}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        placeholder="ten.ban@gmail.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={values.email}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.password}
        inputRef={passwordInputRef}
        label="Mật khẩu"
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
        password
        placeholder="Ít nhất 8 ký tự"
        returnKeyType="next"
        textContentType="newPassword"
        value={values.password}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.confirmPassword}
        inputRef={confirmPasswordInputRef}
        label="Nhập lại mật khẩu"
        onChangeText={(value) => updateField('confirmPassword', value)}
        onSubmitEditing={handleSubmit}
        password
        returnKeyType="done"
        textContentType="newPassword"
        value={values.confirmPassword}
      />
      <FormMessage message={submissionMessage} tone={submissionTone} />
      <ClayText style={styles.legal} variant="meta">
        Khi tạo tài khoản, bạn đồng ý với{' '}
        <ClayText
          accessibilityRole="link"
          onPress={() => navigation.navigate('Legal', { doc: 'terms' })}
          style={styles.legalLink}
          variant="meta"
        >
          Điều khoản sử dụng
        </ClayText>{' '}
        và{' '}
        <ClayText
          accessibilityRole="link"
          onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}
          style={styles.legalLink}
          variant="meta"
        >
          Chính sách quyền riêng tư
        </ClayText>{' '}
        của Mobile Social.
      </ClayText>
      <PrimaryButton isLoading={isSubmitting} label="Tạo tài khoản" onPress={handleSubmit} />
      {showGoogle && (
        <>
          <AuthDivider />
          <GoogleButton
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onPress={handleGoogleSignIn}
          />
        </>
      )}
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  legal: {
    marginBottom: 16,
  },
  legalLink: {
    color: clayColors.primaryInk,
    fontFamily: fontFamilies.semiBold,
  },
});
