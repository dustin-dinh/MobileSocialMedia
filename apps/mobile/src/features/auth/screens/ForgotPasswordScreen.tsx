import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { authColors } from '../authTheme';
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
      footerActionLabel="Log in"
      footerPrompt="Remember your password?"
      onFooterAction={() => navigation.navigate('Login')}
      subtitle="Enter your email to receive a 6-digit verification code."
      title="Forgot password"
    >
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate('Login')}
        style={styles.backButton}
      >
        <ClayIcon color={authColors.primary} name="CaretLeft" size={18} weight="bold" />
        <ClayText style={styles.backButtonText} variant="caption">
          Back to Log in
        </ClayText>
      </Pressable>

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
        placeholder="you@example.com"
        returnKeyType="done"
        textContentType="emailAddress"
        value={email}
      />

      <FormMessage message={submissionMessage} tone={submissionTone} />

      <PrimaryButton
        accessibilityLabel="Send reset code"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        label="Send code"
        onPress={handleSubmit}
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
});
