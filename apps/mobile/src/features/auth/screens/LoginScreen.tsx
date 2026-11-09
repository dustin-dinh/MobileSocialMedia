import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, type TextInput } from 'react-native';

import { isGoogleSignInAvailable } from '../../../config/google';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { ApiError } from '../../../services/apiError';
import { useAuthSession } from '../authSession';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { AuthDivider } from '../components/AuthDivider';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { AuthTextInput } from '../components/AuthTextInput';
import { FormMessage } from '../components/FormMessage';
import { GoogleButton } from '../components/GoogleButton';
import { LegalConsent } from '../components/LegalConsent';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
import { TwoFactorRequiredError } from '../services/authService';
import {
  type FieldErrors,
  type LoginFormValues,
  validateLogin,
} from '../validation';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

export function LoginScreen({ navigation, route }: LoginScreenProps) {
  const [errors, setErrors] = useState<FieldErrors<keyof LoginFormValues>>({});
  const [values, setValues] = useState<LoginFormValues>({
    ...INITIAL_VALUES,
    email: route.params?.email ?? '',
  });
  const [successMessage, setSuccessMessage] = useState(route.params?.message ?? null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const { signIn, signInWithGoogle } = useAuthSession();
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const showGoogle = isGoogleSignInAvailable();

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setSuccessMessage(null);
    reset();
  };

  // Two-factor accounts: the password (or Google) was right, a code was emailed.
  const goToTwoFactor = (error: unknown): boolean => {
    if (!(error instanceof TwoFactorRequiredError)) {
      return false;
    }

    navigation.navigate('VerifyCode', {
      challengeToken: error.challengeToken,
      email: error.email,
      mode: 'twoFactor',
    });
    return true;
  };

  const handleSubmit = () => {
    const nextErrors = validateLogin(values);

    setErrors(nextErrors);
    reset();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    void submit(async () => {
      try {
        await signIn(values);
      } catch (error) {
        if (goToTwoFactor(error)) {
          return;
        }

        if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
          navigation.navigate('VerifyCode', {
            email: values.email.trim().toLowerCase(),
            mode: 'verifyEmail',
            resend: true,
          });
          return;
        }

        throw error;
      }
    });
  };

  const handleGoogleSignIn = () => {
    reset();
    setSuccessMessage(null);
    void submit(async () => {
      try {
        await signInWithGoogle();
      } catch (error) {
        if (!goToTwoFactor(error)) {
          throw error;
        }
      }
    });
  };

  return (
    <AuthScreenContainer
      about="Mạng xã hội cho người từ 18 tuổi: đăng ảnh, video và tin, nhắn tin với bạn bè."
      footerActionLabel="Tạo tài khoản"
      footerPrompt="Chưa có tài khoản?"
      onFooterAction={() => navigation.navigate('Register')}
      title="Đăng nhập"
    >
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.email}
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
        autoComplete="current-password"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.password}
        inputRef={passwordInputRef}
        label="Mật khẩu"
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={handleSubmit}
        password
        placeholder="Nhập mật khẩu"
        returnKeyType="done"
        textContentType="password"
        value={values.password}
      />
      <Pressable
        accessibilityLabel="Forgot password?"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotPasswordAction}
      >
        <ClayText variant="button" style={styles.forgotPasswordText}>
          Quên mật khẩu?
        </ClayText>
      </Pressable>
      <FormMessage
        message={submissionMessage ?? successMessage}
        tone={submissionMessage ? submissionTone : 'info'}
      />
      <PrimaryButton isLoading={isSubmitting} label="Đăng nhập" onPress={handleSubmit} />
      {showGoogle && (
        <>
          <AuthDivider />
          <LegalConsent
            lead="Khi tiếp tục với Google, bạn đồng ý với"
            onOpenDoc={(doc) => navigation.navigate('Legal', { doc })}
          />
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
  forgotPasswordAction: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: -8,
    minHeight: clayDimensions.minTouchTarget,
  },
  forgotPasswordText: {
    color: clayColors.primaryInk,
  },
});
