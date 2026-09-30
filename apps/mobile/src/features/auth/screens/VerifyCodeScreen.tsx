import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { authColors } from '../authTheme';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { FormMessage } from '../components/FormMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
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

    const result = await submit(() => passwordResetService.verifyResetCode(email, currentCode));
    if (result?.success) {
      navigation.navigate('Login', {
        email,
        message: 'Password reset verified. Please sign in.',
      });
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) {
      return;
    }

    setLocalError(null);
    setResendStatus(null);
    reset();

    const result = await submit(() => passwordResetService.requestResetCode(email));
    if (result?.success) {
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setResendStatus('New verification code sent.');
    }
  };

  const isVerifyDisabled = code.length < 6 || isSubmitting;

  return (
    <AuthScreenContainer
      footerActionLabel="Log in"
      footerPrompt="Remember your password?"
      onFooterAction={() => navigation.navigate('Login')}
      subtitle={`Enter the 6-digit code sent to ${maskedEmail}`}
      title="Verify code"
    >
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.backButton}
      >
        <ClayIcon color={authColors.primary} name="CaretLeft" size={18} weight="bold" />
        <ClayText style={styles.backButtonText} variant="caption">
          Back to Forgot password
        </ClayText>
      </Pressable>

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
                  digit ? styles.digitBoxFilled : undefined,
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
            style={countdown > 0 ? styles.resendTextDisabled : styles.resendText}
            variant="caption"
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </ClayText>
        </Pressable>
      </View>

      <PrimaryButton
        accessibilityLabel="Verify code"
        disabled={isVerifyDisabled}
        isLoading={isSubmitting}
        label="Verify code"
        onPress={handleVerify}
      />
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 4,
  },
  backButtonText: {
    color: authColors.primary,
    marginLeft: 4,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  codeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: claySpacing.base,
    position: 'relative',
    width: '100%',
  },
  digitBox: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderColor: clayColors.border,
    borderRadius: claySpacing.md,
    borderWidth: 1.5,
    height: 52,
    justifyContent: 'center',
    width: 44,
  },
  digitBoxActive: {
    borderColor: clayColors.primary,
  },
  digitBoxError: {
    borderColor: clayColors.error,
  },
  digitBoxFilled: {
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
  },
  digitText: {
    color: clayColors.text,
    fontSize: 22,
    textAlign: 'center',
  },
  errorText: {
    color: clayColors.error,
    marginBottom: claySpacing.sm,
    marginTop: claySpacing.xs,
    textAlign: 'center',
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
    paddingHorizontal: claySpacing.sm,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: claySpacing.sm,
  },
  resendText: {
    color: authColors.primary,
  },
  resendTextDisabled: {
    color: clayColors.caption,
  },
});
