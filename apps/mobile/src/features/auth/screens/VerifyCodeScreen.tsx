import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { tabularNums } from '../../../theme/typography';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { FormMessage } from '../components/FormMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
import { authService } from '../services/authService';
import { passwordResetService } from '../services/passwordResetService';
import { validateVerificationCode } from '../validation';

type VerifyCodeScreenProps = NativeStackScreenProps<AuthStackParamList, 'VerifyCode'>;

export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) {
    return email;
  }
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0] ?? ''}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyCodeScreen({ navigation, route }: VerifyCodeScreenProps) {
  const email = route.params?.email ?? '';
  const isEmailVerification = route.params?.mode === 'verifyEmail';
  const maskedEmail = maskEmail(email);

  const [code, setCode] = useState('');
  const codeRef = useRef('');
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown > 0]);

  // Arriving from Login with an unverified account: the old code has usually
  // expired, so request a fresh one right away.
  useEffect(() => {
    if (isEmailVerification && route.params?.resend) {
      void submit(() => authService.resendVerification(email));
    }
  }, []);

  const handleCodeChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
    codeRef.current = digitsOnly;
    setCode(digitsOnly);
    if (localError) {
      setLocalError(null);
    }
    reset();
  };

  const handleVerify = async () => {
    const currentCode = codeRef.current;
    const validationError = validateVerificationCode(currentCode);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    reset();

    if (isEmailVerification) {
      const verified = await submit(async () => {
        await authService.verifyEmail(email, currentCode);
        return true;
      });

      if (verified) {
        navigation.navigate('Login', {
          email,
          message: 'Email đã được xác minh. Hãy đăng nhập để tiếp tục.',
        });
      }

      return;
    }

    const result = await submit(() => passwordResetService.verifyResetCode(email, currentCode));
    if (result?.success) {
      navigation.navigate('NewPassword', { code: currentCode, email });
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) {
      return;
    }

    setLocalError(null);
    setResendStatus(null);
    reset();

    const result = await submit(async () => {
      if (isEmailVerification) {
        await authService.resendVerification(email);
        return { success: true };
      }

      return passwordResetService.requestResetCode(email);
    });
    if (result?.success) {
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setResendStatus('Đã gửi mã mới tới email của bạn.');
    }
  };

  const isVerifyDisabled = code.length < 6 || isSubmitting;

  return (
    <AuthScreenContainer
      back={{
        label: isEmailVerification ? 'Đăng nhập' : 'Quên mật khẩu',
        onPress: () => navigation.navigate(isEmailVerification ? 'Login' : 'ForgotPassword'),
      }}
      footerActionLabel="Đăng nhập"
      footerPrompt={isEmailVerification ? 'Đã xác minh rồi?' : 'Đã nhớ mật khẩu?'}
      onFooterAction={() => navigation.navigate('Login')}
      subtitle={`Nhập mã gồm 6 chữ số vừa gửi tới ${maskedEmail}.`}
      title={isEmailVerification ? 'Xác minh email' : 'Nhập mã xác minh'}
    >
      <Pressable
        accessibilityLabel="Verification code"
        accessibilityRole="none"
        onPress={() => inputRef.current?.focus()}
        style={styles.codeContainer}
      >
        <TextInput
          accessibilityLabel="Verification code input"
          autoFocus
          caretHidden
          keyboardType="number-pad"
          maxLength={6}
          onBlur={() => setIsFocused(false)}
          onChangeText={handleCodeChange}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={handleVerify}
          ref={inputRef}
          returnKeyType="done"
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
          value={code}
        />
        <View pointerEvents="none" style={styles.boxesRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const digit = code[index] ?? '';
            const isActive = isFocused && index === code.length;
            const hasError = Boolean(localError || submissionMessage);

            return (
              <View
                key={index}
                style={[
                  styles.digitBox,
                  isActive ? styles.digitBoxActive : undefined,
                  hasError ? styles.digitBoxError : undefined,
                ]}
              >
                <ClayText style={styles.digitText} variant="title">
                  {digit}
                </ClayText>
              </View>
            );
          })}
        </View>
      </Pressable>

      {localError ? (
        <ClayText accessibilityLiveRegion="polite" style={styles.errorText} variant="caption">
          {localError}
        </ClayText>
      ) : null}

      <FormMessage
        message={submissionMessage ?? resendStatus}
        tone={submissionMessage ? submissionTone : 'info'}
      />

      <View style={styles.resendContainer}>
        <Pressable
          accessibilityLabel="Resend code"
          accessibilityRole="button"
          disabled={countdown > 0 || isSubmitting}
          hitSlop={8}
          onPress={handleResend}
          style={styles.resendAction}
        >
          <ClayText
            style={[tabularNums, countdown > 0 ? styles.resendTextDisabled : styles.resendText]}
            variant="button"
          >
            {countdown > 0 ? `Gửi lại mã sau ${countdown} giây` : 'Gửi lại mã'}
          </ClayText>
        </Pressable>
      </View>

      <PrimaryButton
        accessibilityLabel="Verify code"
        disabled={isVerifyDisabled}
        isLoading={isSubmitting}
        label="Xác minh"
        onPress={handleVerify}
      />
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  boxesRow: {
    flexDirection: 'row',
    gap: claySpacing.sm,
    width: '100%',
  },
  codeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: claySpacing.base,
    position: 'relative',
    width: '100%',
  },
  // Six boxes share the width with one gap; the box with the caret takes the selected edge.
  digitBox: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderColor: clayColors.control,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: clayColors.primary,
    borderWidth: 2,
  },
  digitBoxError: {
    borderColor: clayColors.error,
  },
  digitText: {
    ...tabularNums,
    textAlign: 'center',
  },
  errorText: {
    color: clayColors.error,
    marginBottom: claySpacing.sm,
    marginTop: -claySpacing.sm,
  },
  hiddenInput: {
    height: '100%',
    opacity: 0.01,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  resendAction: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
  resendContainer: {
    alignItems: 'flex-start',
    marginBottom: claySpacing.sm,
    marginTop: -claySpacing.sm,
  },
  resendText: {
    color: clayColors.primaryInk,
  },
  resendTextDisabled: {
    color: clayColors.caption,
  },
});
