import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, type TextInput } from 'react-native';

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
        message: 'Password updated. Sign in with your new password.',
      });
    }
  };

  return (
    <AuthScreenContainer
      footerActionLabel="Log in"
      footerPrompt="Remember your password?"
      onFooterAction={() => navigation.navigate('Login')}
      subtitle="Choose a new password for your account."
      title="New password"
    >
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate('VerifyCode', { email })}
        style={styles.backButton}
      >
        <ClayIcon color={authColors.primary} name="CaretLeft" size={18} weight="bold" />
        <ClayText style={styles.backButtonText} variant="caption">
          Enter a different code
        </ClayText>
      </Pressable>

      <AuthTextInput
        accessibilityLabel="New password input"
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.password}
        label="New password"
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={() => confirmInputRef.current?.focus()}
        password
        placeholder="At least 8 characters"
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
        label="Confirm new password"
        onChangeText={(value) => updateField('confirmPassword', value)}
        onSubmitEditing={handleSubmit}
        password
        placeholder="Re-enter the new password"
        returnKeyType="done"
        textContentType="newPassword"
        value={values.confirmPassword}
      />

      <FormMessage message={submissionMessage} tone={submissionTone} />

      <PrimaryButton
        accessibilityLabel="Save new password"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        label="Save password"
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
